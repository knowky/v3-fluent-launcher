import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";

type ToolId = "log" | "screenshot" | "calculator" | "performance" | "cache";

export default function Toolbox() {
  const [activeTool, setActiveTool] = useState<ToolId>("log");

  const tools = [
    { id: "log" as const, icon: "📋", label: "日志分析", desc: "分析游戏日志" },
    { id: "screenshot" as const, icon: "📸", label: "截图管理", desc: "管理游戏截图" },
    { id: "calculator" as const, icon: "🧮", label: "建设计算", desc: "建设力/经济计算" },
    { id: "performance" as const, icon: "⚡", label: "性能优化", desc: "优化游戏性能" },
    { id: "cache" as const, icon: "🧹", label: "缓存清理", desc: "清理游戏缓存" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-light text-white/90">工具箱</h2>
        <p className="text-xs text-white/30 mt-0.5">实用工具集合</p>
      </div>

      {/* Tool Selector */}
      <div className="flex gap-1 bg-base-700 rounded-lg p-1 w-fit flex-wrap">
        {tools.map((tool) => (
          <button key={tool.id} onClick={() => setActiveTool(tool.id)}
            className={`tab flex items-center gap-1.5 ${activeTool === tool.id ? "active" : ""}`}>
            <span>{tool.icon}</span><span>{tool.label}</span>
          </button>
        ))}
      </div>

      {activeTool === "log" && <LogAnalyzer />}
      {activeTool === "screenshot" && <ScreenshotManager />}
      {activeTool === "calculator" && <EconomicCalculator />}
      {activeTool === "performance" && <PerformanceOptimizer />}
      {activeTool === "cache" && <CacheCleaner />}
    </motion.div>
  );
}

function LogAnalyzer() {
  const [logContent, setLogContent] = useState("");
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [stats, setStats] = useState<{ errors: number; warnings: number; mods: string[] }>({ errors: 0, warnings: 0, mods: [] });

  const handleAnalyze = () => {
    const lines = logContent.split("\n");
    const errors = lines.filter((l) => l.toLowerCase().includes("error") || l.toLowerCase().includes("crash") || l.toLowerCase().includes("exception"));
    const warnings = lines.filter((l) => l.toLowerCase().includes("warn") || l.toLowerCase().includes("deprecated"));
    const modLines = lines.filter((l) => l.toLowerCase().includes("mod")).slice(0, 10);

    setStats({ errors: errors.length, warnings: warnings.length, mods: modLines.map((l) => l.trim().substring(0, 80)) });
    setAnalysis(errors.length > 0 ? errors.slice(0, 20) : ["未发现明显错误"]);
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">📋 Victoria 3 日志分析器</h3>
        <div className="flex gap-2">
          <button onClick={handleAnalyze} className="btn-primary text-xs">🔍 分析</button>
          <button onClick={() => { setLogContent(""); setAnalysis([]); setStats({ errors: 0, warnings: 0, mods: [] }); }} className="btn-secondary text-xs">清空</button>
        </div>
      </div>

      <textarea value={logContent} onChange={(e) => setLogContent(e.target.value)}
        placeholder="粘贴 error.log 或 game.log 内容到这里..."
        className="w-full h-44 text-xs" />

      {analysis.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="card bg-base-700/50 p-2 text-center">
              <div className="text-lg font-semibold text-error">{stats.errors}</div>
              <div className="text-[10px] text-white/25">错误</div>
            </div>
            <div className="card bg-base-700/50 p-2 text-center">
              <div className="text-lg font-semibold text-warning">{stats.warnings}</div>
              <div className="text-[10px] text-white/25">警告</div>
            </div>
            <div className="card bg-base-700/50 p-2 text-center">
              <div className="text-lg font-semibold text-aurora-blue">{stats.mods.length}</div>
              <div className="text-[10px] text-white/25">Mod 相关</div>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {analysis.map((line, i) => (
              <div key={i} className={`p-2 rounded text-xs font-mono ${line === "未发现明显错误" ? "bg-aurora-green/10 text-aurora-green" : "bg-error/10 text-error"}`}>
                {line}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-white/20">日志位置: 文档\Paradox Interactive\Victoria 3\logs\</p>
    </div>
  );
}

function ScreenshotManager() {
  const screenshots = [
    { name: "大清_1880_01_01.png", date: "1880.1.1", size: "2.4MB" },
    { name: "普鲁士_1872_06_15.png", date: "1872.6.15", size: "3.1MB" },
    { name: "日本_1890_12_25.png", date: "1890.12.25", size: "1.8MB" },
  ];

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">📸 游戏截图</h3>
        <button className="btn-secondary text-xs">🔄 刷新</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {screenshots.map((ss, i) => (
          <div key={i} className="card p-2 group cursor-pointer">
            <div className="w-full h-24 bg-gradient-to-br from-base-700 to-base-600 rounded flex items-center justify-center mb-1.5 group-hover:from-base-600 group-hover:to-base-500 transition-all">
              <span className="text-2xl opacity-20">📸</span>
            </div>
            <p className="text-xs text-white/60 truncate">{ss.name}</p>
            <p className="text-[10px] text-white/25">{ss.date} · {ss.size}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/20">截图位置: 文档\Paradox Interactive\Victoria 3\screenshots\</p>
    </div>
  );
}

function EconomicCalculator() {
  const [constructionPoints, setConstructionPoints] = useState(100);
  const [efficiency, setEfficiency] = useState(1.0);
  const [govType, setGovType] = useState("laissez_faire");

  const multipliers: Record<string, number> = { traditionalism: 0.5, agrarianism: 0.75, interventionism: 1.0, laissez_faire: 1.25, command_economy: 1.5 };
  const weeklyBuild = Math.round(constructionPoints * efficiency * multipliers[govType] * 7);

  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white/70">🧮 建设力计算器</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/35 block mb-1">建设力</label>
          <input type="number" value={constructionPoints} onChange={(e) => setConstructionPoints(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-white/35 block mb-1">效率倍率</label>
          <input type="number" step="0.1" value={efficiency} onChange={(e) => setEfficiency(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-white/35 block mb-1">经济体制</label>
          <select value={govType} onChange={(e) => setGovType(e.target.value)} className="w-full">
            <option value="traditionalism">传统主义 (0.5x)</option>
            <option value="agrarianism">重农主义 (0.75x)</option>
            <option value="interventionism">干预主义 (1.0x)</option>
            <option value="laissez_faire">自由放任 (1.25x)</option>
            <option value="command_economy">计划经济 (1.5x)</option>
          </select>
        </div>
      </div>

      <div className="card bg-base-700/50 p-3 space-y-2">
        <p className="text-xs text-white/35">每周资源需求估算</p>
        <div className="grid grid-cols-4 gap-3">
          <ResultCard label="钢铁" value={Math.round(weeklyBuild * 0.4)} unit="单位/周" />
          <ResultCard label="木材" value={Math.round(weeklyBuild * 0.3)} unit="单位/周" />
          <ResultCard label="工具" value={Math.round(weeklyBuild * 0.1)} unit="单位/周" />
          <ResultCard label="织物" value={Math.round(weeklyBuild * 0.05)} unit="单位/周" />
        </div>
      </div>

      <div className="card bg-aurora-green/5 border border-aurora-green/10 p-3 text-center">
        <p className="text-xs text-aurora-green">周建设量: <span className="text-lg font-semibold">{weeklyBuild}</span> 点</p>
      </div>
    </div>
  );
}

function ResultCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-aurora-green">{value}</div>
      <div className="text-[10px] text-white/25">{label}</div>
      <div className="text-[10px] text-white/15">{unit}</div>
    </div>
  );
}

function PerformanceOptimizer() {
  const [tips] = useState([
    { title: "降低画质预设", desc: "将画质从「高」降至「中」可提升 20-30% FPS", impact: "high" },
    { title: "减少 Mod 数量", desc: "过多的 Mod 会显著增加加载时间和内存占用", impact: "high" },
    { title: "关闭阴影", desc: "阴影是最消耗 GPU 的设置之一", impact: "medium" },
    { title: "降低 UI 缩放", desc: "在 4K 屏幕上使用 1.0x 缩放可提升性能", impact: "medium" },
    { title: "清理存档", desc: "过多存档文件可能影响自动保存速度", impact: "low" },
    { title: "使用 SSD", desc: "将游戏安装在 SSD 上可大幅缩短加载时间", impact: "high" },
    { title: "关闭后台应用", desc: "释放内存和 CPU 资源给游戏", impact: "medium" },
    { title: "更新显卡驱动", desc: "新版驱动通常包含性能优化", impact: "medium" },
  ]);

  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white/70">⚡ Victoria 3 性能优化建议</h3>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div key={i} className="card p-3 flex items-center gap-3">
            <span className={`text-lg flex-shrink-0 ${
              tip.impact === "high" ? "" : tip.impact === "medium" ? "opacity-70" : "opacity-40"
            }`}>
              {tip.impact === "high" ? "🔴" : tip.impact === "medium" ? "🟡" : "🟢"}
            </span>
            <div>
              <p className="text-sm text-white/80">{tip.title}</p>
              <p className="text-xs text-white/25">{tip.desc}</p>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto flex-shrink-0 ${
              tip.impact === "high" ? "bg-error/10 text-error" : tip.impact === "medium" ? "bg-warning/10 text-warning" : "bg-aurora-green/10 text-aurora-green"
            }`}>
              {tip.impact === "high" ? "高影响" : tip.impact === "medium" ? "中影响" : "低影响"}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/20">提示：晚期游戏（1900+）由于 POP 数量增加，性能下降是正常现象</p>
    </div>
  );
}

function CacheCleaner() {
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState(false);
  const items = [
    { name: "Shader 缓存", path: "Documents/Paradox Interactive/Victoria 3/shadercache", size: "~50MB" },
    { name: "临时文件", path: "Documents/Paradox Interactive/Victoria 3/temp", size: "~10MB" },
    { name: "崩溃转储", path: "Documents/Paradox Interactive/Victoria 3/crashes", size: "~5MB" },
  ];

  const handleClean = async () => {
    setCleaning(true);
    await new Promise((r) => setTimeout(r, 1500));
    setCleaning(false);
    setCleaned(true);
    setTimeout(() => setCleaned(false), 3000);
  };

  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white/70">🧹 缓存清理</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/75">{item.name}</p>
              <p className="text-xs text-white/20 font-mono">{item.path}</p>
            </div>
            <span className="text-xs text-white/30">{item.size}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={handleClean} disabled={cleaning} className="btn-primary text-sm">
          {cleaning ? "清理中..." : cleaned ? "✅ 清理完成" : "🧹 清理所有缓存"}
        </button>
      </div>
      <p className="text-xs text-white/20">清理缓存不会影响存档和 Mod，但可能增加下次启动的加载时间</p>
    </div>
  );
}
