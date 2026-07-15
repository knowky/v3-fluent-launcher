use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictInfo {
    pub id: String,
    pub mod_a: String,
    pub mod_b: String,
    pub file_path: String,
    pub conflict_type: ConflictType,
    pub severity: ConflictSeverity,
    pub description: String,
    pub auto_resolvable: bool,
    pub suggestion: Option<String>,
    pub resolved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConflictType {
    Overwrite,
    SameFile,
    Dependency,
    LoadOrder,
    GameVersion,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConflictSeverity {
    Critical,
    Major,
    Minor,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictRule {
    pub id: String,
    pub pattern_a: String,
    pub pattern_b: String,
    pub action: RuleAction,
    pub priority: i32,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleAction {
    LoadBefore,
    LoadAfter,
    Compatible,
    Incompatible,
    MergePatch,
}

/// 三级冲突检测引擎
pub struct ConflictEngine {
    rules: Vec<ConflictRule>,
}

impl ConflictEngine {
    pub fn new() -> Self {
        Self {
            rules: vec![
                ConflictRule {
                    id: "r001".into(),
                    pattern_a: "anbeeld".into(),
                    pattern_b: "economy".into(),
                    action: RuleAction::Compatible,
                    priority: 10,
                    description: "Anbeeld's AI 与经济类 Mod 通常兼容".into(),
                },
                ConflictRule {
                    id: "r002".into(),
                    pattern_a: "ui".into(),
                    pattern_b: "ui".into(),
                    action: RuleAction::LoadBefore,
                    priority: 5,
                    description: "两个 UI Mod 同时存在时需注意加载顺序".into(),
                },
                ConflictRule {
                    id: "r003".into(),
                    pattern_a: "total_conversion".into(),
                    pattern_b: "gameplay".into(),
                    action: RuleAction::Incompatible,
                    priority: 20,
                    description: "全面转换 Mod 与游戏性 Mod 通常不兼容".into(),
                },
                ConflictRule {
                    id: "r004".into(),
                    pattern_a: "map".into(),
                    pattern_b: "map".into(),
                    action: RuleAction::Incompatible,
                    priority: 15,
                    description: "多个地图修改 Mod 可能互相覆盖".into(),
                },
                ConflictRule {
                    id: "r005".into(),
                    pattern_a: "localization".into(),
                    pattern_b: "translation".into(),
                    action: RuleAction::Compatible,
                    priority: 8,
                    description: "本地化和翻译 Mod 通常可以共存".into(),
                },
                ConflictRule {
                    id: "r006".into(),
                    pattern_a: "graphics".into(),
                    pattern_b: "ui".into(),
                    action: RuleAction::LoadAfter,
                    priority: 12,
                    description: "图形 Mod 应加载在 UI Mod 之前".into(),
                },
                ConflictRule {
                    id: "r007".into(),
                    pattern_a: "performance".into(),
                    pattern_b: "graphics".into(),
                    action: RuleAction::Compatible,
                    priority: 6,
                    description: "性能优化 Mod 与图形 Mod 一般兼容".into(),
                },
            ],
        }
    }

    /// 检测所有 Mod 之间的冲突
    pub fn detect_all(&self, mods: &[super::mod_manager::ModInfo]) -> Vec<ConflictInfo> {
        let mut conflicts = Vec::new();

        for i in 0..mods.len() {
            for j in (i + 1)..mods.len() {
                let mod_a = &mods[i];
                let mod_b = &mods[j];

                if !mod_a.enabled || !mod_b.enabled {
                    continue;
                }

                // 检查文件冲突
                if let Some(c) = self.check_file_conflict(mod_a, mod_b) {
                    conflicts.push(c);
                }

                // 检查依赖冲突
                if let Some(c) = self.check_dependency_conflict(mod_a, mod_b) {
                    conflicts.push(c);
                }

                // 检查游戏版本
                if let Some(c) = self.check_version_conflict(mod_a, mod_b) {
                    conflicts.push(c);
                }
            }
        }

        // 应用规则
        for conflict in &mut conflicts {
            self.apply_rules(conflict, mods);
        }

        conflicts
    }

    fn check_file_conflict(
        &self,
        mod_a: &super::mod_manager::ModInfo,
        mod_b: &super::mod_manager::ModInfo,
    ) -> Option<ConflictInfo> {
        let path_a = PathBuf::from(&mod_a.path);
        let path_b = PathBuf::from(&mod_b.path);

        let files_a = self.collect_mod_files(&path_a);
        let files_b = self.collect_mod_files(&path_b);

        let common: HashSet<_> = files_a.intersection(&files_b).collect();

        if !common.is_empty() {
            let file_list: Vec<_> = common.iter().take(3).map(|s| s.to_string()).collect();
            let description = format!(
                "两个 Mod 都修改了相同的文件: {}",
                file_list.join(", ")
            );

            return Some(ConflictInfo {
                id: uuid::Uuid::new_v4().to_string(),
                mod_a: mod_a.name.clone(),
                mod_b: mod_b.name.clone(),
                file_path: file_list.first().cloned().unwrap_or_default(),
                conflict_type: ConflictType::SameFile,
                severity: ConflictSeverity::Major,
                description,
                auto_resolvable: false,
                suggestion: Some(format!(
                    "建议将 '{}' 放在 '{}' 之后加载",
                    mod_b.name, mod_a.name
                )),
                resolved: false,
            });
        }

        None
    }

    fn check_dependency_conflict(
        &self,
        mod_a: &super::mod_manager::ModInfo,
        mod_b: &super::mod_manager::ModInfo,
    ) -> Option<ConflictInfo> {
        if mod_a.dependencies.contains(&mod_b.name) && mod_a.load_order < mod_b.load_order {
            return Some(ConflictInfo {
                id: uuid::Uuid::new_v4().to_string(),
                mod_a: mod_a.name.clone(),
                mod_b: mod_b.name.clone(),
                file_path: String::new(),
                conflict_type: ConflictType::Dependency,
                severity: ConflictSeverity::Critical,
                description: format!(
                    "'{}' 依赖 '{}'，但加载顺序不正确",
                    mod_a.name, mod_b.name
                ),
                auto_resolvable: true,
                suggestion: Some(format!(
                    "自动将 '{}' 移动到 '{}' 之后",
                    mod_b.name, mod_a.name
                )),
                resolved: false,
            });
        }

        // 反向检查
        if mod_b.dependencies.contains(&mod_a.name) && mod_b.load_order < mod_a.load_order {
            return Some(ConflictInfo {
                id: uuid::Uuid::new_v4().to_string(),
                mod_a: mod_b.name.clone(),
                mod_b: mod_a.name.clone(),
                file_path: String::new(),
                conflict_type: ConflictType::Dependency,
                severity: ConflictSeverity::Critical,
                description: format!(
                    "'{}' 依赖 '{}'，但加载顺序不正确",
                    mod_b.name, mod_a.name
                ),
                auto_resolvable: true,
                suggestion: Some(format!(
                    "自动将 '{}' 移动到 '{}' 之后",
                    mod_a.name, mod_b.name
                )),
                resolved: false,
            });
        }

        None
    }

    fn check_version_conflict(
        &self,
        mod_a: &super::mod_manager::ModInfo,
        mod_b: &super::mod_manager::ModInfo,
    ) -> Option<ConflictInfo> {
        if !mod_a.game_version.is_empty()
            && !mod_b.game_version.is_empty()
            && mod_a.game_version != mod_b.game_version
        {
            return Some(ConflictInfo {
                id: uuid::Uuid::new_v4().to_string(),
                mod_a: mod_a.name.clone(),
                mod_b: mod_b.name.clone(),
                file_path: String::new(),
                conflict_type: ConflictType::GameVersion,
                severity: ConflictSeverity::Minor,
                description: format!(
                    "'{}' 适用于版本 {}，'{}' 适用于 {}",
                    mod_a.name, mod_a.game_version, mod_b.name, mod_b.game_version
                ),
                auto_resolvable: false,
                suggestion: Some("请确认两个 Mod 都支持当前游戏版本".to_string()),
                resolved: false,
            });
        }
        None
    }

    /// 递归收集 Mod 文件
    fn collect_mod_files(&self, mod_path: &PathBuf) -> HashSet<String> {
        let mut files = HashSet::new();

        for dir_name in &["common", "events", "gui", "localization", "gfx", "interface", "map_data", "music", "sound"] {
            let dir = mod_path.join(dir_name);
            if dir.exists() {
                for entry in WalkDir::new(&dir).max_depth(3).into_iter().filter_map(|e| e.ok()) {
                    if entry.file_type().is_file() {
                        if let Ok(rel) = entry.path().strip_prefix(mod_path) {
                            files.insert(rel.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }

        files
    }

    fn apply_rules(
        &self,
        conflict: &mut ConflictInfo,
        _mods: &[super::mod_manager::ModInfo],
    ) {
        for rule in &self.rules {
            let a_lower = conflict.mod_a.to_lowercase();
            let b_lower = conflict.mod_b.to_lowercase();

            let a_match = a_lower.contains(&rule.pattern_a.to_lowercase());
            let b_match = b_lower.contains(&rule.pattern_b.to_lowercase());

            if a_match && b_match {
                match rule.action {
                    RuleAction::Compatible => {
                        conflict.severity = ConflictSeverity::Info;
                        conflict.description = format!(
                            "规则匹配: {} - 这些 Mod 通常兼容",
                            rule.description
                        );
                        conflict.auto_resolvable = true;
                    }
                    RuleAction::Incompatible => {
                        conflict.severity = ConflictSeverity::Critical;
                        conflict.description = format!(
                            "规则匹配: {} - 这些 Mod 不兼容!",
                            rule.description
                        );
                    }
                    _ => {}
                }
            }
        }
    }
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn detect_conflicts(
        state: State<'_, AppState>,
    ) -> Result<Vec<ConflictInfo>, String> {
        let db = state.db.lock().unwrap();
        let mods = db.get_all_mods().map_err(|e| e.to_string())?;
        let engine = ConflictEngine::new();
        let conflicts = engine.detect_all(&mods);

        // 持久化冲突
        db.insert_conflicts(&conflicts).ok();
        db.add_activity(
            "conflict",
            "冲突检测",
            &format!("发现 {} 个冲突", conflicts.len()),
        )
        .ok();

        Ok(conflicts)
    }

    #[tauri::command]
    pub async fn resolve_conflict(
        state: State<'_, AppState>,
        conflict_id: String,
        resolution: String,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.mark_conflict_resolved(&conflict_id, &resolution)
            .map_err(|e| e.to_string())?;
        db.add_activity("conflict", "冲突已解决", &resolution).ok();
        Ok(())
    }

    #[tauri::command]
    pub async fn get_conflict_rules() -> Result<Vec<ConflictRule>, String> {
        let engine = ConflictEngine::new();
        Ok(engine.rules)
    }

    #[tauri::command]
    pub async fn generate_patch_mod(
        state: State<'_, AppState>,
        mod_a: String,
        mod_b: String,
        conflict_file: String,
        merged_content: String,
    ) -> Result<String, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        if let Some(ref paths) = *paths_guard {
            let patch_dir = PathBuf::from(&paths.user_data_path)
                .join("mod")
                .join("v3fl_patch");

            std::fs::create_dir_all(&patch_dir).map_err(|e| e.to_string())?;

            let rel_path = conflict_file.replace('\\', "/");
            let target_file = patch_dir.join(&rel_path);
            if let Some(parent) = target_file.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            std::fs::write(&target_file, &merged_content).map_err(|e| e.to_string())?;

            let descriptor = format!(
                r#"name="V3FL Patch: {} + {}"
path="mod/v3fl_patch"
supported_version="1.*"
tags={{
    "Fixes"
}}"#,
                mod_a, mod_b
            );

            let descriptor_path = PathBuf::from(&paths.user_data_path)
                .join("mod")
                .join("v3fl_patch.mod");
            std::fs::write(&descriptor_path, descriptor).map_err(|e| e.to_string())?;

            let db = state.db.lock().unwrap();
            db.add_activity("patch", "补丁已生成", &format!("为 {} 和 {} 创建了兼容补丁", mod_a, mod_b)).ok();

            Ok("补丁 Mod 已生成: v3fl_patch".to_string())
        } else {
            Err("游戏路径未设置".to_string())
        }
    }
}
