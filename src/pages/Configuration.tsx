import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import { invoke } from "@tauri-apps/api/core";

interface GameConfig {
  resolution: string;
  fullscreen: boolean;
  refreshRate: number;
  qualityPreset: string;
  shadowQuality: string;
  antiAliasing: string;
  textureFiltering: string;
  uiScale: number;
  vsync: boolean;
  fpsLimit: number;
}

const defaultConfig: GameConfig = {
  resolution: "1920x1080", fullscreen: true, refreshRate: 60,
  qualityPreset: "balanced", shadowQuality: "medium",
  antiAliasing: "fxaa", textureFiltering: "anisotropic4",
  uiScale: 1.0, vsync: true, fpsLimit: 60,
};

const qualityPresets = [
  { id: "performance", label: "性能优先", desc: "最高帧率，适合后期卡顿", icon: "⚡" },
  { id: "balanced", label: "平衡", desc: "画质与性能平衡", icon: "⚖️" },
  { id: "quality", label: "画质优先", desc: "最佳视觉效果", icon: "🎨" },
  { id: "cinematic", label: "电影级", desc: "极致画质，截图专用", icon: "🎬" },
];

const launchArgs = [
  { flag: "-debug_mode", label: "调试模式", desc: "启用开发者控制台" },
  { flag: "-develop", label: "开发模式", desc: "启用更多调试选项" },
  { flag: "-no_workshop", label: "禁用创意工坊", desc: "不加载 Steam Workshop Mod" },
  { flag: "-no_mods", label: "禁用所有 Mod", desc: "纯净原版启动" },
  { flag: "-windowed", label: "窗口化", desc: "以窗口模式运行" },
  { flag: "-borderless", label: "无边框窗口", desc: "无边框全屏窗口" },
  { flag: "-no_intro", label: "跳过开场动画", desc: "直接进入主菜单" },
  { flag: "-mem_large", label: "大内存模式", desc: "为16GB+内存启用大内存模式" },
];

export default function Configuration() {
  const { gameInfo } = useAppStore();
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [enabledArgs, setEnabledArgs] = useState<Set<string>>(new Set());
  const [customArgs, setCustomArgs] = useState("");
  const [activeTab, setActiveTab] = useState<"graphics" | "launch" | "profiles" | "scene">("graphics");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sysInfo, setSysInfo] = useState<{ gpu_name: string; vram_mb: number; ram_mb: number; cpu_cores: number; recommended_quality: string } | null>(null);

  // 从 pdx_settings.json 读取真实配置
  useEffect(() => {
    loadGameSettings();
    loadSystemInfo();
  }, []);

  const loadGameSettings = async () => {
    try {
      setLoading(true);
      const settings: any = await invoke("get_game_settings");
      if (settings) {
        setConfig({
          resolution: `${settings.resolution?.width || 1920}x${settings.resolution?.height || 1080}`,
          fullscreen: settings.fullscreen ?? true,
          refreshRate: 60,
          qualityPreset: mapQualityToPreset(settings.quality),
          shadowQuality: settings.shadow_quality || "medium",
          antiAliasing: settings.anti_aliasing || "fxaa",
          textureFiltering: settings.anisotropic || "anisotropic4",
          uiScale: settings.ui_scale ?? 1.0,
          vsync: settings.vsync ?? true,
          fpsLimit: settings.fps_limit || 60,
        });
      }
    } catch (e) {
      console.log("Using default config:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const info: any = await invoke("get_system_info");
      setSysInfo(info);
    } catch (e) {
      console.log("System info not available:", e);
    }
  };

  const mapQualityToPreset = (q: string) => {
    switch (q) {
      case "low": return "performance";
      case "medium": return "balanced";
      case "high": return "quality";
      default: return "balanced";
    }
  };

  const mapPresetToQuality = (p: string) => {
    switch (p) {
      case "performance": return "low";
      case "balanced": return "medium";
      case "quality": return "high";
      case "cinematic": return "high";
      default: return "medium";
    }
  };

  const handleSave = async () => {
    try {
      const [w, h] = config.resolution.split("x").map(Number);
      const settings = {
        resolution: { width: w || 1920, height: h || 1080 },
        fullscreen: config.fullscreen,
        quality: mapPresetToQuality(config.qualityPreset),
        shadow_quality: config.shadowQuality,
        anti_aliasing: config.antiAliasing,
        texture_quality: mapPresetToQuality(config.qualityPreset),
        ui_scale: config.uiScale,
        vsync: config.vsync,
        fps_limit: config.fpsLimit,
        anisotropic: config.textureFiltering,
      };
      await invoke("save_game_settings", { settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      console.error("Save failed:", e);
    }
  };

  const handleAutoOptimize = async () => {
    try {
      const settings: any = await invoke("auto_optimize_settings");
      if (settings) {
        setConfig({
          resolution: `${settings.resolution?.width || 1920}x${settings.resolution?.height || 1080}`,
          fullscreen: settings.fullscreen ?? true,
          refreshRate: 60,
          qualityPreset: mapQualityToPreset(settings.quality),
          shadowQuality: settings.shadow_quality || "medium",
          antiAliasing: settings.anti_aliasing || "fxaa",
          textureFiltering: settings.anisotropic || "anisotropic4",
          uiScale: settings.ui_scale ?? 1.0,
          vsync: settings.vsync ?? true,
          fpsLimit: settings.fps_limit || 60,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e: any) {
      console.error("Auto optimize failed:", e);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-light text-white/90">配置中心</h2>
          <p className="text-xs text-white/30 mt-0.5">图形设置读写 pdx_settings.json，真实生效</p>
        </div>
      </div>

      {/* 系统信息卡片 */}
      {sysInfo && (
        <div className="card p-4 flex items-center gap-4 bg-aurora-purple/5 border-aurora-purple/20">
          <div className="w-10 h-10 rounded-lg bg-aurora-purple/10 flex items-center justify-center text-lg">🖥️</div>
          <div className="flex-1 text-xs text-white/50 space-y-0.5">
            <span className="text-white/70">{sysInfo.gpu_name}</span>
            <span className="mx-2">|</span>
            <span>VRAM: {(sysInfo.vram_mb / 1024).toFixed(1)}GB</span>
            <span className="mx-2">|</span>
            <span>RAM: {(sysInfo.ram_mb / 1024).toFixed(0)}GB</span>
            <span className="mx-2">|</span>
            <span>推荐画质: <span className="text-aurora-green">{sysInfo.recommended_quality === "high" ? "高" : sysInfo.recommended_quality === "medium" ? "中" : "低"}</span></span>
          </div>
          <button onClick={handleAutoOptimize} className="btn-primary text-xs px-3 py-1.5">⚡ 一键优化</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-base-700 rounded-lg p-1 w-fit">
        {([
          { id: "graphics" as const, label: "🎨 图形设置" },
          { id: "launch" as const, label: "🚀 启动参数" },
          { id: "profiles" as const, label: "💼 配置方案" },
          { id: "scene" as const, label: "🎮 场景管理" },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === "graphics" && (
        <div className="card p-6 space-y-5">
          {loading ? (
            <p className="text-sm text-white/30 text-center py-8">正在加载配置...</p>
          ) : (
            <>
              <ConfigRow label="分辨率">
                <div className="flex items-center gap-3">
                  <input type="text" value={config.resolution} onChange={(e) => setConfig({ ...config, resolution: e.target.value })} className="w-36" />
                  <label className="flex items-center gap-2 text-sm text-white/55 cursor-pointer">
                    <input type="checkbox" checked={config.fullscreen} onChange={(e) => setConfig({ ...config, fullscreen: e.target.checked })} /> 全屏
                  </label>
                  <span className="text-xs text-white/20">刷新率: {config.refreshRate}Hz</span>
                </div>
              </ConfigRow>
              <ConfigRow label="画质预设">
                <div className="grid grid-cols-4 gap-2">
                  {qualityPresets.map((preset) => (
                    <button key={preset.id} onClick={() => setConfig({ ...config, qualityPreset: preset.id })}
                      className={`card p-3 text-center transition-all ${config.qualityPreset === preset.id ? "border-aurora-green/40 bg-aurora-green/5" : ""}`}>
                      <span className="text-lg">{preset.icon}</span>
                      <p className="text-sm text-white/80 mt-1">{preset.label}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </ConfigRow>
              <ConfigRow label="阴影质量">
                <select value={config.shadowQuality} onChange={(e) => setConfig({ ...config, shadowQuality: e.target.value })}>
                  <option value="off">关闭</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="ultra">极高</option>
                </select>
              </ConfigRow>
              <ConfigRow label="抗锯齿">
                <select value={config.antiAliasing} onChange={(e) => setConfig({ ...config, antiAliasing: e.target.value })}>
                  <option value="off">关闭</option><option value="fxaa">FXAA</option><option value="msaa_2">MSAA 2x</option><option value="msaa_4">MSAA 4x</option><option value="msaa_8">MSAA 8x</option>
                </select>
              </ConfigRow>
              <ConfigRow label="纹理过滤">
                <select value={config.textureFiltering} onChange={(e) => setConfig({ ...config, textureFiltering: e.target.value })}>
                  <option value="x2">各向异性 2x</option><option value="x4">各向异性 4x</option><option value="x8">各向异性 8x</option><option value="x16">各向异性 16x</option>
                </select>
              </ConfigRow>
              <ConfigRow label="UI 缩放">
                <div className="flex items-center gap-3">
                  <input type="range" min="0.5" max="2.0" step="0.1" value={config.uiScale}
                    onChange={(e) => setConfig({ ...config, uiScale: parseFloat(e.target.value) })} className="w-40" />
                  <span className="text-sm text-white/55">{config.uiScale}x</span>
                </div>
              </ConfigRow>
              <ConfigRow label="垂直同步">
                <button onClick={() => setConfig({ ...config, vsync: !config.vsync })} className={`switch ${config.vsync ? "active" : ""}`}><span className="switch-knob" /></button>
              </ConfigRow>
              <ConfigRow label="帧率限制">
                <input type="number" value={config.fpsLimit} onChange={(e) => setConfig({ ...config, fpsLimit: Number(e.target.value) })} className="w-24" />
              </ConfigRow>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="btn-primary text-sm">{saved ? "✅ 已保存到 pdx_settings.json" : "💾 保存配置"}</button>
                <button onClick={() => setConfig(defaultConfig)} className="btn-secondary text-sm">↩ 恢复默认</button>
                <button onClick={handleAutoOptimize} className="btn-secondary text-sm">⚡ 自动优化</button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "launch" && (
        <div className="card p-6 space-y-4">
          <p className="text-sm text-white/35">Victoria 3 启动参数（勾选以启用，保存到场景中）</p>
          {launchArgs.map((arg) => (
            <label key={arg.flag} className="flex items-center gap-3 p-3 card cursor-pointer hover:bg-white/[0.03]">
              <input type="checkbox" checked={enabledArgs.has(arg.flag)} onChange={(e) => {
                const next = new Set(enabledArgs); e.target.checked ? next.add(arg.flag) : next.delete(arg.flag); setEnabledArgs(next);
              }} />
              <div className="flex-1">
                <p className="text-sm text-white/80 font-mono">{arg.flag}</p>
                <p className="text-xs text-white/25">{arg.desc}</p>
              </div>
            </label>
          ))}
          <div>
            <label className="text-xs text-white/35 block mb-1.5">自定义参数</label>
            <input type="text" value={customArgs} onChange={(e) => setCustomArgs(e.target.value)}
              placeholder="输入额外启动参数..." className="w-full font-mono text-xs" />
          </div>
          <div className="pt-2">
            <p className="text-xs text-white/20 font-mono bg-base-700/50 p-2 rounded-md">
              预览: victoria3.exe {Array.from(enabledArgs).join(" ")} {customArgs}
            </p>
          </div>
        </div>
      )}

      {activeTab === "profiles" && <ProfileManager config={config} onApplyProfile={(c) => setConfig(c)} />}

      {activeTab === "scene" && <SceneManager />}
    </motion.div>
  );
}

function SceneManager() {
  const { scenes, saves, playsets, createScene, deleteScene, loadScenes } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newScene, setNewScene] = useState({ name: "", description: "", playset_id: "", save_id: "", config_json: "{}", launch_args: [] as string[] });

  useEffect(() => { loadScenes(); }, []);

  const handleCreate = async () => {
    if (!newScene.name.trim()) return;
    await createScene({ ...newScene, playset_id: newScene.playset_id || null, save_id: newScene.save_id || null, icon: null });
    setNewScene({ name: "", description: "", playset_id: "", save_id: "", config_json: "{}", launch_args: [] });
    setShowCreate(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/35">场景 = Mod组合 + 存档 + 配置，一键切换游戏状态</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">+ 新建场景</button>
      </div>
      {scenes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3 opacity-30">🎮</div>
          <p className="text-white/25">还没有场景</p>
          <p className="text-xs text-white/15 mt-1">创建你的第一个场景吧</p>
        </div>
      ) : (
        scenes.map((scene) => (
          <div key={scene.id} className="card p-4 flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-aurora-green/15 to-aurora-blue/10 flex items-center justify-center text-lg">{scene.icon || "🎮"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{scene.name}</p>
              <p className="text-xs text-white/25 truncate">{scene.description || "无描述"}</p>
              <div className="flex items-center gap-2 mt-1">
                {scene.playset_id && <span className="text-[10px] bg-aurora-green/10 text-aurora-green px-1.5 rounded">含Mod</span>}
                {scene.save_id && <span className="text-[10px] bg-aurora-blue/10 text-aurora-blue px-1.5 rounded">绑定存档</span>}
              </div>
            </div>
            <button onClick={() => deleteScene(scene.id)} className="btn-ghost text-xs text-error opacity-0 group-hover:opacity-100">删除</button>
          </div>
        ))
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="glass-strong p-6 w-96 space-y-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white/90">新建场景</h3>
            <div>
              <label className="text-xs text-white/35 block mb-1.5">场景名称</label>
              <input type="text" value={newScene.name} onChange={(e) => setNewScene({ ...newScene, name: e.target.value })} placeholder="如：大清统一" className="w-full" autoFocus />
            </div>
            <div>
              <label className="text-xs text-white/35 block mb-1.5">描述</label>
              <input type="text" value={newScene.description} onChange={(e) => setNewScene({ ...newScene, description: e.target.value })} placeholder="简要描述..." className="w-full" />
            </div>
            <div>
              <label className="text-xs text-white/35 block mb-1.5">绑定 Mod 组合</label>
              <select value={newScene.playset_id} onChange={(e) => setNewScene({ ...newScene, playset_id: e.target.value })} className="w-full">
                <option value="">无</option>
                {playsets.map((ps) => <option key={ps.id} value={ps.id}>{ps.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/35 block mb-1.5">绑定存档</label>
              <select value={newScene.save_id} onChange={(e) => setNewScene({ ...newScene, save_id: e.target.value })} className="w-full">
                <option value="">无</option>
                {saves.map((s) => <option key={s.id} value={s.id}>{s.country_name || s.file_name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={handleCreate} className="btn-primary text-sm">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/45 w-24 flex-shrink-0 pt-1">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface ConfigProfile {
  id: string;
  name: string;
  config_json: string;
  launch_args: string;
  description: string;
  updated_at: string;
}

function ProfileManager({ config, onApplyProfile }: { config: GameConfig; onApplyProfile: (c: GameConfig) => void }) {
  const [profiles, setProfiles] = useState<ConfigProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const list: ConfigProfile[] = await invoke("get_config_profiles");
      setProfiles(list);
    } catch (e: any) {
      console.error("Failed to load profiles:", e);
    }
    setLoading(false);
  };

  useEffect(() => { loadProfiles(); }, []);

  const handleSaveCurrent = async (profileId: string, profileName: string) => {
    setSavingId(profileId);
    try {
      await invoke("save_config_profile", {
        id: profileId,
        name: profileName,
        configJson: JSON.stringify(config),
        launchArgs: "",
        description: `画质预设: ${config.qualityPreset}`,
      });
      await loadProfiles();
    } catch (e: any) {
      console.error("Failed to save profile:", e);
    }
    setSavingId(null);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm("确定删除此配置方案？")) return;
    try {
      await invoke("delete_config_profile", { id: profileId });
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (e: any) {
      console.error("Failed to delete profile:", e);
    }
  };

  const handleApplyProfile = (profile: ConfigProfile) => {
    try {
      const savedConfig = JSON.parse(profile.config_json);
      onApplyProfile(savedConfig as GameConfig);
    } catch {}
  };

  const presetProfiles = [
    { id: "daily", name: "日常游玩", desc: "高画质、Mod全开", icon: "🎮" },
    { id: "recording", name: "录制视频", desc: "最高画质、关闭UI Mod", icon: "🎬" },
    { id: "testing", name: "测试 Mod", desc: "Debug模式、单Mod测试", icon: "🧪" },
    { id: "multiplayer", name: "多人游戏", desc: "关闭Mod、平衡画质", icon: "👥" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/35">保存多套配置，通过场景管理一键切换</p>
        <button onClick={loadProfiles} disabled={loading} className="btn-secondary text-xs">{loading ? "加载中..." : "🔄 刷新"}</button>
      </div>

      {/* 预设方案 */}
      <p className="text-xs text-white/20 mb-1">预设方案</p>
      <div className="space-y-2">
        {presetProfiles.map((profile) => (
          <div key={profile.id} className="card p-3.5 flex items-center gap-3 hover:border-aurora-green/20 transition-all">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-base-700 to-base-600 flex items-center justify-center text-base flex-shrink-0">{profile.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">{profile.name}</p>
              <p className="text-xs text-white/25 truncate">{profile.desc}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => handleSaveCurrent(profile.id, profile.name)} disabled={savingId === profile.id}
                className="btn-secondary text-xs">{savingId === profile.id ? "保存中..." : "保存当前"}</button>
            </div>
          </div>
        ))}
      </div>

      {/* 已保存的方案 */}
      {profiles.length > 0 && (
        <>
          <p className="text-xs text-white/20 mb-1 pt-2">已保存方案</p>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="card p-3.5 flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-aurora-green/10 to-aurora-blue/10 flex items-center justify-center text-base flex-shrink-0">💾</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{profile.name}</p>
                  <p className="text-xs text-white/25 truncate">{profile.description} · {profile.updated_at?.slice(0, 10)}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleApplyProfile(profile)} className="btn-primary text-xs">应用</button>
                  <button onClick={() => handleDeleteProfile(profile.id)} className="btn-ghost text-xs text-error">删除</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
