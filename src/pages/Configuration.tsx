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
}

const defaultConfig: GameConfig = {
  resolution: "1920x1080",
  fullscreen: true,
  refreshRate: 60,
  qualityPreset: "balanced",
  shadowQuality: "medium",
  antiAliasing: "fxaa",
  textureFiltering: "anisotropic4",
  uiScale: 1.0,
};

const qualityPresets = [
  { id: "performance", label: "性能优先", desc: "最高帧率，适合后期卡顿" },
  { id: "balanced", label: "平衡", desc: "画质与性能平衡" },
  { id: "quality", label: "画质优先", desc: "最佳视觉效果" },
  { id: "cinematic", label: "电影级", desc: "极致画质，截图专用" },
];

const launchArgs = [
  { flag: "-debug_mode", label: "调试模式", desc: "启用开发者控制台" },
  { flag: "-develop", label: "开发模式", desc: "启用更多调试选项" },
  { flag: "-no_workshop", label: "禁用创意工坊", desc: "不加载 Steam Workshop Mod" },
  { flag: "-no_mods", label: "禁用所有 Mod", desc: "纯净原版启动" },
  { flag: "-heap_size", label: "堆内存大小", desc: "自定义内存分配（如 -heap_size 4194304）", hasValue: true },
];

export default function Configuration() {
  const { gameInfo } = useAppStore();
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [enabledArgs, setEnabledArgs] = useState<Set<string>>(new Set());
  const [customArgs, setCustomArgs] = useState("");
  const [activeTab, setActiveTab] = useState<"graphics" | "launch" | "profiles">("graphics");

  const profiles = [
    { id: "daily", name: "日常游玩", desc: "高画质、全 Mod", config: "balanced" },
    { id: "recording", name: "录制视频", desc: "最高画质、关闭 UI Mod", config: "cinematic" },
    { id: "testing", name: "测试 Mod", desc: "Debug 模式、仅启用待测试 Mod", config: "performance" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-enter space-y-4"
    >
      <h2 className="text-xl font-display font-light text-white/90">配置中心</h2>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-surface rounded-lg p-1 w-fit">
        {(["graphics", "launch", "profiles"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm transition-all ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab === "graphics" ? "🎨 图形设置" : tab === "launch" ? "🚀 启动参数" : "💼 性能配置"}
          </button>
        ))}
      </div>

      {activeTab === "graphics" && (
        <div className="card p-6 space-y-5">
          {/* 分辨率 */}
          <ConfigRow label="分辨率">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={config.resolution}
                onChange={(e) => setConfig({ ...config, resolution: e.target.value })}
                className="w-36"
              />
              <label className="flex items-center gap-2 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={config.fullscreen}
                  onChange={(e) => setConfig({ ...config, fullscreen: e.target.checked })}
                  className="accent-v3-gold"
                />
                全屏
              </label>
              <span className="text-xs text-white/20">刷新率: {config.refreshRate}Hz</span>
            </div>
          </ConfigRow>

          {/* 画质预设 */}
          <ConfigRow label="画质预设">
            <div className="grid grid-cols-4 gap-2">
              {qualityPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setConfig({ ...config, qualityPreset: preset.id })}
                  className={`card p-3 text-center transition-all ${
                    config.qualityPreset === preset.id
                      ? "border-v3-gold/50 bg-v3-gold/5"
                      : ""
                  }`}
                >
                  <p className="text-sm text-white/80">{preset.label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{preset.desc}</p>
                </button>
              ))}
            </div>
          </ConfigRow>

          {/* 高级选项 */}
          <ConfigRow label="阴影质量">
            <select
              value={config.shadowQuality}
              onChange={(e) => setConfig({ ...config, shadowQuality: e.target.value })}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="ultra">极高</option>
            </select>
          </ConfigRow>

          <ConfigRow label="抗锯齿">
            <select
              value={config.antiAliasing}
              onChange={(e) => setConfig({ ...config, antiAliasing: e.target.value })}
            >
              <option value="off">关闭</option>
              <option value="fxaa">FXAA</option>
              <option value="msaa2">MSAA 2x</option>
              <option value="msaa4">MSAA 4x</option>
            </select>
          </ConfigRow>

          <ConfigRow label="纹理过滤">
            <select
              value={config.textureFiltering}
              onChange={(e) => setConfig({ ...config, textureFiltering: e.target.value })}
            >
              <option value="bilinear">双线性</option>
              <option value="trilinear">三线性</option>
              <option value="anisotropic4">各向异性 4x</option>
              <option value="anisotropic8">各向异性 8x</option>
            </select>
          </ConfigRow>

          <ConfigRow label="UI 缩放">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.uiScale}
                onChange={(e) => setConfig({ ...config, uiScale: parseFloat(e.target.value) })}
                className="w-32 accent-v3-gold"
              />
              <span className="text-sm text-white/60">{config.uiScale}x</span>
              <span className="text-xs text-white/20">（4K 屏幕建议 1.5x）</span>
            </div>
          </ConfigRow>

          <div className="flex gap-2 pt-2">
            <button className="btn-primary text-sm">💾 保存配置</button>
            <button className="btn-secondary text-sm">↩ 恢复默认</button>
          </div>
        </div>
      )}

      {activeTab === "launch" && (
        <div className="card p-6 space-y-4">
          <p className="text-sm text-white/40">Victoria 3 启动参数（勾选以启用）</p>
          {launchArgs.map((arg) => (
            <label
              key={arg.flag}
              className="flex items-center gap-3 p-3 card cursor-pointer hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={enabledArgs.has(arg.flag)}
                onChange={(e) => {
                  const next = new Set(enabledArgs);
                  e.target.checked ? next.add(arg.flag) : next.delete(arg.flag);
                  setEnabledArgs(next);
                }}
                className="accent-v3-gold"
              />
              <div className="flex-1">
                <p className="text-sm text-white/80 font-mono">{arg.flag}</p>
                <p className="text-xs text-white/30">{arg.desc}</p>
              </div>
              {"hasValue" in arg && (
                <input
                  type="text"
                  placeholder="参数值"
                  className="w-28 text-xs"
                />
              )}
            </label>
          ))}

          <div>
            <label className="text-xs text-white/40 block mb-1">自定义参数</label>
            <input
              type="text"
              value={customArgs}
              onChange={(e) => setCustomArgs(e.target.value)}
              placeholder="输入额外启动参数..."
              className="w-full"
            />
          </div>

          <div className="pt-2">
            <p className="text-xs text-white/20 font-mono">
              预览: victoria3.exe{" "}
              {Array.from(enabledArgs).join(" ")}{" "}
              {customArgs}
            </p>
          </div>
        </div>
      )}

      {activeTab === "profiles" && (
        <div className="space-y-3">
          <p className="text-sm text-white/40">保存多套配置，一键切换</p>
          {profiles.map((profile) => (
            <div key={profile.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-v3-navy/60 to-v3-gold/30 flex items-center justify-center text-lg">
                {profile.id === "daily" ? "🎮" : profile.id === "recording" ? "🎬" : "🧪"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">{profile.name}</p>
                <p className="text-xs text-white/30">{profile.desc}</p>
              </div>
              <button className="btn-secondary text-xs">应用</button>
            </div>
          ))}
          <button className="btn-secondary text-sm w-full">+ 新建配置方案</button>
        </div>
      )}
    </motion.div>
  );
}

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50 w-24 flex-shrink-0 pt-1">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
