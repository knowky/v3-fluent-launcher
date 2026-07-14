import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import { useNavigate } from "react-router-dom";

export default function SetupWizard() {
  const { detectGame, gameInfo, isScanning } = useAppStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [detecting, setDetecting] = useState(false);

  const handleDetect = async () => {
    setDetecting(true);
    await detectGame();
    setDetecting(false);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* 进度条 */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? "bg-v3-gold" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card p-8"
          >
            {step === 1 && (
              <div className="space-y-6 text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-2xl font-display font-light text-white/90">
                  欢迎使用 Victoria 3 Fluent Launcher
                </h2>
                <p className="text-sm text-white/50">
                  现代化 Victoria 3 启动器，集成 Mod 管理、存档管理和场景化启动
                </p>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  {[
                    { icon: "📦", label: "Mod 管理", desc: "可视化冲突解决" },
                    { icon: "💾", label: "存档中心", desc: "时间线 + 健康检测" },
                    { icon: "🚀", label: "场景启动", desc: "一键切换配置" },
                  ].map((item) => (
                    <div key={item.label} className="card p-3 text-center bg-surface/50">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <p className="text-xs text-white/80">{item.label}</p>
                      <p className="text-[10px] text-white/30">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white/90">检测游戏安装</h3>
                <p className="text-sm text-white/50">
                  自动搜索 Steam 和本地安装的 Victoria 3
                </p>

                <button
                  onClick={handleDetect}
                  disabled={detecting}
                  className="btn-primary w-full py-3 text-base disabled:opacity-50"
                >
                  {detecting ? "⏳ 正在搜索..." : "🔍 自动检测"}
                </button>

                {gameInfo && (
                  <div className="card bg-surface/50 p-4 text-left space-y-2">
                    <p className="text-sm text-white/80">
                      {gameInfo.installed ? "✅ 检测到游戏安装" : "⚠️ 未检测到游戏"}
                    </p>
                    {gameInfo.paths && (
                      <>
                        <div className="text-xs text-white/30">
                          游戏路径: {gameInfo.paths.game_path}
                        </div>
                        <div className="text-xs text-white/30">
                          Mod 目录: {gameInfo.paths.workshop_path}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <p className="text-xs text-white/20">
                  也可以手动设置路径（在设置页面）
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-white/90">扫描 Mod</h3>
                <p className="text-sm text-white/50">
                  扫描 Steam Workshop 和本地 Mod 目录
                </p>

                <button
                  onClick={async () => {
                    await useAppStore.getState().scanMods();
                    await useAppStore.getState().scanSaves();
                  }}
                  className="btn-primary w-full py-3 text-base"
                >
                  📦 开始扫描
                </button>

                <p className="text-xs text-white/20">
                  之后也可以随时在 Mod 工作室中重新扫描
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-white/90">设置完成！</h3>
                <p className="text-sm text-white/50">
                  Victoria 3 Fluent Launcher 已准备就绪
                </p>

                <div className="card bg-surface/50 p-4 text-left space-y-2">
                  <p className="text-xs text-white/40">快速提示：</p>
                  <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                    <li>在「Mod 工作室」中管理 Mod 加载顺序</li>
                    <li>在「存档中心」中查看存档时间线和健康状态</li>
                    <li>创建「场景」将存档、Mod 和配置绑定在一起</li>
                    <li>使用「冲突中心」自动检测和解决 Mod 冲突</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 mt-6 border-t border-white/5">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                ← 上一步
              </button>
              <div className="text-xs text-white/20 self-center">
                {step} / 4
              </div>
              <button onClick={handleNext} className="btn-primary text-sm">
                {step === 4 ? "🎮 开始使用" : "下一步 →"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
