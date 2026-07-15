use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    pub resolution: Resolution,
    pub fullscreen: bool,
    pub quality: String,
    pub shadow_quality: String,
    pub anti_aliasing: String,
    pub texture_quality: String,
    pub ui_scale: f64,
    pub vsync: bool,
    pub fps_limit: i32,
    pub anisotropic: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub gpu_name: String,
    pub vram_mb: u64,
    pub ram_mb: u64,
    pub cpu_cores: u32,
    pub recommended_quality: String,
}

impl Default for GameSettings {
    fn default() -> Self {
        Self {
            resolution: Resolution {
                width: 1920,
                height: 1080,
            },
            fullscreen: true,
            quality: "high".to_string(),
            shadow_quality: "high".to_string(),
            anti_aliasing: "msaa_4".to_string(),
            texture_quality: "high".to_string(),
            ui_scale: 1.0,
            vsync: true,
            fps_limit: 60,
            anisotropic: "x8".to_string(),
        }
    }
}

/// 读取 Victoria 3 的 pdx_settings.json
pub fn read_pdx_settings(user_data_path: &str) -> Result<GameSettings, String> {
    let settings_path = PathBuf::from(user_data_path).join("pdx_settings.json");

    if !settings_path.exists() {
        return Ok(GameSettings::default());
    }

    let content = std::fs::read_to_string(&settings_path)
        .map_err(|e| format!("无法读取设置文件: {}", e))?;

    let json: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("设置文件解析失败: {}", e))?;

    let mut settings = GameSettings::default();

    // 解析 System 区块
    if let Some(system) = json.get("System") {
        if let Some(res) = system.get("display_resolution") {
            if let (Some(w), Some(h)) = (res.get(0).and_then(|v| v.as_i64()), res.get(1).and_then(|v| v.as_i64())) {
                settings.resolution.width = w as i32;
                settings.resolution.height = h as i32;
            }
        }
        if let Some(fs) = system.get("display_mode") {
            settings.fullscreen = fs.as_str().map_or(true, |s| s == "fullscreen");
        }
        if let Some(v) = system.get("vsync") {
            settings.vsync = v.as_bool().unwrap_or(true);
        }
        if let Some(v) = system.get("max_refresh_rate") {
            settings.fps_limit = v.as_i64().unwrap_or(60) as i32;
        }
    }

    // 解析 Graphics 区块
    if let Some(gfx) = json.get("Graphics") {
        if let Some(v) = gfx.get("shader_quality") {
            settings.quality = v.as_str().unwrap_or("high").to_string();
        }
        if let Some(v) = gfx.get("shadow_quality") {
            settings.shadow_quality = v.as_str().unwrap_or("high").to_string();
        }
        if let Some(v) = gfx.get("multi_sampling") {
            settings.anti_aliasing = v.as_str().unwrap_or("msaa_4").to_string();
        }
        if let Some(v) = gfx.get("texture_quality") {
            settings.texture_quality = v.as_str().unwrap_or("high").to_string();
        }
        if let Some(v) = gfx.get("ui_scaling") {
            settings.ui_scale = v.as_f64().unwrap_or(1.0);
        }
        if let Some(v) = gfx.get("anisotropic_filtering") {
            settings.anisotropic = v.as_str().unwrap_or("x8").to_string();
        }
    }

    Ok(settings)
}

/// 写入 Victoria 3 的 pdx_settings.json
pub fn write_pdx_settings(user_data_path: &str, settings: &GameSettings) -> Result<(), String> {
    let settings_path = PathBuf::from(user_data_path).join("pdx_settings.json");

    let mut json: serde_json::Value = if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)
            .map_err(|e| format!("无法读取设置文件: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // System
    let system = json
        .entry("System")
        .or_insert(serde_json::json!({}));
    system["display_resolution"] =
        serde_json::json!([settings.resolution.width, settings.resolution.height]);
    system["display_mode"] = if settings.fullscreen {
        serde_json::json!("fullscreen")
    } else {
        serde_json::json!("borderless_window")
    };
    system["vsync"] = serde_json::json!(settings.vsync);
    system["max_refresh_rate"] = serde_json::json!(settings.fps_limit);

    // Graphics
    let gfx = json
        .entry("Graphics")
        .or_insert(serde_json::json!({}));
    gfx["shader_quality"] = serde_json::json!(settings.quality);
    gfx["shadow_quality"] = serde_json::json!(settings.shadow_quality);
    gfx["multi_sampling"] = serde_json::json!(settings.anti_aliasing);
    gfx["texture_quality"] = serde_json::json!(settings.texture_quality);
    gfx["ui_scaling"] = serde_json::json!(settings.ui_scale);
    gfx["anisotropic_filtering"] = serde_json::json!(settings.anisotropic);

    let content =
        serde_json::to_string_pretty(&json).map_err(|e| format!("设置序列化失败: {}", e))?;

    std::fs::write(&settings_path, content).map_err(|e| format!("写入设置文件失败: {}", e))?;

    Ok(())
}

/// 根据系统配置自动推荐画质
pub fn detect_system_info() -> Result<SystemInfo, String> {
    let mut info = SystemInfo {
        gpu_name: "未知显卡".to_string(),
        vram_mb: 0,
        ram_mb: 0,
        cpu_cores: 0,
        recommended_quality: "medium".to_string(),
    };

    // 获取内存信息 (Windows)
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // 获取 GPU 信息
        if let Ok(output) = Command::new("wmic")
            .args(["path", "win32_videocontroller", "get", "name,AdapterRAM"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(1) {
                let line = line.trim();
                if let Some(last_num) = line.rfind(|c: char| c.is_ascii_digit()) {
                    if let Ok(vram) = line[..=last_num].trim().parse::<u64>() {
                        info.vram_mb = vram / (1024 * 1024);
                    }
                    info.gpu_name = line[..line.len() - 12]
                        .trim()
                        .to_string();
                }
            }
        }

        // 获取内存
        if let Ok(output) = Command::new("wmic")
            .args([
                "computersystem",
                "get",
                "TotalPhysicalMemory",
            ])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(1) {
                let line = line.trim();
                if let Ok(ram) = line.parse::<u64>() {
                    info.ram_mb = ram / (1024 * 1024);
                    break;
                }
            }
        }

        // 获取 CPU 核心数
        if let Ok(output) = Command::new("wmic")
            .args(["cpu", "get", "NumberOfCores"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(1) {
                let line = line.trim();
                if let Ok(cores) = line.parse::<u32>() {
                    info.cpu_cores = cores;
                    break;
                }
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        info.gpu_name = "未检测".to_string();
        info.vram_mb = 4096;
        info.ram_mb = 16384;
        info.cpu_cores = 4;
    }

    // 根据配置推荐画质
    info.recommended_quality = if info.vram_mb >= 8192 && info.ram_mb >= 32768 {
        "high".to_string()
    } else if info.vram_mb >= 4096 && info.ram_mb >= 16384 {
        "medium".to_string()
    } else {
        "low".to_string()
    };

    Ok(info)
}

/// 根据推荐画质生成优化的启动参数
pub fn get_optimized_args(quality: &str, ram_mb: u64) -> Vec<String> {
    let mut args = Vec::new();

    match quality {
        "low" => {
            args.push("-graphics_detail=low".to_string());
            args.push("-texture_quality=0".to_string());
            args.push("-shadow_quality=0".to_string());
        }
        "medium" => {
            args.push("-graphics_detail=medium".to_string());
        }
        _ => {
            // high - 不需要额外参数
        }
    }

    // 根据内存大小设置
    if ram_mb > 16384 {
        args.push("-mem_large".to_string());
    }

    // 性能优化参数
    args.push("-no_intro".to_string());
    args.push("--disable_mod_upload".to_string());

    args
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn get_game_settings(state: State<'_, AppState>) -> Result<GameSettings, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        if let Some(ref paths) = *paths_guard {
            read_pdx_settings(&paths.user_data_path)
        } else {
            Err("游戏路径未检测到".to_string())
        }
    }

    #[tauri::command]
    pub async fn save_game_settings(
        state: State<'_, AppState>,
        settings: GameSettings,
    ) -> Result<(), String> {
        let paths_guard = state.game_paths.lock().unwrap();
        if let Some(ref paths) = *paths_guard {
            write_pdx_settings(&paths.user_data_path, &settings)?;

            // 记录活动
            let db = state.db.lock().unwrap();
            db.add_activity("config", "配置已保存", &format!("画质: {} | 分辨率: {}x{}", settings.quality, settings.resolution.width, settings.resolution.height)).ok();
        } else {
            return Err("游戏路径未检测到".to_string());
        }
        Ok(())
    }

    #[tauri::command]
    pub async fn get_system_info() -> Result<SystemInfo, String> {
        detect_system_info()
    }

    #[tauri::command]
    pub async fn get_optimized_launch_args(
        quality: String,
    ) -> Result<Vec<String>, String> {
        let sys_info = detect_system_info()?;
        Ok(get_optimized_args(&quality, sys_info.ram_mb))
    }

    #[tauri::command]
    pub async fn auto_optimize_settings(
        state: State<'_, AppState>,
    ) -> Result<GameSettings, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        if let Some(ref paths) = *paths_guard {
            let sys_info = detect_system_info()?;
            let mut settings = GameSettings::default();
            settings.quality = sys_info.recommended_quality.clone();
            settings.shadow_quality = sys_info.recommended_quality.clone();
            settings.texture_quality = sys_info.recommended_quality.clone();

            if sys_info.vram_mb < 4096 {
                settings.anti_aliasing = "off".to_string();
                settings.anisotropic = "x2".to_string();
                settings.resolution = Resolution { width: 1366, height: 768 };
            }

            write_pdx_settings(&paths.user_data_path, &settings)?;

            let db = state.db.lock().unwrap();
            db.add_activity("optimize", "自动优化", &format!("根据 {} GPU 自动调整画质为 {}", sys_info.gpu_name, sys_info.recommended_quality)).ok();

            Ok(settings)
        } else {
            Err("游戏路径未检测到".to_string())
        }
    }
}
