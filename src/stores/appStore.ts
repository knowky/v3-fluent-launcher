import { create } from "zustand";
import type {
  GameInfo,
  ModInfo,
  Playset,
  SaveInfo,
  Scene,
  ConflictInfo,
  DashboardStats,
} from "../types";
import { invoke } from "@tauri-apps/api/core";

interface AppState {
  // 游戏状态
  gameInfo: GameInfo | null;
  isScanning: boolean;
  error: string | null;

  // Mod
  mods: ModInfo[];
  playsets: Playset[];
  activePlayset: Playset | null;

  // 存档
  saves: SaveInfo[];

  // 场景
  scenes: Scene[];

  // 冲突
  conflicts: ConflictInfo[];

  // 仪表盘
  stats: DashboardStats | null;

  // 导航
  activeNav: string;
  sidebarCollapsed: boolean;

  // Actions
  setError: (error: string | null) => void;
  setActiveNav: (nav: string) => void;
  toggleSidebar: () => void;

  // API
  detectGame: () => Promise<void>;
  scanMods: () => Promise<void>;
  scanSaves: () => Promise<void>;
  loadPlaysets: () => Promise<void>;
  loadScenes: () => Promise<void>;
  detectConflicts: () => Promise<void>;
  loadStats: () => Promise<void>;

  toggleMod: (modId: string, enabled: boolean) => Promise<void>;
  createPlayset: (name: string, description: string, modOrder: string[]) => Promise<void>;
  deletePlayset: (id: string) => Promise<void>;
  createScene: (scene: Omit<Scene, "id" | "created_at" | "last_used">) => Promise<void>;
  deleteSave: (id: string, filePath: string) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  launchGame: (sceneId?: string, extraArgs?: string[]) => Promise<string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  gameInfo: null,
  isScanning: false,
  error: null,
  mods: [],
  playsets: [],
  activePlayset: null,
  saves: [],
  scenes: [],
  conflicts: [],
  stats: null,
  activeNav: "dashboard",
  sidebarCollapsed: false,

  setError: (error) => set({ error }),
  setActiveNav: (nav) => set({ activeNav: nav }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  detectGame: async () => {
    try {
      set({ isScanning: true, error: null });
      const info: GameInfo = await invoke("get_game_info");
      set({ gameInfo: info, isScanning: false });
    } catch (e: any) {
      set({ error: String(e), isScanning: false });
    }
  },

  scanMods: async () => {
    try {
      set({ isScanning: true });
      const mods: ModInfo[] = await invoke("scan_mods");
      set({ mods, isScanning: false });
    } catch (e: any) {
      set({ error: String(e), isScanning: false });
    }
  },

  scanSaves: async () => {
    try {
      const saves: SaveInfo[] = await invoke("scan_saves");
      set({ saves });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  loadPlaysets: async () => {
    try {
      const playsets: Playset[] = await invoke("get_playsets");
      set({ playsets });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  loadScenes: async () => {
    try {
      const scenes: Scene[] = await invoke("get_scenes");
      set({ scenes });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  detectConflicts: async () => {
    try {
      const conflicts: ConflictInfo[] = await invoke("detect_conflicts");
      set({ conflicts });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  loadStats: async () => {
    try {
      const stats: DashboardStats = await invoke("get_dashboard_stats");
      set({ stats });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  toggleMod: async (modId, enabled) => {
    try {
      await invoke("toggle_mod", { modId, enabled });
      set((s) => ({
        mods: s.mods.map((m) => (m.id === modId ? { ...m, enabled } : m)),
      }));
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  createPlayset: async (name, description, modOrder) => {
    try {
      await invoke("create_playset", { name, description, modOrder });
      await get().loadPlaysets();
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  deletePlayset: async (id) => {
    try {
      await invoke("delete_playset", { playsetId: id });
      await get().loadPlaysets();
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  createScene: async (scene) => {
    try {
      await invoke("create_scene", {
        name: scene.name,
        description: scene.description,
        playsetId: scene.playset_id,
        saveId: scene.save_id,
        configJson: scene.config_json,
        launchArgs: scene.launch_args,
      });
      await get().loadScenes();
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  deleteSave: async (id, filePath) => {
    try {
      await invoke("delete_save", { saveId: id, filePath });
      set((s) => ({ saves: s.saves.filter((sv) => sv.id !== id) }));
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  deleteScene: async (id) => {
    try {
      await invoke("delete_scene", { sceneId: id });
      await get().loadScenes();
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  launchGame: async (sceneId, extraArgs = []) => {
    try {
      const result: { success: boolean; message: string; pid: number | null } =
        await invoke("launch_game", {
          sceneId: sceneId ?? null,
          extraArgs,
        });
      return result.message;
    } catch (e: any) {
      set({ error: String(e) });
      throw e;
    }
  },
}));
