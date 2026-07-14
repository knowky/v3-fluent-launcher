import { useAppStore } from "../stores/appStore";

export default function TitleBar() {
  const { gameInfo } = useAppStore();

  return (
    <header className="mica-bg border-b border-white/5 h-12 flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-v3-navy to-v3-gold flex items-center justify-center">
            <span className="text-white text-xs font-bold">V3</span>
          </div>
          <h1 className="text-sm font-semibold text-white/90">
            Victoria 3 Fluent Launcher
          </h1>
        </div>
        {gameInfo?.installed && (
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            v{gameInfo.version}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-all">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-all relative">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C6 2 4.5 3.5 4.5 5.5V7C3.5 7 3 7.5 3 8.5V12C3 13 3.5 13.5 4.5 13.5H11.5C12.5 13.5 13 13 13 12V8.5C13 7.5 12.5 7 11.5 7V5.5C11.5 3.5 10 2 8 2Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full" />
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-all">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3h8M3 7h8M3 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
