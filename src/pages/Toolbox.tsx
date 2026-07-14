import { useState } from "react";
import { motion } from "framer-motion";

type ToolId = "log" | "screenshot" | "calculator" | "workshop";

export default function Toolbox() {
  const [activeTool, setActiveTool] = useState<ToolId>("log");

  const tools = [
    { id: "log" as const, icon: "📋", label: "日志分析器" },
    { id: "screenshot" as const, icon: "📸", label: "截图管理" },
    { id: "calculator" as const, icon: "🧮", label: "经济计算器" },
    { id: "workshop" as const, icon: "🏪", label: "创意工坊" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-enter space-y-4"
    >
      <h2 className="text-xl font-display font-light text-white/90">工具箱</h2>

      {/* 工具选择 */}
      <div className="flex gap-1 bg-surface rounded-lg p-1 w-fit">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2 ${
              activeTool === tool.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <span>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {activeTool === "log" && <LogAnalyzer />}
      {activeTool === "screenshot" && <ScreenshotManager />}
      {activeTool === "calculator" && <EconomicCalculator />}
      {activeTool === "workshop" && <WorkshopBrowser />}
    </motion.div>
  );
}

function LogAnalyzer() {
  const [logContent, setLogContent] = useState("");
  const [analysis, setAnalysis] = useState<string[]>([]);

  const handleAnalyze = () => {
    const errors = logContent
      .split("\n")
      .filter(
        (line) =>
          line.toLowerCase().includes("error") ||
          line.toLowerCase().includes("crash") ||
          line.toLowerCase().includes("exception")
      );

    setAnalysis(errors.length > 0 ? errors : ["未发现明显错误"]);
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">Victoria 3 日志分析</h3>
        <div className="flex gap-2">
          <button onClick={handleAnalyze} className="btn-primary text-xs">
            🔍 分析日志
          </button>
          <button className="btn-secondary text-xs">📁 加载文件</button>
        </div>
      </div>

      <textarea
        value={logContent}
        onChange={(e) => setLogContent(e.target.value)}
        placeholder="粘贴 error.log 或 game.log 内容..."
        className="w-full h-40 bg-surface border border-white/10 rounded-md p-3 text-xs text-white/70 font-mono resize-none outline-none focus:border-v3-gold"
      />

      {analysis.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/40">分析结果 ({analysis.length} 条)</p>
          {analysis.map((line, i) => (
            <div
              key={i}
              className={`p-2 rounded text-xs font-mono ${
                line === "未发现明显错误"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-error/10 text-error"
              }`}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-white/20">
        日志文件位置：文档\Paradox Interactive\Victoria 3\logs\
      </div>
    </div>
  );
}

function ScreenshotManager() {
  const screenshots = [
    { name: "大清_1880_01_01.png", date: "1880.1.1", size: "2.4MB" },
    { name: "普鲁士_1872_06_15.png", date: "1872.6.15", size: "3.1MB" },
  ];

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">游戏截图</h3>
        <button className="btn-secondary text-xs">🔄 刷新</button>
      </div>

      {screenshots.length === 0 ? (
        <div className="text-center py-12 text-white/20">
          <div className="text-4xl mb-3">📸</div>
          <p>暂无截图</p>
          <p className="text-xs mt-1">按 F12 在游戏中截图</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {screenshots.map((ss, i) => (
            <div key={i} className="card p-2">
              <div className="w-full h-24 bg-gradient-to-br from-v3-navy/40 to-surface rounded flex items-center justify-center mb-1">
                <span className="text-2xl opacity-20">📸</span>
              </div>
              <p className="text-xs text-white/60 truncate">{ss.name}</p>
              <p className="text-[10px] text-white/30">{ss.date} · {ss.size}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EconomicCalculator() {
  const [constructionPoints, setConstructionPoints] = useState(100);
  const [constructionEfficiency, setConstructionEfficiency] = useState(1.0);

  const weeklyBuild = constructionPoints * constructionEfficiency * 7;
  const steelNeeded = Math.round(weeklyBuild * 0.4);
  const woodNeeded = Math.round(weeklyBuild * 0.3);
  const toolsNeeded = Math.round(weeklyBuild * 0.1);

  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white/80">建设力计算器</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/40 block mb-1">建设力</label>
          <input
            type="number"
            value={constructionPoints}
            onChange={(e) => setConstructionPoints(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">效率倍率</label>
          <input
            type="number"
            step="0.1"
            value={constructionEfficiency}
            onChange={(e) => setConstructionEfficiency(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="card bg-surface/50 p-3 space-y-2">
        <p className="text-xs text-white/40">每周资源需求估算</p>
        <div className="grid grid-cols-3 gap-3">
          <ResultCard label="钢铁" value={steelNeeded} unit="单位/周" />
          <ResultCard label="木材" value={woodNeeded} unit="单位/周" />
          <ResultCard label="工具" value={toolsNeeded} unit="单位/周" />
        </div>
      </div>

      <p className="text-xs text-white/20">
        基于建筑部门效率估算，实际值受市场波动影响
      </p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-v3-gold">{value}</div>
      <div className="text-[10px] text-white/30">{label}</div>
      <div className="text-[10px] text-white/20">{unit}</div>
    </div>
  );
}

function WorkshopBrowser() {
  const [search, setSearch] = useState("");

  const mockItems = [
    { name: "Anbeeld's Revision of AI", author: "Anbeeld", rating: 5, subs: 52000 },
    { name: "Visible Pop Needs", author: "Cold", rating: 4, subs: 38000 },
    { name: "Better UI Mod", author: "UI Team", rating: 4, subs: 29000 },
    { name: "大清扩展 Mod", author: "CN Mod Team", rating: 5, subs: 18000 },
  ];

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">创意工坊浏览器</h3>
        <span className="text-xs text-white/20">Steam Workshop</span>
      </div>

      <input
        type="search"
        placeholder="搜索 Victoria 3 创意工坊..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      <div className="space-y-2">
        {mockItems
          .filter((item) =>
            search
              ? item.name.toLowerCase().includes(search.toLowerCase())
              : true
          )
          .map((item, i) => (
            <div key={i} className="card p-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-v3-navy/60 to-v3-gold/30 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{item.name}</p>
                <p className="text-xs text-white/30">{item.author}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-v3-gold">{"★".repeat(item.rating)}</p>
                <p className="text-[10px] text-white/20">
                  {(item.subs / 1000).toFixed(0)}k 订阅
                </p>
              </div>
              <button className="btn-secondary text-xs">订阅</button>
            </div>
          ))}
      </div>
    </div>
  );
}
