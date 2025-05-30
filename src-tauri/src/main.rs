// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod music_player;
mod system_info;

use music_player::MusicInfo;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use system_info::SystemInfo;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, serde::Serialize)]
struct SystemPayload {
    cpu_usage: f32,
    memory_used: u64,
    memory_total: u64,
    battery_level: f32,
    battery_charging: bool,
}

#[derive(Clone, serde::Serialize)]
struct MusicPayload {
    is_playing: bool,
    title: String,
    artist: String,
    album: String,
    cover_art_url: String,
    duration: u64,
    position: u64,
}

#[tauri::command]
async fn get_system_info(
    state: tauri::State<'_, Arc<Mutex<SystemInfo>>>,
) -> Result<SystemPayload, String> {
    let mut system_info = state.lock().map_err(|_| "Failed to acquire lock")?;
    system_info.refresh();

    Ok(SystemPayload {
        cpu_usage: system_info.cpu_usage(),
        memory_used: system_info.memory_used(),
        memory_total: system_info.memory_total(),
        battery_level: system_info.battery_level(),
        battery_charging: system_info.battery_is_charging(),
    })
}

#[tauri::command]
async fn get_music_info(
    state: tauri::State<'_, Arc<Mutex<MusicInfo>>>,
) -> Result<MusicPayload, String> {
    let mut music_info = state.lock().map_err(|_| "Failed to acquire lock")?;
    music_info.refresh();

    Ok(MusicPayload {
        is_playing: music_info.is_playing(),
        title: music_info.title(),
        artist: music_info.artist(),
        album: music_info.album(),
        cover_art_url: music_info.cover_art_url(),
        duration: music_info.duration(),
        position: music_info.position(),
    })
}

#[tauri::command]
async fn music_play_pause(state: tauri::State<'_, Arc<Mutex<MusicInfo>>>) -> Result<bool, String> {
    let mut music_info = state.lock().map_err(|_| "Failed to acquire lock")?;
    music_info.play_pause();
    Ok(music_info.is_playing())
}

#[tauri::command]
async fn music_next(state: tauri::State<'_, Arc<Mutex<MusicInfo>>>) -> Result<(), String> {
    let mut music_info = state.lock().map_err(|_| "Failed to acquire lock")?;
    music_info.next();
    Ok(())
}

#[tauri::command]
async fn music_previous(state: tauri::State<'_, Arc<Mutex<MusicInfo>>>) -> Result<(), String> {
    let mut music_info = state.lock().map_err(|_| "Failed to acquire lock")?;
    music_info.previous();
    Ok(())
}

// Function to create a background task for system and music monitoring
fn spawn_background_task(
    app_handle: AppHandle,
    system_info: Arc<Mutex<SystemInfo>>,
    music_info: Arc<Mutex<MusicInfo>>,
) {
    // Use tokio spawn for the background task
    tauri::async_runtime::spawn(async move {
        loop {
            // Process system info updates
            {
                let mut sys_info = system_info.lock().unwrap();
                sys_info.refresh();
                let payload = SystemPayload {
                    cpu_usage: sys_info.cpu_usage(),
                    memory_used: sys_info.memory_used(),
                    memory_total: sys_info.memory_total(),
                    battery_level: sys_info.battery_level(),
                    battery_charging: sys_info.battery_is_charging(),
                };

                // Emit the system update event
                _ = app_handle.emit_to("main", "system_update", payload);
            }

            // Process music info updates
            {
                let mut music = music_info.lock().unwrap();
                music.refresh();
                let payload = MusicPayload {
                    is_playing: music.is_playing(),
                    title: music.title(),
                    artist: music.artist(),
                    album: music.album(),
                    cover_art_url: music.cover_art_url(),
                    duration: music.duration(),
                    position: music.position(),
                };

                // Emit the music update event
                _ = app_handle.emit_to("main", "music_update", payload);
            }

            // Sleep before next update
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });
}

fn main() {
    // Initialize the system and music info
    let system_info = Arc::new(Mutex::new(SystemInfo::new()));
    let music_info = Arc::new(Mutex::new(MusicInfo::new()));

    // Create clones for .manage() calls
    let system_info_manage = system_info.clone();
    let music_info_manage = music_info.clone();
    tauri::Builder::default()
        .setup(move |app| {
            // Get the app handle for background tasks
            let app_handle = app.handle();

            // Clone the resources needed for background tasks
            let system_info_clone = system_info.clone();
            let music_info_clone = music_info.clone();

            // Spawn the background task with owned AppHandle
            spawn_background_task(app_handle.clone(), system_info_clone, music_info_clone);

            // Get the main window
            let window = app
                .get_webview_window("main")
                .expect("Failed to get main window");

            // Set initial window state
            #[cfg(not(target_os = "macos"))]
            {
                window
                    .set_decorations(false)
                    .expect("Failed to disable window decorations");
                window
                    .set_fullscreen(true)
                    .expect("Failed to set fullscreen");
            }

            Ok(())
        })
        .manage(system_info_manage)
        .manage(music_info_manage)
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_music_info,
            music_play_pause,
            music_next,
            music_previous,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
