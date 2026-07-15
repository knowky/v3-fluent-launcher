import { create } from "zustand";

interface SettingsState {
  theme: string;
  language: string;
  sidebarCollapsed: boolean;
  autoUpdate: boolean;
  autoScan: boolean;
  minimizeToTray: boolean;
  closeOnGameExit: boolean;
  cloudSync: boolean;
  cloudService: string;
  cloudSyncInterval: number;
  loaded: boolean;

  setTheme: (v: string) => void;
  setLanguage: (v: string) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setAutoUpdate: (v: boolean) => void;
  setAutoScan: (v: boolean) => void;
  setMinimizeToTray: (v: boolean) => void;
  setCloseOnGameExit: (v: boolean) => void;
  setCloudSync: (v: boolean) => void;
  setCloudService: (v: string) => void;
  setCloudSyncInterval: (v: number) => void;
  loadSettings: () => void;
}

const STORAGE_KEY = "v3-launcher-settings";

const defaults: Omit<SettingsState, keyof {
  setTheme(v: string): void;
  setLanguage(v: string): void;
  setSidebarCollapsed(v: boolean): void;
  setAutoUpdate(v: boolean): void;
  setAutoScan(v: boolean): void;
  setMinimizeToTray(v: boolean): void;
  setCloseOnGameExit(v: boolean): void;
  setCloudSync(v: boolean): void;
  setCloudService(v: string): void;
  setCloudSyncInterval(v: number): void;
  loadSettings(): void;
}> = {
  theme: "aurora",
  language: "zh-CN",
  sidebarCollapsed: false,
  autoUpdate: true,
  autoScan: true,
  minimizeToTray: true,
  closeOnGameExit: false,
  cloudSync: false,
  cloudService: "webdav",
  cloudSyncInterval: 3600,
  loaded: false,
};

function persistSettings(state: Partial<SettingsState>) {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.assign(current, state);
    delete (current as any).loaded;
    delete (current as any).loadSettings;
    delete (current as any).setTheme;
    delete (current as any).setLanguage;
    delete (current as any).setSidebarCollapsed;
    delete (current as any).setAutoUpdate;
    delete (current as any).setAutoScan;
    delete (current as any).setMinimizeToTray;
    delete (current as any).setCloseOnGameExit;
    delete (current as any).setCloudSync;
    delete (current as any).setCloudService;
    delete (current as any).setCloudSyncInterval;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,

  setTheme: (v: string) => { set({ theme: v }); persistSettings({ theme: v }); },
  setLanguage: (v: string) => { set({ language: v }); persistSettings({ language: v }); },
  setSidebarCollapsed: (v: boolean) => { set({ sidebarCollapsed: v }); persistSettings({ sidebarCollapsed: v }); },
  setAutoUpdate: (v: boolean) => { set({ autoUpdate: v }); persistSettings({ autoUpdate: v }); },
  setAutoScan: (v: boolean) => { set({ autoScan: v }); persistSettings({ autoScan: v }); },
  setMinimizeToTray: (v: boolean) => { set({ minimizeToTray: v }); persistSettings({ minimizeToTray: v }); },
  setCloseOnGameExit: (v: boolean) => { set({ closeOnGameExit: v }); persistSettings({ closeOnGameExit: v }); },
  setCloudSync: (v: boolean) => { set({ cloudSync: v }); persistSettings({ cloudSync: v }); },
  setCloudService: (v: string) => { set({ cloudService: v }); persistSettings({ cloudService: v }); },
  setCloudSyncInterval: (v: number) => { set({ cloudSyncInterval: v }); persistSettings({ cloudSyncInterval: v }); },

  loadSettings: () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      set({
        theme: stored.theme || defaults.theme,
        language: stored.language || defaults.language,
        sidebarCollapsed: stored.sidebarCollapsed ?? defaults.sidebarCollapsed,
        autoUpdate: stored.autoUpdate ?? defaults.autoUpdate,
        autoScan: stored.autoScan ?? defaults.autoScan,
        minimizeToTray: stored.minimizeToTray ?? defaults.minimizeToTray,
        closeOnGameExit: stored.closeOnGameExit ?? defaults.closeOnGameExit,
        cloudSync: stored.cloudSync ?? defaults.cloudSync,
        cloudService: stored.cloudService || defaults.cloudService,
        cloudSyncInterval: stored.cloudSyncInterval ?? defaults.cloudSyncInterval,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },
}));
