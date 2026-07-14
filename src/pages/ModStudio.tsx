import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import type { ModInfo, Playset } from "../types";

type ViewMode = "grid" | "list" | "graph";
type SortKey = "name" | "load_order" | "size" | "last_updated";

export default function ModStudio() {
  const {
    mods,
    playsets,
    scanMods,
    toggleMod,
    createPlayset,
    deletePlayset,
    isScanning,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("load_order");
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [showPlaysetDialog, setShowPlaysetDialog] = useState(false);
  const [newPlaysetName, setNewPlaysetName] = useState("");
  const [newPlaysetDesc, setNewPlaysetDesc] = useState("");

  useEffect(() => {
    scanMods();
  }, []);

  // 过滤和排序
  const filteredMods = mods
    .filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.display_name.toLowerCase().includes(q) ||
        (m.chinese_name && m.chinese_name.toLowerCase().includes(q)) ||
        m.tags.some((t) => t.toLowerCase().includes(q));
      const matchSource = filterSource === "all" || m.source === filterSource;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "enabled" && m.enabled) ||
        (filterStatus === "disabled" && !m.enabled) ||
        (filterStatus === "conflict" && m.conflict_count > 0) ||
        (filterStatus === "update" && m.has_update);
      return matchSearch && matchSource && matchStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          return b.size - a.size;
        case "last_updated":
          return b.last_updated.localeCompare(a.last_updated);
        default:
          return a.load_order - b.load_order;
      }
    });

  const handleCreatePlayset = async () => {
    if (!newPlaysetName.trim()) return;
    await createPlayset(
      newPlaysetName,
      newPlaysetDesc,
      Array.from(selectedMods)
    );
    setNewPlaysetName("");
    setNewPlaysetDesc("");
    setSelectedMods(new Set());
    setShowPlaysetDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-enter space-y-4"
    >
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-light text-white/90">
          Mod 工作室
        </h2>
        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex bg-surface rounded-md p-0.5">
            {(["grid", "list", "graph"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs rounded transition-all ${
                  viewMode === mode
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {mode === "grid" ? "▦" : mode === "list" ? "≡" : "◉"}
              </button>
            ))}
          </div>
          <button
            onClick={scanMods}
            disabled={isScanning}
            className="btn-secondary text-xs"
          >
            {isScanning ? "扫描中..." : "🔄 重新扫描"}
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <input
            type="search"
            placeholder="搜索 Mod 名称、标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8"
          />
          <svg
            className="absolute left-2.5 top-2.5 text-white/20"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="text-xs"
        >
          <option value="all">全部来源</option>
          <option value="Steam">Steam 创意工坊</option>
          <option value="Local">本地 Mod</option>
          <option value="GitHub">GitHub</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs"
        >
          <option value="all">全部状态</option>
          <option value="enabled">已启用</option>
          <option value="disabled">已禁用</option>
          <option value="conflict">有冲突</option>
          <option value="update">有更新</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="text-xs"
        >
          <option value="load_order">加载顺序</option>
          <option value="name">名称</option>
          <option value="size">大小</option>
          <option value="last_updated">更新时间</option>
        </select>

        {selectedMods.size > 0 && (
          <button
            onClick={() => setShowPlaysetDialog(true)}
            className="btn-primary text-xs"
          >
            创建 Playset ({selectedMods.size})
          </button>
        )}
      </div>

      {/* Playset 列表 */}
      {playsets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {playsets.map((ps) => (
            <div
              key={ps.id}
              className="flex items-center gap-2 card px-3 py-1.5 text-xs flex-shrink-0"
            >
              <span className="text-white/80">{ps.name}</span>
              <span className="text-white/20">({ps.mod_order.length})</span>
              <button
                onClick={() => deletePlayset(ps.id)}
                className="text-white/20 hover:text-error transition-colors ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mod 列表 */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            : "space-y-1"
        }
      >
        {filteredMods.map((mod, i) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
          >
            {viewMode === "grid" ? (
              <ModGridCard
                mod={mod}
                onToggle={(enabled) => toggleMod(mod.id, enabled)}
                selected={selectedMods.has(mod.id)}
                onSelect={() => {
                  const next = new Set(selectedMods);
                  next.has(mod.id) ? next.delete(mod.id) : next.add(mod.id);
                  setSelectedMods(next);
                }}
              />
            ) : viewMode === "list" ? (
              <ModListItem
                mod={mod}
                onToggle={(enabled) => toggleMod(mod.id, enabled)}
                selected={selectedMods.has(mod.id)}
                onSelect={() => {
                  const next = new Set(selectedMods);
                  next.has(mod.id) ? next.delete(mod.id) : next.add(mod.id);
                  setSelectedMods(next);
                }}
              />
            ) : (
              <ModGraphItem mod={mod} />
            )}
          </motion.div>
        ))}
      </div>

      {filteredMods.length === 0 && !isScanning && (
        <div className="card p-12 text-center text-white/20">
          <div className="text-4xl mb-3">📦</div>
          <p>没有找到 Mod</p>
          <p className="text-xs mt-1">
            {mods.length === 0
              ? "请先扫描 Mod 目录"
              : "尝试调整搜索或筛选条件"}
          </p>
        </div>
      )}

      {/* 新建 Playset 对话框 */}
      {showPlaysetDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card p-6 w-96 space-y-4">
            <h3 className="text-lg font-semibold">创建 Playset</h3>
            <div>
              <label className="text-xs text-white/50 block mb-1">名称</label>
              <input
                type="text"
                value={newPlaysetName}
                onChange={(e) => setNewPlaysetName(e.target.value)}
                placeholder="如：大清工业化"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">描述</label>
              <input
                type="text"
                value={newPlaysetDesc}
                onChange={(e) => setNewPlaysetDesc(e.target.value)}
                placeholder="简要描述这个 Mod 组合..."
                className="w-full"
              />
            </div>
            <div className="text-xs text-white/30">
              已选择 {selectedMods.size} 个 Mod
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPlaysetDialog(false)}
                className="btn-secondary text-sm"
              >
                取消
              </button>
              <button onClick={handleCreatePlayset} className="btn-primary text-sm">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ModGridCard({
  mod,
  onToggle,
  selected,
  onSelect,
}: {
  mod: ModInfo;
  onToggle: (enabled: boolean) => void;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`card p-3 cursor-pointer transition-all ${
        selected ? "border-v3-gold/50 ring-1 ring-v3-gold/20" : ""
      }`}
      onClick={onSelect}
    >
      {/* 封面 */}
      <div className="w-full h-24 rounded-md bg-gradient-to-br from-v3-navy/40 to-surface flex items-center justify-center mb-2 overflow-hidden">
        {mod.thumbnail ? (
          <img src={mod.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-30">
            {mod.source === "Steam" ? "🔷" : mod.source === "Local" ? "📁" : "🐙"}
          </span>
        )}
      </div>

      {/* 信息 */}
      <p className="text-xs font-medium text-white/90 truncate" title={mod.display_name}>
        {mod.chinese_name || mod.display_name || mod.name}
      </p>
      <p className="text-[10px] text-white/30 truncate">{mod.version}</p>

      {/* 标签 */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {mod.conflict_count > 0 && (
          <span className="status-badge status-conflict text-[10px]">冲突</span>
        )}
        {mod.has_update && (
          <span className="status-badge status-update text-[10px]">更新</span>
        )}
        {mod.enabled && (
          <span className="status-badge status-enabled text-[10px]">启用</span>
        )}
      </div>

      {/* 操作 */}
      <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] text-white/20">{formatSize(mod.size)}</span>
        <button
          onClick={() => onToggle(!mod.enabled)}
          className={`switch ${mod.enabled ? "active" : ""}`}
        >
          <span className="switch-knob" />
        </button>
      </div>
    </div>
  );
}

function ModListItem({
  mod,
  onToggle,
  selected,
  onSelect,
}: {
  mod: ModInfo;
  onToggle: (enabled: boolean) => void;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`card px-4 py-2.5 flex items-center gap-3 cursor-pointer ${
        selected ? "border-v3-gold/50" : ""
      }`}
      onClick={onSelect}
    >
      <span className="text-xs text-white/20 w-8">{mod.load_order || "-"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">
          {mod.chinese_name || mod.display_name || mod.name}
        </p>
        <p className="text-xs text-white/20">{mod.version} · {mod.source} · {formatSize(mod.size)}</p>
      </div>
      <div className="flex items-center gap-2">
        {mod.conflict_count > 0 && (
          <span className="status-badge status-conflict">{mod.conflict_count}</span>
        )}
        {mod.has_update && <span className="status-badge status-update">更新</span>}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(!mod.enabled);
          }}
          className={`switch ${mod.enabled ? "active" : ""}`}
        >
          <span className="switch-knob" />
        </button>
      </div>
    </div>
  );
}

function ModGraphItem({ mod }: { mod: ModInfo }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="w-3 h-3 rounded-full bg-v3-gold" />
      <div>
        <p className="text-sm text-white/80">{mod.name}</p>
        <p className="text-xs text-white/20">
          {mod.dependencies.length > 0
            ? `依赖: ${mod.dependencies.join(", ")}`
            : "无依赖"}
        </p>
      </div>
      {mod.conflict_count > 0 && (
        <span className="status-badge status-conflict ml-auto">
          {mod.conflict_count} 冲突
        </span>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}
