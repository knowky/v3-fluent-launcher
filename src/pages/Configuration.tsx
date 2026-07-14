import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";

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
];

export default function Configuration() {
  const { gameInfo } = useAppStore();
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [enabledArgs, setEnabledArgs] = useState<Set<string>>(new Set());
  const [customArgs, setCustomArgs] = useState("");
  const [activeTab, setActiveTab] = useState<"graphics" | "launch" | "profiles" | "scene">("graphics");
  const [saved, setSaved] = useState(false);

  const profiles = [
    { id: "daily", name: "日常游玩", desc: "高画质、全 Mod", icon: "🎮" },
    { id: "recording", name: "录制视频", desc: "最高画质、关闭 UI Mod", icon: "🎬" },
    { id: "testing", name: "测试 Mod", desc: "Debug 模式、仅启用待测试 Mod", icon: "🧪" },
    { id: "multiplayer", name: "多人游戏", desc: "关闭所有 Mod、平衡画质", icon: "👥" },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-light text-white/90">配置中心</h2>
          <p className="text-xs text-white/30 mt-0.5">游戏图形、启动参数、配置文件管理</p>
        </div>
      </div>

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
              <option value="off">关闭</option><option value="fxaa">FXAA</option><option value="msaa2">MSAA 2x</option><option value="msaa4">MSAA 4x</option><option value="msaa8">MSAA 8x</option>
            </select>
          </ConfigRow>
          <ConfigRow label="纹理过滤">
            <select value={config.textureFiltering} onChange={(e) => setConfig({ ...config, textureFiltering: e.target.value })}>
              <option value="bilinear">双线性</option><option value="trilinear">三线性</option><option value="anisotropic4">各向异性 4x</option><option value="anisotropic8">各向异性 8x</option><option value="anisotropic16">各向异性 16x</option>
            </select>
          </ConfigRow>
          <ConfigRow label="UI 缩放">
            <div className="flex items-center gap-3">
              <input type="range" min="0.5" max="2.0" step="0.1" value={config.uiScale}
                onChange={(e) => setConfig({ ...config, uiScale: parseFloat(e.target.value) })} className="w-40" />
              <span className="text-sm text-white/55">{config.uiScale}x</span>
              <span className="text-xs text-white/20">（4K 建议 1.5x）</span>
            </div>
          </ConfigRow>
          <ConfigRow label="垂直同步">
            <button onClick={() => setConfig({ ...config, vsync: !config.vsync })} className={`switch ${config.vsync ? "active" : ""}`}><span className="switch-knob" /></button>
          </ConfigRow>
          <ConfigRow label="帧率限制">
            <input type="number" value={config.fpsLimit} onChange={(e) => setConfig({ ...config, fpsLimit: Number(e.target.value) })} className="w-24" />
          </ConfigRow>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="btn-primary text-sm">{saved ? "✅ 已保存" : "💾 保存配置"}</button>
            <button onClick={() => setConfig(defaultConfig)} className="btn-secondary text-sm">↩ 恢复默认</button>
          </div>
        </div>
      )}

      {activeTab === "launch" && (
        <div className="card p-6 space-y-4">
          <p className="text-sm text-white/35">Victoria 3 启动参数（勾选以启用）</p>
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

      {activeTab === "profiles" && (
        <div className="space-y-3">
          <p className="text-sm text-white/35">保存多套配置，一键切换</p>
          {profiles.map((profile) => (
            <div key={profile.id} className="card p-4 flex items-center gap-4 hover:border-aurora-green/20 transition-all">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-base-700 to-base-600 flex items-center justify-center text-lg">{profile.icon}</div>
              <div className="flex-1">
                <p className="text-sm text-white/80">{profile.name}</p>
                <p className="text-xs text-white/25">{profile.desc}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-xs">应用</button>
                <button className="btn-secondary text-xs">编辑</button>
              </div>
            </div>
          ))}
          <button className="btn-secondary text-sm w-full">+ 新建配置方案</button>
        </div>
      )}

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

import { useEffect } from "react";

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/45 w-24 flex-shrink-0 pt-1">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
