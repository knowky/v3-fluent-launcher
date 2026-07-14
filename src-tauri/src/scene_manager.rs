use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub id: String,
    pub name: String,
    pub playset_id: Option<String>,
    pub save_id: Option<String>,
    pub config_json: String,
    pub launch_args: Vec<String>,
    pub created_at: String,
    pub last_used: Option<String>,
    pub icon: Option<String>,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SceneDetail {
    pub scene: Scene,
    pub save_name: Option<String>,
    pub playset_name: Option<String>,
    pub mod_count: i32,
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn create_scene(
        state: State<'_, AppState>,
        name: String,
        description: String,
        playset_id: Option<String>,
        save_id: Option<String>,
        config_json: String,
        launch_args: Vec<String>,
    ) -> Result<Scene, String> {
        let db = state.db.lock().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        let scene = Scene {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            playset_id,
            save_id,
            config_json,
            launch_args,
            created_at: now.clone(),
            last_used: Some(now),
            icon: None,
            description,
        };
        db.create_scene(&scene).map_err(|e| e.to_string())?;
        Ok(scene)
    }

    #[tauri::command]
    pub async fn get_scenes(state: State<'_, AppState>) -> Result<Vec<Scene>, String> {
        let db = state.db.lock().unwrap();
        db.get_all_scenes().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn update_scene(
        state: State<'_, AppState>,
        scene: Scene,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.update_scene(&scene).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn delete_scene(
        state: State<'_, AppState>,
        scene_id: String,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.delete_scene(&scene_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn auto_bind_save_to_scene(
        state: State<'_, AppState>,
        save_id: String,
    ) -> Result<Option<Scene>, String> {
        let db = state.db.lock().unwrap();
        // 查找是否有已绑定该存档的场景
        let scenes = db.get_all_scenes().map_err(|e| e.to_string())?;
        Ok(scenes.into_iter().find(|s| s.save_id.as_deref() == Some(&save_id)))
    }
}
