import { useAppStore } from "../stores/appStore";

export default function TitleBar() {
  const { gameInfo, mods, saves } = useAppStore();

  const conflictCount = mods.filter((m) => m.conflict_count > 0).length;

  return (
    <header className="mica-bg border-b border-white/5 h-12 flex items-center justify-between px-4 select-none relative z-10">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aurora-green via-aurora-cyan to-aurora-blue flex items-center justify-center shadow-aurora-sm">
            <span className="text-base-900 text-[10px] font-bold">V3</span>
          </div>
          <h1 className="text-sm font-semibold text-white/85">
            <span className="aurora-glow-text">Victoria 3</span>
            <span className="text-white/25 font-light mx-1.5">|</span>
            <span className="font-light">Fluent Launcher</span>
          </h1>
        </div>

        {/* Game Status */}
        {gameInfo?.installed && (
          <span className="text-xs text-aurora-green/60 bg-aurora-green/5 px-2 py-0.5 rounded-full border border-aurora-green/10">
            v{gameInfo.version}
          </span>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5">
        {/* Stats */}
        {gameInfo?.installed && (
          <div className="flex items-center gap-3 mr-3 text-[10px] text-white/20">
            <span>{mods.length} Mod</span>
            <span>{saves.length} 存档</span>
            {conflictCount > 0 && <span className="text-error/60">⚠ {conflictCount}</span>}
          </div>
        )}

        {/* Search */}
        <button className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all" title="搜索">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Notifications */}
        <button className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all relative" title="通知">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {conflictCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full" />}
        </button>

        <div className="w-px h-5 bg-white/8 mx-1" />

        {/* More */}
        <button className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all" title="更多">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
