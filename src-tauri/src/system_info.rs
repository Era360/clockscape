// Updated system_info.rs for modern sysinfo API
use sysinfo::System;

pub struct SystemInfo {
    system: System,
}

impl SystemInfo {
    pub fn new() -> Self {
        let mut system = System::new();
        system.refresh_all();
        Self { system }
    }

    pub fn refresh(&mut self) {
        self.system.refresh_all();
    }

    pub fn cpu_usage(&self) -> f32 {
        let mut total = 0.0;
        let count = self.system.cpus().len() as f32;

        for processor in self.system.cpus() {
            total += processor.cpu_usage();
        }

        if count > 0.0 {
            total / count
        } else {
            0.0
        }
    }

    pub fn memory_used(&self) -> u64 {
        self.system.used_memory()
    }

    pub fn memory_total(&self) -> u64 {
        self.system.total_memory()
    }

    pub fn battery_level(&self) -> f32 {
        // sysinfo doesn't have direct battery info, so we need to implement platform-specific code
        #[cfg(target_os = "linux")]
        {
            // Read from /sys/class/power_supply/
            if let Ok(dir_entries) = std::fs::read_dir("/sys/class/power_supply/") {
                for entry in dir_entries.flatten() {
                    let path = entry.path();
                    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

                    if name.starts_with("BAT") {
                        let capacity_path = path.join("capacity");
                        if let Ok(capacity) = std::fs::read_to_string(capacity_path) {
                            if let Ok(level) = capacity.trim().parse::<f32>() {
                                return level;
                            }
                        }
                    }
                }
            }

            // Fallback value
            return 100.0;
        }

        #[cfg(target_os = "windows")]
        {
            use winapi::um::winbase::GetSystemPowerStatus;
            use winapi::um::winbase::SYSTEM_POWER_STATUS;

            let mut status = SYSTEM_POWER_STATUS {
                ACLineStatus: 0,
                BatteryFlag: 0,
                BatteryLifePercent: 0,
                Reserved1: 0,
                BatteryLifeTime: 0,
                BatteryFullLifeTime: 0,
            };

            unsafe {
                if GetSystemPowerStatus(&mut status) != 0 {
                    let battery_percent = status.BatteryLifePercent as f32;
                    if battery_percent <= 100.0 {
                        return battery_percent;
                    }
                }
            }
        }

        // Default fallback
        100.0
    }

    pub fn battery_is_charging(&self) -> bool {
        #[cfg(target_os = "linux")]
        {
            if let Ok(dir_entries) = std::fs::read_dir("/sys/class/power_supply/") {
                for entry in dir_entries.flatten() {
                    let path = entry.path();
                    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

                    if name == "AC" || name.starts_with("AC") {
                        let online_path = path.join("online");
                        if let Ok(online) = std::fs::read_to_string(online_path) {
                            return online.trim() == "1";
                        }
                    }
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            use winapi::um::winbase::GetSystemPowerStatus;
            use winapi::um::winbase::SYSTEM_POWER_STATUS;

            let mut status = SYSTEM_POWER_STATUS {
                ACLineStatus: 0,
                BatteryFlag: 0,
                BatteryLifePercent: 0,
                Reserved1: 0,
                BatteryLifeTime: 0,
                BatteryFullLifeTime: 0,
            };

            unsafe {
                if GetSystemPowerStatus(&mut status) != 0 {
                    return status.ACLineStatus == 1 && (status.BatteryFlag & 8) != 0;
                }
            }
        }

        // Default
        false
    }
}
