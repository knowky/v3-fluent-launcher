import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import { useSettingsStore } from "../stores/settingsStore";

export default function Settings() {
  const { gameInfo } = useAppStore();
  const {
    theme, setTheme,
    language, setLanguage,
    sidebarCollapsed, setSidebarCollapsed,
    autoUpdate, setAutoUpdate,
    autoScan, setAutoScan,
    minimizeToTray, setMinimizeToTray,
    closeOnGameExit, setCloseOnGameExit,
    cloudSync, setCloudSync,
    cloudService, setCloudService,
    cloudSyncInterval, setCloudSyncInterval,
    loaded,
  } = useSettingsStore();

  // 首次加载时从数据库读取设置
  useEffect(() => {
    useSettingsStore.getState().loadSettings();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-display font-light text-white/90">设置</h2>
        <p className="text-xs text-white/30 mt-0.5">自定义启动器行为</p>
      </div>

      {/* Appearance */}
      <SettingsSection title="外观" icon="🎨">
        <SettingsRow label="主题">
          <select value={theme} onChange={(e) => setTheme(e.target.value)} disabled={!loaded}>
            <option value="aurora">极光 (Aurora)</option>
            <option value="dark">深色模式</option>
            <option value="light">浅色模式</option>
            <option value="system">跟随系统</option>
          </select>
        </SettingsRow>
        <SettingsRow label="语言">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={!loaded}>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </SettingsRow>
        <SettingsRow label="侧边栏默认状态">
          <select value={sidebarCollapsed ? "collapsed" : "expanded"} onChange={(e) => setSidebarCollapsed(e.target.value === "collapsed")} disabled={!loaded}>
            <option value="expanded">展开</option>
            <option value="collapsed">折叠</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      {/* General */}
      <SettingsSection title="通用" icon="⚙️">
        <SettingsRow label="自动检查更新">
          <button onClick={() => setAutoUpdate(!autoUpdate)} className={`switch ${autoUpdate ? "active" : ""}`}><span className="switch-knob" /></button>
        </SettingsRow>
        <SettingsRow label="启动时自动扫描 Mod">
          <button onClick={() => setAutoScan(!autoScan)} className={`switch ${autoScan ? "active" : ""}`}><span className="switch-knob" /></button>
        </SettingsRow>
        <SettingsRow label="最小化到系统托盘">
          <button onClick={() => setMinimizeToTray(!minimizeToTray)} className={`switch ${minimizeToTray ? "active" : ""}`}><span className="switch-knob" /></button>
        </SettingsRow>
        <SettingsRow label="游戏退出后关闭启动器">
          <button onClick={() => setCloseOnGameExit(!closeOnGameExit)} className={`switch ${closeOnGameExit ? "active" : ""}`}><span className="switch-knob" /></button>
        </SettingsRow>
      </SettingsSection>

      {/* Cloud Sync */}
      <SettingsSection title="云同步" icon="☁️">
        <SettingsRow label="启用云同步">
          <button onClick={() => setCloudSync(!cloudSync)} className={`switch ${cloudSync ? "active" : ""}`}><span className="switch-knob" /></button>
        </SettingsRow>
        {cloudSync && (
          <>
            <SettingsRow label="云服务">
              <select value={cloudService} onChange={(e) => setCloudService(e.target.value)}>
                <option value="webdav">WebDAV</option>
                <option value="onedrive">OneDrive</option>
                <option value="googledrive">Google Drive</option>
              </select>
            </SettingsRow>
            <SettingsRow label="自动同步间隔">
              <select value={String(cloudSyncInterval)} onChange={(e) => setCloudSyncInterval(Number(e.target.value))}>
                <option value="900">15 分钟</option>
                <option value="1800">30 分钟</option>
                <option value="3600">1 小时</option>
                <option value="7200">2 小时</option>
              </select>
            </SettingsRow>
          </>
        )}
      </SettingsSection>

      {/* Game Paths */}
      <SettingsSection title="游戏路径" icon="📁">
        <SettingsRow label="Steam 安装目录">
          <input type="text" readOnly value={gameInfo?.installed ? "已自动检测" : "未检测到"} className="text-white/35 text-xs w-48" />
        </SettingsRow>
        <SettingsRow label="用户数据目录">
          <input type="text" readOnly value={gameInfo?.installed ? "已自动检测" : "未检测到"} className="text-white/35 text-xs w-48" />
        </SettingsRow>
        <SettingsRow label="Mod 目录">
          <input type="text" readOnly value={gameInfo?.installed ? "已自动检测" : "未检测到"} className="text-white/35 text-xs w-48" />
        </SettingsRow>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection title="数据管理" icon="💾">
        <SettingsRow label="清理数据库缓存">
          <button className="btn-secondary text-xs" onClick={async () => { try { await import("@tauri-apps/api/core").then(m => m.invoke("clean_database_cache")); } catch {} }}>清理</button>
        </SettingsRow>
        <SettingsRow label="导出所有配置">
          <button className="btn-secondary text-xs" onClick={async () => { try { await import("@tauri-apps/api/core").then(m => m.invoke("export_all_config")); } catch {} }}>导出</button>
        </SettingsRow>
        <SettingsRow label="导入配置">
          <button className="btn-secondary text-xs" onClick={async () => { try { await import("@tauri-apps/api/core").then(m => m.invoke("import_config")); } catch {} }}>导入</button>
        </SettingsRow>
        <SettingsRow label="重置数据库">
          <button className="btn-danger text-xs" onClick={async () => { if (confirm("确定重置数据库？所有数据将丢失！")) { try { await import("@tauri-apps/api/core").then(m => m.invoke("reset_database")); } catch {} } }}>重置</button>
        </SettingsRow>
        <SettingsRow label="清理所有日志">
          <button className="btn-secondary text-xs" onClick={async () => { try { await import("@tauri-apps/api/core").then(m => m.invoke("clean_logs")); } catch {} }}>清理</button>
        </SettingsRow>
      </SettingsSection>

      {/* About */}
      <SettingsSection title="关于" icon="ℹ️">
        <SettingsRow label="版本" value="1.0.2" />
        <SettingsRow label="Tauri" value="2.0" />
        <SettingsRow label="前端" value="React 18 + Tailwind CSS" />
        <SettingsRow label="后端" value="Rust + SQLite" />
        <SettingsRow label="主题" value="Aurora (极光)" />
        <SettingsRow label="许可证" value="MIT Open Source" />
        <SettingsRow label="GitHub">
          <a href="https://github.com/knowky/v3-fluent-launcher" target="_blank" className="text-aurora-green text-xs hover:underline">knowky/v3-fluent-launcher</a>
        </SettingsRow>
      </SettingsSection>
    </motion.div>
  );
}

function SettingsSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 space-y-0">
      <h3 className="text-sm font-semibold text-white/70 mb-3 pb-2 border-b border-white/5 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

function SettingsRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/45">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-white/25">{value}</span>}
        {children}
      </div>
    </div>
  );
}
