#[cfg(target_os = "windows")]
use windows::Media::Control::GlobalSystemMediaTransportControlsSessionPlaybackStatus;

// Cross-platform music info provider
pub struct MusicInfo {
    #[cfg(all(target_os = "linux", feature = "linux-music"))]
    player: Option<mpris::Player>,
    #[cfg(target_os = "windows")]
    player_handle:
        Option<windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager>,
    title: String,
    artist: String,
    album: String,
    cover_art_url: String,
    duration: u64,
    position: u64,
    is_playing: bool,
}

impl MusicInfo {
    pub fn new() -> Self {
        let mut music_info = Self {
            #[cfg(all(target_os = "linux", feature = "linux-music"))]
            player: None,
            #[cfg(target_os = "windows")]
            player_handle: None,
            title: String::new(),
            artist: String::new(),
            album: String::new(),
            cover_art_url: String::new(),
            duration: 0,
            position: 0,
            is_playing: false,
        };

        music_info.initialize();
        music_info.refresh();
        music_info
    }

    fn initialize(&mut self) {
        #[cfg(all(target_os = "linux", feature = "linux-music"))]
        {
            if let Ok(player_finder) = mpris::PlayerFinder::new() {
                if let Ok(player) = player_finder.find_active() {
                    self.player = Some(player);
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            use windows::Media::Control::*;

            let operation = GlobalSystemMediaTransportControlsSessionManager::RequestAsync();

            if let Ok(operation) = operation {
                if let Ok(manager) = operation.get() {
                    self.player_handle = Some(manager);
                }
            }
        }
    }

    pub fn refresh(&mut self) {
        #[cfg(all(target_os = "linux", feature = "linux-music"))]
        {
            if self.player.is_none() {
                self.initialize();
            }

            if let Some(player) = &self.player {
                // Try to get metadata, or reinitialize if we get an error
                match player.get_metadata() {
                    Ok(metadata) => {
                        // Update title
                        self.title = metadata
                            .title()
                            .unwrap_or_else(|| "Unknown Title")
                            .to_string();

                        // Update artist
                        self.artist = metadata
                            .artists()
                            .and_then(|artists| {
                                if artists.is_empty() {
                                    None
                                } else {
                                    Some(artists.join(", "))
                                }
                            })
                            .unwrap_or_else(|| "Unknown Artist".to_string());

                        // Update album
                        self.album = metadata
                            .album_name()
                            .unwrap_or_else(|| "Unknown Album")
                            .to_string();

                        // Update duration
                        self.duration = metadata
                            .length()
                            .map(|length| length.as_micros() as u64 / 1000)
                            .unwrap_or(0);

                        // Update position
                        if let Ok(position) = player.get_position() {
                            self.position = position.as_micros() as u64 / 1000;
                        }

                        // Update playback status
                        if let Ok(status) = player.get_playback_status() {
                            self.is_playing = status == mpris::PlaybackStatus::Playing;
                        }

                        // Attempt to get album art URL
                        self.cover_art_url = metadata.art_url().unwrap_or_default().to_string();
                    }
                    Err(_) => {
                        self.player = None;
                        self.initialize();
                    }
                }
            }
        }
        #[cfg(target_os = "windows")]
        {
            // If we don't have a player manager, try to initialize it
            if self.player_handle.is_none() {
                self.initialize();
            }

            // If we have a player manager, try to get the current session
            if let Some(manager) = &self.player_handle {
                if let Ok(current_session) = manager.GetCurrentSession() {
                    // Update playback info
                    if let Ok(info) = current_session.GetPlaybackInfo() {
                        if let Ok(status) = info.PlaybackStatus() {
                            self.is_playing = status
                                == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing;
                        }
                    }

                    // Update timeline info
                    if let Ok(timeline) = current_session.GetTimelineProperties() {
                        if let Ok(position) = timeline.Position() {
                            self.position = position.Duration as u64;
                        }

                        if let Ok(end_time) = timeline.EndTime() {
                            self.duration = end_time.Duration as u64;
                        }
                    }

                    // Update media properties
                    if let Ok(props_async_op) = current_session.TryGetMediaPropertiesAsync() {
                        if let Ok(props) = props_async_op.get() {
                            if let Ok(title) = props.Title() {
                                self.title = title.to_string();
                            }

                            if let Ok(artist) = props.Artist() {
                                self.artist = artist.to_string();
                            }

                            if let Ok(album) = props.AlbumTitle() {
                                self.album = album.to_string();
                            }

                            // With updated Windows API and modern Tauri, thumbnail may need a different approach
                            self.cover_art_url = "has_thumbnail".to_string();
                        }
                    }
                }
            }
        }
    }

    pub fn is_playing(&self) -> bool {
        self.is_playing
    }

    pub fn title(&self) -> String {
        self.title.clone()
    }

    pub fn artist(&self) -> String {
        self.artist.clone()
    }

    pub fn album(&self) -> String {
        self.album.clone()
    }

    pub fn cover_art_url(&self) -> String {
        self.cover_art_url.clone()
    }

    pub fn duration(&self) -> u64 {
        self.duration
    }

    pub fn position(&self) -> u64 {
        self.position
    }
    pub fn play_pause(&mut self) {
        #[cfg(all(target_os = "linux", feature = "linux-music"))]
        {
            if let Some(player) = &self.player {
                let _ = player.play_pause();
                // Update status after action
                if let Ok(status) = player.get_playback_status() {
                    self.is_playing = status == mpris::PlaybackStatus::Playing;
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Some(manager) = &self.player_handle {
                if let Ok(current_session) = manager.GetCurrentSession() {
                    let _ = current_session.TryTogglePlayPauseAsync();
                }
            }
        }
    }
    pub fn next(&mut self) {
        #[cfg(all(target_os = "linux", feature = "linux-music"))]
        {
            if let Some(player) = &self.player {
                let _ = player.next();
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Some(manager) = &self.player_handle {
                if let Ok(current_session) = manager.GetCurrentSession() {
                    let _ = current_session.TrySkipNextAsync();
                }
            }
        }
    }
    pub fn previous(&mut self) {
        #[cfg(all(target_os = "linux", feature = "linux-music"))]
        {
            if let Some(player) = &self.player {
                let _ = player.previous();
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Some(manager) = &self.player_handle {
                if let Ok(current_session) = manager.GetCurrentSession() {
                    let _ = current_session.TrySkipPreviousAsync();
                }
            }
        }
    }
}
