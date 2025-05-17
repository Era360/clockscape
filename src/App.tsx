import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import FlipClock from "./components/FlipClock";
import "./App.css";

interface SystemInfo {
  cpu_usage: number;
  memory_used: number;
  memory_total: number;
  battery_level: number;
  battery_charging: boolean;
}

interface MusicInfo {
  is_playing: boolean;
  title: string;
  artist: string;
  album: string;
  cover_art_url: string;
  duration: number;
  position: number;
}

function App() {
  const [time, setTime] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [date, setDate] = useState("");
  const [dayOfYear, setDayOfYear] = useState("");
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpu_usage: 0,
    memory_used: 0,
    memory_total: 0,
    battery_level: 100,
    battery_charging: false,
  });
  const [musicInfo, setMusicInfo] = useState<MusicInfo>({
    is_playing: false,
    title: "No track playing",
    artist: "",
    album: "",
    cover_art_url: "",
    duration: 0,
    position: 0,
  });
  const [widgetsVisible, setWidgetsVisible] = useState(false);
  const [clockSize, setClockSize] = useState<"normal" | "large" | "fullscreen">(
    "fullscreen"
  );
  const [showSeconds, setShowSeconds] = useState(true);

  useEffect(() => {
    // Initial fetching of data
    fetchSystemInfo();
    fetchMusicInfo();

    // Set up event listeners for real-time updates
    const systemUnlisten = listen("system_update", (event: any) => {
      setSystemInfo(event.payload as SystemInfo);
    });

    const musicUnlisten = listen("music_update", (event: any) => {
      setMusicInfo(event.payload as MusicInfo);
    });

    // Set up clock
    const updateTime = () => {
      const now = new Date();
      setTime({
        hours: now.getHours().toString().padStart(2, "0"),
        minutes: now.getMinutes().toString().padStart(2, "0"),
        seconds: now.getSeconds().toString().padStart(2, "0"),
      });
    };

    updateTime();
    updateDate();

    const timer = setInterval(updateTime, 1000);
    const dateTimer = setInterval(updateDate, 60000); // Update date every minute

    // Handle escape key to toggle widget visibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWidgetsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(timer);
      clearInterval(dateTimer);
      systemUnlisten.then((unlisten) => unlisten());
      musicUnlisten.then((unlisten) => unlisten());
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const updateDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    setDate(now.toLocaleDateString("en-US", options));

    const start = new Date(now.getFullYear(), 0, 0);
    const diff = Number(now) - Number(start);
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    const isLeapYear = (year: number) => {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    };

    setDayOfYear(`Day ${day}/${isLeapYear(now.getFullYear()) ? "366" : "365"}`);
  };

  const fetchSystemInfo = async () => {
    try {
      const info = await invoke<SystemInfo>("get_system_info");
      setSystemInfo(info);
    } catch (error) {
      console.error("Failed to fetch system info:", error);
    }
  };

  const fetchMusicInfo = async () => {
    try {
      const info = await invoke<MusicInfo>("get_music_info");
      setMusicInfo(info);
    } catch (error) {
      console.error("Failed to fetch music info:", error);
    }
  };

  const handlePlayPause = async () => {
    try {
      const isPlaying = await invoke<boolean>("music_play_pause");
      setMusicInfo((prev) => ({ ...prev, is_playing: isPlaying }));
    } catch (error) {
      console.error("Failed to toggle play/pause:", error);
    }
  };

  const handleNext = async () => {
    try {
      await invoke("music_next");
      // Music info will update via events
    } catch (error) {
      console.error("Failed to skip to next track:", error);
    }
  };

  const handlePrevious = async () => {
    try {
      await invoke("music_previous");
      // Music info will update via events
    } catch (error) {
      console.error("Failed to go to previous track:", error);
    }
  };

  const toggleWidgets = () => {
    setWidgetsVisible((prev) => !prev);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="app-container">
      <div className="date-display">
        <div className="date">{date}</div>
        <div className="day-of-year">{dayOfYear}</div>
      </div>

      <div className="clock-container">
        <FlipClock
          hours={time.hours}
          minutes={time.minutes}
          seconds={time.seconds}
          showSeconds={showSeconds}
          size={clockSize}
        />
      </div>

      {/* Modern widget toggle button */}
      <div
        className={`widget-toggle ${widgetsVisible ? "open" : ""}`}
        onClick={toggleWidgets}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </div>

      {/* Widget container */}
      <div className={`widget-container ${widgetsVisible ? "visible" : ""}`}>
        <Widget title="Weather">
          <div className="flex items-center">
            <div className="mr-4 text-5xl opacity-90">☀️</div>
            <div>
              <div className="text-2xl font-light">22°C</div>
              <div className="text-sm opacity-70 mt-1">
                Sunny · San Francisco
              </div>
            </div>
          </div>
        </Widget>

        <Widget title="Music">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-14 h-14 mr-4 rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              {musicInfo.cover_art_url ? (
                <img
                  src={musicInfo.cover_art_url}
                  alt="Album cover"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl">🎵</span>
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs opacity-70 mb-1">
                {musicInfo.is_playing ? "NOW PLAYING" : "PAUSED"}
              </div>
              <div className="font-medium text-base truncate">
                {musicInfo.title || "No track playing"}
              </div>
              <div className="text-sm opacity-70 truncate">
                {musicInfo.artist || "Unknown artist"}
              </div>
            </div>
          </div>

          {musicInfo.duration > 0 && (
            <div className="progress-bar mt-3">
              <div
                className="fill blue"
                style={{
                  width: `${(musicInfo.position / musicInfo.duration) * 100}%`,
                }}
              />
            </div>
          )}

          <div className="music-controls">
            <button
              className="music-control-button"
              onClick={handlePrevious}
              aria-label="Previous track"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 20L9 12l10-8v16zM7 20V4H5v16h2z"></path>
              </svg>
            </button>
            <button
              className="music-control-button"
              onClick={handlePlayPause}
              aria-label={musicInfo.is_playing ? "Pause" : "Play"}
            >
              {musicInfo.is_playing ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7-11-7z"></path>
                </svg>
              )}
            </button>
            <button
              className="music-control-button"
              onClick={handleNext}
              aria-label="Next track"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 4l10 8-10 8V4zm14 0v16h-2V4h2z"></path>
              </svg>
            </button>
          </div>
        </Widget>

        <Widget title="System">
          <div className="flex flex-col space-y-4">
            {/* Battery */}
            <div className="info-item">
              <div className="info-item-label">
                <span>Battery</span>
                <span className="info-item-value">
                  {systemInfo.battery_level.toFixed(0)}%{" "}
                  {systemInfo.battery_charging && "⚡"}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`fill ${
                    systemInfo.battery_charging
                      ? "blue"
                      : systemInfo.battery_level > 50
                      ? "green"
                      : systemInfo.battery_level > 20
                      ? "yellow"
                      : "red"
                  }`}
                  style={{ width: `${systemInfo.battery_level}%` }}
                />
              </div>
            </div>

            {/* CPU */}
            <div className="info-item">
              <div className="info-item-label">
                <span>CPU</span>
                <span className="info-item-value">
                  {systemInfo.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="fill purple"
                  style={{ width: `${systemInfo.cpu_usage}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div className="info-item">
              <div className="info-item-label">
                <span>Memory</span>
                <span className="info-item-value">
                  {formatBytes(systemInfo.memory_used)} /{" "}
                  {formatBytes(systemInfo.memory_total)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="fill blue"
                  style={{
                    width: `${
                      (systemInfo.memory_used / systemInfo.memory_total) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Widget>

        <Widget title="Clock Settings">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <span>Show Seconds</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showSeconds}
                  onChange={() => setShowSeconds((prev) => !prev)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <span>Clock Size</span>
              <div className="size-buttons">
                <button
                  className={`size-button ${
                    clockSize === "normal" ? "active" : ""
                  }`}
                  onClick={() => setClockSize("normal")}
                >
                  S
                </button>
                <button
                  className={`size-button ${
                    clockSize === "large" ? "active" : ""
                  }`}
                  onClick={() => setClockSize("large")}
                >
                  M
                </button>
                <button
                  className={`size-button ${
                    clockSize === "fullscreen" ? "active" : ""
                  }`}
                  onClick={() => setClockSize("fullscreen")}
                >
                  L
                </button>
              </div>
            </div>
          </div>
        </Widget>
      </div>
    </div>
  );
}

interface WidgetProps {
  title: string;
  children: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({ title, children }) => {
  return (
    <div className="widget">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default App;
