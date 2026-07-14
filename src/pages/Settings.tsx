import { useState } from "react";
import { motion } from "framer-motion";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("zh-CN");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [autoScan, setAutoScan] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-enter space-y-6 max-w-2xl"
    >
      <h2 className="text-xl font-display font-light text-white/90">设置</h2>

      {/* 外观 */}
      <SettingsSection title="外观">
        <SettingsRow label="主题">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">深色模式</option>
            <option value="light">浅色模式</option>
            <option value="system">跟随系统</option>
          </select>
        </SettingsRow>
        <SettingsRow label="语言">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      {/* 通用 */}
      <SettingsSection title="通用">
        <SettingsRow label="自动更新">
          <button
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`switch ${autoUpdate ? "active" : ""}`}
          >
            <span className="switch-knob" />
          </button>
        </SettingsRow>
        <SettingsRow label="启动时自动扫描 Mod">
          <button
            onClick={() => setAutoScan(!autoScan)}
            className={`switch ${autoScan ? "active" : ""}`}
          >
            <span className="switch-knob" />
          </button>
        </SettingsRow>
        <SettingsRow label="云同步">
          <button
            onClick={() => setCloudSync(!cloudSync)}
            className={`switch ${cloudSync ? "active" : ""}`}
          >
            <span className="switch-knob" />
          </button>
        </SettingsRow>
        {cloudSync && (
          <SettingsRow label="云服务">
            <select className="text-xs">
              <option value="webdav">WebDAV</option>
              <option value="onedrive">OneDrive</option>
              <option value="googledrive">Google Drive</option>
            </select>
          </SettingsRow>
        )}
      </SettingsSection>

      {/* 游戏路径 */}
      <SettingsSection title="游戏路径">
        <SettingsRow label="Steam 安装目录">
          <input
            type="text"
            readOnly
            value="自动检测"
            className="text-white/40"
          />
        </SettingsRow>
        <SettingsRow label="用户数据目录">
          <input
            type="text"
            readOnly
            value="自动检测"
            className="text-white/40"
          />
        </SettingsRow>
      </SettingsSection>

      {/* 数据管理 */}
      <SettingsSection title="数据管理">
        <SettingsRow label="清理缓存">
          <button className="btn-secondary text-xs">清理</button>
        </SettingsRow>
        <SettingsRow label="导出所有配置">
          <button className="btn-secondary text-xs">导出</button>
        </SettingsRow>
        <SettingsRow label="导入配置">
          <button className="btn-secondary text-xs">导入</button>
        </SettingsRow>
        <SettingsRow label="重置数据库">
          <button className="btn-danger text-xs">重置</button>
        </SettingsRow>
      </SettingsSection>

      {/* 关于 */}
      <SettingsSection title="关于">
        <SettingsRow label="版本" value="1.0.0" />
        <SettingsRow label="技术栈" value="Tauri 2.0 + React + Rust" />
        <SettingsRow label="许可证" value="MIT Open Source" />
      </SettingsSection>
    </motion.div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4 space-y-0">
      <h3 className="text-sm font-semibold text-white/80 mb-3 pb-2 border-b border-white/5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-white/30">{value}</span>}
        {children}
      </div>
    </div>
  );
}
