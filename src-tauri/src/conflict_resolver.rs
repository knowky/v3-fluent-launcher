use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

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
    Overwrite,     // 完全覆盖
    SameFile,      // 修改同一文件
    Dependency,    // 依赖冲突
    LoadOrder,     // 加载顺序
    GameVersion,   // 游戏版本不兼容
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConflictSeverity {
    Critical,  // 严重：会导致崩溃
    Major,     // 重要：功能受损
    Minor,     // 轻微：小问题
    Info,      // 信息：可忽略
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
                // 预置规则
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
                    pattern_a: "UI".into(),
                    pattern_b: "UI".into(),
                    action: RuleAction::LoadBefore,
                    priority: 5,
                    description: "两个 UI Mod 同时存在，后者会覆盖前者的界面修改".into(),
                },
                ConflictRule {
                    id: "r003".into(),
                    pattern_a: "total_conversion".into(),
                    pattern_b: "gameplay".into(),
                    action: RuleAction::Incompatible,
                    priority: 20,
                    description: "全面转换 Mod 与游戏性 Mod 通常不兼容".into(),
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

        // 应用规则自动分类
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

        // 收集两个 Mod 的所有文件路径
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
                    "建议将 '{}' 放在 '{}' 之后加载，以保留后者的修改",
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
        // 检查 Mod A 是否依赖 Mod B 但加载顺序错误
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
                    "'{}' 适用于游戏版本 {}，而 '{}' 适用于 {}",
                    mod_a.name, mod_a.game_version, mod_b.name, mod_b.game_version
                ),
                auto_resolvable: false,
                suggestion: Some("请确认两个 Mod 都支持当前游戏版本".to_string()),
                resolved: false,
            });
        }
        None
    }

    fn collect_mod_files(&self, mod_path: &PathBuf) -> HashSet<String> {
        let mut files = HashSet::new();
        let common_dir = mod_path.join("common");
        let events_dir = mod_path.join("events");
        let gui_dir = mod_path.join("gui");
        let localization_dir = mod_path.join("localization");

        for dir in &[common_dir, events_dir, gui_dir, localization_dir] {
            if dir.exists() {
                if let Ok(entries) = std::fs::read_dir(dir) {
                    for entry in entries.flatten() {
                        let rel = entry
                            .path()
                            .strip_prefix(mod_path)
                            .unwrap_or(&entry.path())
                            .to_string_lossy()
                            .to_string();
                        files.insert(rel);
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
                            "根据社区规则：{} - 这两个 Mod 通常兼容",
                            rule.description
                        );
                        conflict.auto_resolvable = true;
                    }
                    RuleAction::Incompatible => {
                        conflict.severity = ConflictSeverity::Critical;
                        conflict.description = format!(
                            "根据社区规则：{} - 这两个 Mod 不兼容！",
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
        Ok(engine.detect_all(&mods))
    }

    #[tauri::command]
    pub async fn resolve_conflict(
        state: State<'_, AppState>,
        conflict_id: String,
        resolution: String,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.mark_conflict_resolved(&conflict_id, &resolution)
            .map_err(|e| e.to_string())
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

            // 写入合并内容
            let rel_path = conflict_file.replace('\\', "/");
            let target_file = patch_dir.join(&rel_path);
            if let Some(parent) = target_file.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            std::fs::write(&target_file, &merged_content).map_err(|e| e.to_string())?;

            // 创建 .mod 描述符
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

            Ok("补丁 Mod 已生成: v3fl_patch".to_string())
        } else {
            Err("游戏路径未设置".to_string())
        }
    }
}
