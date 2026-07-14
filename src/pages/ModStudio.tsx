import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import type { ModInfo, Playset } from "../types";

type ViewMode = "grid" | "list" | "detail";
type SortKey = "name" | "load_order" | "size" | "last_updated";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

export default function ModStudio() {
  const {
    mods, playsets, scanMods, toggleMod, createPlayset, deletePlayset,
    isScanning, loadPlaysets,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("load_order");
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [showPlaysetDialog, setShowPlaysetDialog] = useState(false);
  const [newPlaysetName, setNewPlaysetName] = useState("");
  const [newPlaysetDesc, setNewPlaysetDesc] = useState("");
  const [activePlayset, setActivePlayset] = useState<string | null>(null);

  useEffect(() => {
    scanMods();
    loadPlaysets();
  }, []);

  const filteredMods = useMemo(() => {
    return mods
      .filter((m) => {
        const q = search.toLowerCase();
        const matchSearch = !q || m.name.toLowerCase().includes(q) || m.display_name.toLowerCase().includes(q) || (m.chinese_name && m.chinese_name.toLowerCase().includes(q)) || m.tags.some((t) => t.toLowerCase().includes(q));
        const matchSource = filterSource === "all" || m.source === filterSource;
        const matchStatus = filterStatus === "all" || (filterStatus === "enabled" && m.enabled) || (filterStatus === "disabled" && !m.enabled) || (filterStatus === "conflict" && m.conflict_count > 0) || (filterStatus === "update" && m.has_update);
        return matchSearch && matchSource && matchStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name": return a.name.localeCompare(b.name);
          case "size": return b.size - a.size;
          case "last_updated": return b.last_updated.localeCompare(a.last_updated);
          default: return a.load_order - b.load_order;
        }
      });
  }, [mods, search, filterSource, filterStatus, sortBy]);

  const handleCreatePlayset = async () => {
    if (!newPlaysetName.trim()) return;
    await createPlayset(newPlaysetName, newPlaysetDesc, Array.from(selectedMods));
    setNewPlaysetName(""); setNewPlaysetDesc(""); setSelectedMods(new Set()); setShowPlaysetDialog(false);
  };

  const toggleSelectAll = useCallback(() => {
    if (selectedMods.size === filteredMods.length) {
      setSelectedMods(new Set());
    } else {
      setSelectedMods(new Set(filteredMods.map((m) => m.id)));
    }
  }, [selectedMods, filteredMods]);

  const enabledCount = mods.filter((m) => m.enabled).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-light text-white/90">Mod 工作室</h2>
          <p className="text-xs text-white/30 mt-0.5">{mods.length} Mod · {enabledCount} 已启用</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex bg-base-700 rounded-lg p-0.5">
            {(["grid", "list", "detail"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`tab text-xs ${viewMode === mode ? "active" : ""}`}>
                {mode === "grid" ? "▦ 网格" : mode === "list" ? "≡ 列表" : "☰ 详情"}
              </button>
            ))}
          </div>
          <button onClick={scanMods} disabled={isScanning} className="btn-secondary text-xs">
            {isScanning ? "扫描中..." : "🔄 重新扫描"}
          </button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <input type="search" placeholder="搜索 Mod..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9" />
          <svg className="absolute left-3 top-2.5 text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="text-xs">
          <option value="all">全部来源</option><option value="Steam">Steam 创意工坊</option><option value="Local">本地 Mod</option><option value="GitHub">GitHub</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs">
          <option value="all">全部状态</option><option value="enabled">已启用</option><option value="disabled">已禁用</option><option value="conflict">有冲突</option><option value="update">有更新</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="text-xs">
          <option value="load_order">加载顺序</option><option value="name">名称</option><option value="size">大小</option><option value="last_updated">更新时间</option>
        </select>
        {selectedMods.size > 0 && (
          <>
            <button onClick={() => setShowPlaysetDialog(true)} className="btn-primary text-xs">创建 Playset ({selectedMods.size})</button>
            <button onClick={() => setSelectedMods(new Set())} className="btn-ghost text-xs">取消选择</button>
          </>
        )}
        {filteredMods.length > 0 && (
          <button onClick={toggleSelectAll} className="btn-ghost text-xs">
            {selectedMods.size === filteredMods.length ? "取消全选" : "全选"}
          </button>
        )}
      </motion.div>

      {/* Playsets */}
      {playsets.length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActivePlayset(null)}
            className={`card px-3 py-1.5 text-xs flex-shrink-0 transition-all ${!activePlayset ? "border-aurora-green/40 bg-aurora-green/5" : ""}`}>
            全部 Mod
          </button>
          {playsets.map((ps) => (
            <div key={ps.id} className="flex items-center gap-2 card px-3 py-1.5 text-xs flex-shrink-0 group">
              <button onClick={() => setActivePlayset(ps.id)} className={`${activePlayset === ps.id ? "text-aurora-green" : "text-white/70"}`}>
                {ps.name}
              </button>
              <span className="text-white/20">({ps.mod_order.length})</span>
              <button onClick={() => deletePlayset(ps.id)} className="text-white/20 hover:text-error transition-colors opacity-0 group-hover:opacity-100">✕</button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Mod Grid/List */}
      <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3" : "space-y-1"}>
        {filteredMods.map((mod, i) => (
          <motion.div key={mod.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { delay: i * 0.02 } } }}>
            {viewMode === "grid" ? (
              <ModGridCard mod={mod} onToggle={(e) => toggleMod(mod.id, e)} selected={selectedMods.has(mod.id)}
                onSelect={() => { const n = new Set(selectedMods); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); setSelectedMods(n); }} />
            ) : viewMode === "list" ? (
              <ModListItem mod={mod} onToggle={(e) => toggleMod(mod.id, e)} selected={selectedMods.has(mod.id)}
                onSelect={() => { const n = new Set(selectedMods); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); setSelectedMods(n); }} />
            ) : (
              <ModDetailItem mod={mod} onToggle={(e) => toggleMod(mod.id, e)} selected={selectedMods.has(mod.id)}
                onSelect={() => { const n = new Set(selectedMods); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); setSelectedMods(n); }} />
            )}
          </motion.div>
        ))}
      </div>

      {filteredMods.length === 0 && !isScanning && (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4 opacity-30">📦</div>
          <p className="text-white/25">{mods.length === 0 ? "请先扫描 Mod 目录" : "没有匹配的 Mod"}</p>
          {mods.length === 0 && <button onClick={scanMods} className="btn-primary text-sm mt-4">开始扫描</button>}
        </div>
      )}

      {/* Playset Dialog */}
      {showPlaysetDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPlaysetDialog(false)}>
          <div className="glass-strong p-6 w-96 space-y-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white/90">创建 Playset</h3>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">名称</label>
              <input type="text" value={newPlaysetName} onChange={(e) => setNewPlaysetName(e.target.value)} placeholder="如：大清工业化" className="w-full" autoFocus />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">描述</label>
              <input type="text" value={newPlaysetDesc} onChange={(e) => setNewPlaysetDesc(e.target.value)} placeholder="简要描述这个 Mod 组合..." className="w-full" />
            </div>
            <div className="text-xs text-white/30 bg-base-700/50 p-2 rounded-md">已选择 {selectedMods.size} 个 Mod</div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowPlaysetDialog(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={handleCreatePlayset} className="btn-primary text-sm">创建</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ModGridCard({ mod, onToggle, selected, onSelect }: { mod: ModInfo; onToggle: (e: boolean) => void; selected: boolean; onSelect: () => void; }) {
  return (
    <div className={`card p-3 cursor-pointer transition-all group ${selected ? "border-aurora-green/50 bg-aurora-green/5" : ""}`} onClick={onSelect}>
      <div className="w-full h-24 rounded-lg bg-gradient-to-br from-base-700 to-base-600 flex items-center justify-center mb-2.5 overflow-hidden relative">
        {mod.thumbnail ? <img src={mod.thumbnail} alt="" className="w-full h-full object-cover" /> : (
          <span className="text-2xl opacity-25">{mod.source === "Steam" ? "🔷" : mod.source === "Local" ? "📁" : "🐙"}</span>
        )}
        {selected && <div className="absolute inset-0 bg-aurora-green/10 flex items-center justify-center"><span className="text-white text-lg">✓</span></div>}
      </div>
      <p className="text-xs font-medium text-white/85 truncate" title={mod.display_name}>{mod.chinese_name || mod.display_name || mod.name}</p>
      <p className="text-[10px] text-white/25 truncate">{mod.version}</p>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {mod.conflict_count > 0 && <span className="status-badge status-conflict text-[10px]">冲突</span>}
        {mod.has_update && <span className="status-badge status-update text-[10px]">更新</span>}
        {mod.enabled && <span className="status-badge status-enabled text-[10px]">启用</span>}
      </div>
      <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] text-white/20">{formatSize(mod.size)}</span>
        <button onClick={() => onToggle(!mod.enabled)} className={`switch ${mod.enabled ? "active" : ""}`}><span className="switch-knob" /></button>
      </div>
    </div>
  );
}

function ModListItem({ mod, onToggle, selected, onSelect }: { mod: ModInfo; onToggle: (e: boolean) => void; selected: boolean; onSelect: () => void; }) {
  return (
    <div className={`card px-4 py-3 flex items-center gap-3 cursor-pointer transition-all ${selected ? "border-aurora-green/50 bg-aurora-green/5" : ""}`} onClick={onSelect}>
      <span className="text-xs text-white/20 w-8 font-mono">{mod.load_order || "—"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">{mod.chinese_name || mod.display_name || mod.name}</p>
        <p className="text-xs text-white/20">{mod.version} · {mod.source} · {formatSize(mod.size)}</p>
      </div>
      <div className="flex items-center gap-2">
        {mod.conflict_count > 0 && <span className="status-badge status-conflict">{mod.conflict_count}</span>}
        {mod.has_update && <span className="status-badge status-update">更新</span>}
        <button onClick={(e) => { e.stopPropagation(); onToggle(!mod.enabled); }} className={`switch ${mod.enabled ? "active" : ""}`}><span className="switch-knob" /></button>
      </div>
    </div>
  );
}

function ModDetailItem({ mod, onToggle, selected, onSelect }: { mod: ModInfo; onToggle: (e: boolean) => void; selected: boolean; onSelect: () => void; }) {
  return (
    <div className={`card p-4 space-y-2 cursor-pointer ${selected ? "border-aurora-green/50 bg-aurora-green/5" : ""}`} onClick={onSelect}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-base-700 to-base-600 flex items-center justify-center">
            <span className="text-lg opacity-30">{mod.source === "Steam" ? "🔷" : "📁"}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white/85">{mod.chinese_name || mod.display_name || mod.name}</p>
            <p className="text-xs text-white/25">{mod.version} · {mod.source} · {mod.game_version}</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggle(!mod.enabled); }} className={`switch ${mod.enabled ? "active" : ""}`}><span className="switch-knob" /></button>
      </div>
      {mod.description && <p className="text-xs text-white/35 line-clamp-2">{mod.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        {mod.tags.slice(0, 5).map((t) => <span key={t} className="text-[10px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded">{t}</span>)}
        {mod.conflict_count > 0 && <span className="status-badge status-conflict text-[10px]">冲突 x{mod.conflict_count}</span>}
        {mod.has_update && <span className="status-badge status-update text-[10px]">有更新</span>}
        <span className="text-[10px] text-white/20 ml-auto">{formatSize(mod.size)}</span>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0B";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${(bytes / 1073741824).toFixed(1)}GB`;
}
