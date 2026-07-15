use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::collections::HashMap;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModInfo {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub version: String,
    pub source: ModSource,
    pub path: String,
    pub enabled: bool,
    pub load_order: i32,
    pub dependencies: Vec<String>,
    pub thumbnail: Option<String>,
    pub description: String,
    pub tags: Vec<String>,
    pub size: u64,
    pub last_updated: String,
    pub has_update: bool,
    pub conflict_count: i32,
    pub game_version: String,
    pub chinese_name: Option<String>,
    pub chinese_description: Option<String>,
    pub steam_id: Option<String>,
    pub archive_path: Option<String>,
    pub picture: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ModSource {
    Steam,
    Local,
    GitHub,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playset {
    pub id: String,
    pub name: String,
    pub mod_order: Vec<String>,
    pub created_at: String,
    pub last_used: Option<String>,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModVersionCheck {
    pub mod_id: String,
    pub mod_name: String,
    pub mod_version: String,
    pub game_version: String,
    pub compatible: bool,
    pub message: String,
}

/// 扫描 Steam Workshop Mod 目录
fn scan_workshop_mods(workshop_path: &str) -> Vec<ModInfo> {
    let mut mods = Vec::new();
    let path = PathBuf::from(workshop_path);

    if !path.exists() {
        return mods;
    }

    for entry in std::fs::read_dir(&path).unwrap_or_else(|_| std::fs::read_dir(".").unwrap()) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let mod_dir = entry.path();
        if !mod_dir.is_dir() {
            continue;
        }

        let descriptor_path = mod_dir.join("descriptor.mod");
        if !descriptor_path.exists() {
            continue;
        }

        if let Ok(mut mod_info) = parse_mod_descriptor(&descriptor_path, &mod_dir, ModSource::Steam) {
            // Steam Workshop mod 的 ID 使用目录名（Steam ID）
            if let Some(dirname) = mod_dir.file_name() {
                mod_info.steam_id = Some(dirname.to_string_lossy().to_string());
            }
            // 读取 metadata.json 获取更多信息
            let meta_path = mod_dir.join("metadata.json");
            if meta_path.exists() {
                if let Ok(content) = std::fs::read_to_string(&meta_path) {
                    if let Ok(meta) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(name) = meta.get("name").and_then(|v| v.as_str()) {
                            mod_info.display_name = name.to_string();
                        }
                    }
                }
            }
            mods.push(mod_info);
        }
    }

    mods
}

/// 扫描本地 Mod 目录
fn scan_local_mods(user_data_path: &str) -> Vec<ModInfo> {
    let mut mods = Vec::new>();
    let mod_path = PathBuf::from(user_data_path).join("mod");

    if !mod_path.exists() {
        return mods;
    }

    for entry in std::fs::read_dir(&mod_path).unwrap_or_else(|_| std::fs::read_dir(".").unwrap()) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let file_path = entry.path();

        // 本地 Mod 的 .mod 文件
        if file_path.extension().map_or(false, |e| e == "mod") {
            if let Ok(content) = std::fs::read_to_string(&file_path) {
                if let Ok(mod_info) = parse_mod_content(&content, &mod_path, ModSource::Local) {
                    mods.push(mod_info);
                }
            }
        }
    }

    mods
}

/// 解析 .mod 描述符文件
fn parse_mod_descriptor(
    descriptor_path: &PathBuf,
    mod_path: &PathBuf,
    source: ModSource,
) -> Result<ModInfo, String> {
    let content =
        std::fs::read_to_string(descriptor_path).map_err(|e| format!("读取失败: {}", e))?;
    parse_mod_content(&content, mod_path, source)
}

fn parse_mod_content(
    content: &str,
    mod_path: &PathBuf,
    source: ModSource,
) -> Result<ModInfo, String> {
    let mut name = String::new();
    let mut version = "1.0".to_string();
    let mut dependencies = Vec::new();
    let mut tags = Vec::new();
    let mut game_version = String::new();
    let mut archive_path: Option<String> = None;
    let mut picture: Option<String> = None;
    let mut steam_id: Option<String> = None;

    for line in content.lines() {
        let line = line.trim();
        // 跳过空行和注释
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some(value) = extract_value(line, "name") {
            name = value;
        } else if let Some(value) = extract_value(line, "version") {
            version = value;
        } else if let Some(value) = extract_value(line, "dependencies") {
            dependencies = parse_list_value(&value);
        } else if let Some(value) = extract_value(line, "tags") {
            tags = parse_list_value(&value);
        } else if let Some(value) = extract_value(line, "supported_version") {
            game_version = value;
        } else if let Some(value) = extract_value(line, "path") {
            archive_path = Some(value.replace("mod/", ""));
        } else if let Some(value) = extract_value(line, "picture") {
            picture = Some(value);
        } else if let Some(value) = extract_value(line, "remote_file_id") {
            steam_id = Some(value);
        }
    }

    let id = match source {
        ModSource::Steam => {
            steam_id.clone().unwrap_or_else(|| {
                mod_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string()
            })
        }
        _ => uuid::Uuid::new_v4().to_string(),
    };

    // 确定实际 Mod 内容路径
    let actual_path = if let Some(ref ap) = archive_path {
        PathBuf::from(mod_path).join(ap).to_string_lossy().to_string()
    } else {
        mod_path.to_string_lossy().to_string()
    };

    let size = calculate_dir_size(&PathBuf::from(&actual_path));

    // 读取描述
    let description = read_description(mod_path, content);

    // 查找缩略图
    let thumbnail = if let Some(ref pic) = picture {
        let pic_path = PathBuf::from(&actual_path).join(pic);
        if pic_path.exists() {
            Some(pic_path.to_string_lossy().to_string())
        } else {
            find_thumbnail(&PathBuf::from(&actual_path))
        }
    } else {
        find_thumbnail(&PathBuf::from(&actual_path))
    };

    Ok(ModInfo {
        id,
        name: name.clone(),
        display_name: name,
        version,
        source: source.clone(),
        path: actual_path,
        enabled: false,
        load_order: 0,
        dependencies,
        thumbnail,
        description,
        tags,
        size,
        last_updated: String::new(),
        has_update: false,
        conflict_count: 0,
        game_version,
        chinese_name: None,
        chinese_description: None,
        steam_id,
        archive_path,
        picture,
    })
}

fn parse_list_value(value: &str) -> Vec<String> {
    let trimmed = value.trim();
    if trimmed.starts_with('{') && trimmed.ends_with('}') {
        let inner = &trimmed[1..trimmed.len() - 1];
        inner
            .split(|c: char| c == ' ' || c == '"')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.trim_matches('"').to_string())
            .collect()
    } else {
        trimmed
            .split(|c: char| c == ' ')
            .filter(|s| !s.is_empty())
            .map(|s| s.trim_matches('"').to_string())
            .collect()
    }
}

fn extract_value(line: &str, key: &str) -> Option<String> {
    let lower = line.to_lowercase();
    let pattern = format!("{}=\"", key.to_lowercase());
    let pattern_no_quotes = format!("{}=", key.to_lowercase());

    if lower.contains(&pattern) {
        // 带引号的值
        if let Some(start) = lower.find(&pattern) {
            let after_eq = &line[start + pattern.len()..];
            if let Some(end) = after_eq.find('"') {
                let value = &after_eq[..end];
                if !value.is_empty() {
                    return Some(value.to_string());
                }
            }
        }
    } else if lower.contains(&pattern_no_quotes) {
        // 不带引号的值
        if let Some(start) = lower.find(&pattern_no_quotes) {
            let after = &line[start + pattern_no_quotes.len()..];
            let value = after.trim();
            if !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }
    None
}

fn read_description(mod_path: &PathBuf, _descriptor_content: &str) -> String {
    // 尝试读取 description.txt 或 README
    for fname in &["description.txt", "README.md", "readme.md", "README.txt", "description.md"] {
        let path = mod_path.join(fname);
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(&path) {
                let desc = content.lines().take(5).collect::<Vec<_>>().join("\n");
                if !desc.is_empty() {
                    return desc;
                }
            }
        }
    }
    String::new()
}

fn find_thumbnail(mod_path: &PathBuf) -> Option<String> {
    for ext in &["png", "jpg", "jpeg"] {
        let thumb = mod_path.join(format!("thumbnail.{}", ext));
        if thumb.exists() {
            return Some(thumb.to_string_lossy().to_string());
        }
    }
    None
}

fn calculate_dir_size(path: &PathBuf) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.metadata().map(|m| m.len()).unwrap_or(0))
        .sum()
}

/// 将 Mod 加载顺序写入 dlc_load.json
pub fn write_dlc_load_json(user_data_path: &str, mod_order: &[String]) -> Result<(), String> {
    let dlc_load_path = PathBuf::from(user_data_path).join("dlc_load.json");

    let entries: Vec<serde_json::Value> = mod_order
        .iter()
        .map(|id| {
            serde_json::json!({
                "enabled": true
            })
        })
        .collect();

    let content = serde_json::to_string_pretty(&serde_json::json!({
        "disabled_dlcs": [],
        "enabled_mods": entries,
    }))
    .map_err(|e| e.to_string())?;

    std::fs::write(&dlc_load_path, content).map_err(|e| format!("写入 dlc_load.json 失败: {}", e))?;
    Ok(())
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn scan_mods(state: State<'_, AppState>) -> Result<Vec<ModInfo>, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        let mut all_mods = Vec::new();

        if let Some(ref paths) = *paths_guard {
            let workshop_mods = scan_workshop_mods(&paths.workshop_path);
            let local_mods = scan_local_mods(&paths.user_data_path);

            all_mods.extend(workshop_mods);
            all_mods.extend(local_mods);

            let db = state.db.lock().unwrap();
            for m in &all_mods {
                db.upsert_mod(m).ok();
            }
        }

        Ok(all_mods)
    }

    #[tauri::command]
    pub async fn get_mods(state: State<'_, AppState>) -> Result<Vec<ModInfo>, String> {
        let db = state.db.lock().unwrap();
        db.get_all_mods().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn toggle_mod(
        state: State<'_, AppState>,
        mod_id: String,
        enabled: bool,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.set_mod_enabled(&mod_id, enabled)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn bulk_toggle_mods(
        state: State<'_, AppState>,
        mod_ids: Vec<String>,
        enabled: bool,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        for id in &mod_ids {
            db.set_mod_enabled(id, enabled).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[tauri::command]
    pub async fn update_mod_order(
        state: State<'_, AppState>,
        mod_order: Vec<String>,
    ) -> Result<(), String> {
        let paths_guard = state.game_paths.lock().unwrap();
        if let Some(ref paths) = *paths_guard {
            write_dlc_load_json(&paths.user_data_path, &mod_order)?
        }
        Ok(())
    }

    #[tauri::command]
    pub async fn create_playset(
        state: State<'_, AppState>,
        name: String,
        description: String,
        mod_order: Vec<String>,
    ) -> Result<Playset, String> {
        let db = state.db.lock().unwrap();
        let playset = Playset {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            mod_order,
            created_at: chrono::Utc::now().to_rfc3339(),
            last_used: None,
            description,
        };
        db.create_playset(&playset).map_err(|e| e.to_string())?;
        Ok(playset)
    }

    #[tauri::command]
    pub async fn delete_playset(
        state: State<'_, AppState>,
        playset_id: String,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.delete_playset(&playset_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_playsets(state: State<'_, AppState>) -> Result<Vec<Playset>, String> {
        let db = state.db.lock().unwrap();
        db.get_all_playsets().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn update_playset_order(
        state: State<'_, AppState>,
        playset_id: String,
        mod_order: Vec<String>,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.update_playset_order(&playset_id, &mod_order)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_mod_dependencies(
        state: State<'_, AppState>,
        mod_id: String,
    ) -> Result<Vec<ModInfo>, String> {
        let db = state.db.lock().unwrap();
        db.get_mod_dependencies(&mod_id)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn check_all_mod_compatibility(
        state: State<'_, AppState>,
    ) -> Result<Vec<ModVersionCheck>, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        let game_version = paths_guard
            .as_ref()
            .map(|p| p.version.clone())
            .unwrap_or_else(|| "未知".to_string());

        let db = state.db.lock().unwrap();
        let mods = db.get_all_mods().map_err(|e| e.to_string())?;

        let checks: Vec<ModVersionCheck> = mods
            .iter()
            .map(|m| {
                let compatible = if m.game_version.is_empty() || game_version == "未知" {
                    true
                } else {
                    // 简单版本兼容检查：比较主版本号
                    let mod_ver_parts: Vec<&str> = m.game_version.split('.').collect();
                    let game_ver_parts: Vec<&str> = game_version.split('.').collect();
                    if mod_ver_parts.len() >= 2 && game_ver_parts.len() >= 2 {
                        mod_ver_parts[0] == game_ver_parts[0]
                            && mod_ver_parts[1] <= game_ver_parts[1]
                    } else {
                        m.game_version == game_version
                    }
                };

                let message = if compatible {
                    "兼容当前游戏版本".to_string()
                } else {
                    format!(
                        "Mod 版本 {} 可能与游戏版本 {} 不兼容",
                        m.game_version, game_version
                    )
                };

                ModVersionCheck {
                    mod_id: m.id.clone(),
                    mod_name: m.name.clone(),
                    mod_version: m.version.clone(),
                    game_version: m.game_version.clone(),
                    compatible,
                    message,
                }
            })
            .collect();

        Ok(checks)
    }

    #[tauri::command]
    pub async fn apply_playset_to_game(
        state: State<'_, AppState>,
        playset_id: String,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        let playsets = db.get_all_playsets().map_err(|e| e.to_string())?;

        let playset = playsets
            .iter()
            .find(|p| p.id == playset_id)
            .ok_or("Playset 不存在".to_string())?;

        let paths_guard = state.game_paths.lock().unwrap();
        if let Some(ref paths) = *paths_guard {
            write_dlc_load_json(&paths.user_data_path, &playset.mod_order)?;
            // 更新最后使用时间
            db.update_playset_order(&playset_id, &playset.mod_order).ok();
        }

        Ok(())
    }
}
