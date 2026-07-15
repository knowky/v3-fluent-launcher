mod steam;
mod mod_manager;
mod save_parser;
mod conflict_resolver;
mod database;
mod game_launcher;
mod scene_manager;
mod config_manager;
mod toolbox;

use tauri::Manager;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<database::Database>,
    pub game_paths: Mutex<Option<steam::GamePaths>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = database::Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState {
            db: Mutex::new(db),
            game_paths: Mutex::new(None),
        })
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(paths) = steam::detect_game_paths() {
                    let state = handle.state::<AppState>();
                    *state.game_paths.lock().unwrap() = Some(paths);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Steam / 游戏路径
            steam::commands::detect_steam_paths,
            steam::commands::get_game_info,

            // Mod 管理
            mod_manager::commands::scan_mods,
            mod_manager::commands::get_mods,
            mod_manager::commands::toggle_mod,
            mod_manager::commands::bulk_toggle_mods,
            mod_manager::commands::update_mod_order,
            mod_manager::commands::create_playset,
            mod_manager::commands::delete_playset,
            mod_manager::commands::get_playsets,
            mod_manager::commands::update_playset_order,
            mod_manager::commands::get_mod_dependencies,
            mod_manager::commands::check_all_mod_compatibility,
            mod_manager::commands::apply_playset_to_game,

            // 存档管理
            save_parser::commands::scan_saves,
            save_parser::commands::get_saves,
            save_parser::commands::parse_save_detail,
            save_parser::commands::delete_save,
            save_parser::commands::export_save,
            save_parser::commands::create_save_backup,
            save_parser::commands::list_save_backups,
            save_parser::commands::restore_save_backup,
            save_parser::commands::delete_save_backup,

            // 冲突解决
            conflict_resolver::commands::detect_conflicts,
            conflict_resolver::commands::resolve_conflict,
            conflict_resolver::commands::get_conflict_rules,
            conflict_resolver::commands::generate_patch_mod,

            // 配置管理
            config_manager::commands::get_game_settings,
            config_manager::commands::save_game_settings,
            config_manager::commands::get_system_info,
            config_manager::commands::get_optimized_launch_args,
            config_manager::commands::auto_optimize_settings,

            // 场景管理
            scene_manager::commands::create_scene,
            scene_manager::commands::get_scenes,
            scene_manager::commands::update_scene,
            scene_manager::commands::delete_scene,
            scene_manager::commands::auto_bind_save_to_scene,

            // 游戏启动
            game_launcher::commands::launch_game,
            game_launcher::commands::get_launch_history,
            game_launcher::commands::validate_game_files,

            // 数据库 & 设置
            database::commands::get_dashboard_stats,
            database::commands::get_activity_feed,
            database::commands::get_app_settings,
            database::commands::save_app_setting,
            database::commands::get_app_setting,
            database::commands::save_config_profile,
            database::commands::get_config_profiles,
            database::commands::delete_config_profile,

            // 工具箱
            toolbox::commands::list_screenshots,
            toolbox::commands::clean_cache,
            toolbox::commands::read_game_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Victoria 3 Fluent Launcher");
}
