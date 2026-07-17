import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useActivity, type ActivityItem, type ActivityIcon, type ActivityStage } from '../contexts/ActivityContext';
import {
  Sparkles,
  X,
  ChevronUp,
  Trophy,
  Zap,
  Target,
  Rocket,
  Loader2,
  Minus,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const stageMeta: Record<
  ActivityIcon,
  { label: string; color: string; gradient: string; progress: number }
> = {
  thinking: {
    label: 'Thinking',
    color: '#7C3AED',
    gradient: 'from-[#7C3AED]/25 to-[#3B82F6]/10',
    progress: 20,
  },
  search: {
    label: 'Researching',
    color: '#3B82F6',
    gradient: 'from-[#3B82F6]/25 to-[#06B6D4]/10',
    progress: 40,
  },
  analyze: {
    label: 'Analyzing',
    color: '#06B6D4',
    gradient: 'from-[#06B6D4]/25 to-[#8B5CF6]/10',
    progress: 60,
  },
  sparkle: {
    label: 'Crafting',
    color: '#EC4899',
    gradient: 'from-[#EC4899]/25 to-[#7C3AED]/10',
    progress: 80,
  },
  image: {
    label: 'Drawing',
    color: '#F59E0B',
    gradient: 'from-[#F59E0B]/25 to-[#7C3AED]/10',
    progress: 90,
  },
  success: {
    label: 'Done',
    color: '#22C55E',
    gradient: 'from-[#22C55E]/25 to-[#7C3AED]/10',
    progress: 100,
  },
  error: {
    label: 'Oops',
    color: '#EF4444',
    gradient: 'from-[#EF4444]/25 to-[#7C3AED]/10',
    progress: 100,
  },
};

const funMessages: Record<ActivityIcon, string[]> = {
  thinking: [
    'Sedang nyalain otak AI...',
    'Sedang panggil semua neuron cerdas...',
    'Sedang kumpulkan kecerdasan buat anda...',
    'Otak robot lagi loading...',
    'Sedang mikir keras nih...',
  ],
  search: [
    'Sedang jelajah internet...',
    'Sedang intip kompetitor...',
    'Sedang cari fakta menarik...',
    'Sedang googling yang penting...',
    'Sedang scan berita & tren...',
  ],
  analyze: [
    'Sedang baca pola bisnis anda...',
    'Sedang ngeramal peluang...',
    'Sedang analisa data...',
    'Sedang connect the dots...',
    'Sedang cari bottleneck tersembunyi...',
  ],
  sparkle: [
    'Sedang racik jawaban keren...',
    'Sedang tulis strategi jitu...',
    'Sedang susun solusi WOW...',
    'Sedang masak resep sukses...',
    'Sedang polish ide jadi emas...',
  ],
  image: [
    'Sedang gambar visual lucu...',
    'Sedang buat ilustrasi...',
    'Sedang warnai ide...',
    'Sedang design gambar...',
    'Sedang jepret visual...',
  ],
  success: [
    'Selesai! Keren kan? 🎉',
    'Jadi! Siap bantu lagi? 🚀',
    'Selesai! Yuk lanjut! 🏆',
    'Mantap, respons sudah siap! ✨',
    'Done! Semoga membantu! 🎊',
  ],
  error: [
    'Ups, ada error. Coba lagi ya? 😅',
    'Waduh, ada kendala teknis. Coba ulang! 🛠️',
    'Gagal nih, tapi jangan menyerah! 🚀',
    'Error detected. Coba lagi dalam detik! 🤖',
    'Hickup! Mari coba sekali lagi. 💪',
  ],
};

const funFacts = [
  'Fun fact: AI ini lebih suka kopi virtual. ☕',
  'Minion fact: 1 otak AI = 10.000 cup kopi.',
  'Tips: Bisnis yang bagus = sistem + orang + otomatisasi.',
  'Tahukah anda? 80% bottleneck bisnis ada di operasional.',
  'Minion kita ini jago strategi, tapi nggak bisa nyetir. 🚗',
  'Fun fact: Prompt yang spesifik = hasil yang jauh lebih bagus.',
  'Tips: Scale bisnis = kurangi owner dependency.',
  'Tahukah anda? AI agent bisa kerja 24/7 tanpa ngantuk.',
];

function useFunMessage(icon: ActivityIcon) {
  const [message, setMessage] = useState(() => {
    const list = funMessages[icon] || funMessages.thinking;
    return list[Math.floor(Math.random() * list.length)];
  });

  useEffect(() => {
    const list = funMessages[icon] || funMessages.thinking;
    setMessage(list[Math.floor(Math.random() * list.length)]);
  }, [icon]);

  return message;
}

const stageSpeed: Record<ActivityStage, number> = {
  idle: 1.2,
  thinking: 1.2,
  searching: 0.9,
  analyzing: 0.7,
  crafting: 0.5,
  success: 0.35,
  error: 0,
};

function MinionCharacter({
  icon,
  stage,
  isProcessing,
}: {
  icon: ActivityIcon;
  stage: ActivityStage;
  isProcessing: boolean;
}) {
  const isSuccess = icon === 'success';
  const isError = icon === 'error';
  const walkDuration = stageSpeed[stage] || 1;

  const mouthPath = isSuccess
    ? 'M35 70 Q50 80 65 70'
    : isError
    ? 'M40 72 Q50 65 60 72'
    : 'M40 72 Q50 78 60 72';

  const armLeftAnim = isProcessing
    ? { x2: [10, 5, 10], y2: [55, 45, 55] }
    : { x2: 10, y2: 60 };
  const armRightAnim = isProcessing
    ? { x2: [90, 95, 90], y2: [55, 45, 55] }
    : { x2: 90, y2: 60 };
  const legLeftAnim = isProcessing
    ? { x2: [38, 32, 38], y2: [92, 88, 92] }
    : { x2: 38, y2: 92 };
  const legRightAnim = isProcessing
    ? { x2: [62, 68, 62], y2: [88, 92, 88] }
    : { x2: 62, y2: 92 };

  const gloveLeftAnim = isProcessing
    ? { cx: [6, 3, 6], cy: [45, 42, 45] }
    : { cx: 10, cy: 60 };
  const gloveRightAnim = isProcessing
    ? { cx: [94, 97, 94], cy: [45, 42, 45] }
    : { cx: 90, cy: 60 };

  const shoeLeftAnim = isProcessing ? { cx: [32, 28, 32] } : { cx: 38 };
  const shoeRightAnim = isProcessing ? { cx: [68, 72, 68] } : { cx: 62 };

  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Glow ring */}
      <motion.div
        animate={{
          scale: isProcessing ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isProcessing ? [0.4, 0.6, 0.4] : [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#7C3AED]/40 to-[#3B82F6]/40 blur-xl"
      />

      {/* Walking / celebrating character */}
      <motion.div
        animate={
          isProcessing
            ? { y: [0, -8, 0, -4, 0], rotate: [0, -3, 0, 3, 0] }
            : isSuccess
            ? { y: [0, -12, 0], rotate: [0, -10, 0, 10, 0] }
            : { y: [0, -2, 0], rotate: 0 }
        }
        transition={{
          duration: isSuccess ? 0.4 : isError ? 0.6 : walkDuration,
          repeat: isError ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 w-24 h-24"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          {/* Body */}
          <rect x="25" y="20" width="50" height="55" rx="22" fill="#FCD34D" />
          {/* Overalls */}
          <path d="M25 60 L25 75 Q25 82 32 82 L68 82 Q75 82 75 75 L75 60 L65 60 L65 48 L35 48 L35 60 Z" fill="#3B82F6" />
          <rect x="35" y="48" width="30" height="22" fill="#3B82F6" />
          {/* Straps */}
          <path d="M35 48 L25 40" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
          <path d="M65 48 L75 40" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
          {/* Pocket */}
          <path d="M42 58 L58 58 L55 70 L45 70 Z" fill="#2563EB" />
          {/* Goggles */}
          <rect x="23" y="30" width="54" height="12" rx="6" fill="#4B5563" />
          <circle cx="38" cy="36" r="10" fill="#9CA3AF" />
          <circle cx="62" cy="36" r="10" fill="#9CA3AF" />
          {/* Eyes */}
          <motion.circle
            animate={isProcessing ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
            transition={{ duration: 0.2, repeat: isProcessing ? 3 : 0, delay: 0.5, repeatDelay: 1.5 }}
            cx="38"
            cy="36"
            r="6"
            fill="white"
          />
          <motion.circle
            animate={isProcessing ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
            transition={{ duration: 0.2, repeat: isProcessing ? 3 : 0, delay: 0.5, repeatDelay: 1.5 }}
            cx="62"
            cy="36"
            r="6"
            fill="white"
          />
          <circle cx="38" cy="36" r="3" fill="#1F2937" />
          <circle cx="62" cy="36" r="3" fill="#1F2937" />
          {/* Mouth */}
          <motion.path
            d={mouthPath}
            stroke="#1F2937"
            strokeWidth="3"
            strokeLinecap="round"
            fill="transparent"
          />
          {/* Arms */}
          <motion.line
            x1="25"
            y1="50"
            x2="10"
            y2="60"
            stroke="#FCD34D"
            strokeWidth="6"
            strokeLinecap="round"
            animate={armLeftAnim}
          />
          <motion.line
            x1="75"
            y1="50"
            x2="90"
            y2="60"
            stroke="#FCD34D"
            strokeWidth="6"
            strokeLinecap="round"
            animate={armRightAnim}
          />
          {/* Gloves */}
          <motion.circle
            cx="10"
            cy="60"
            r="5"
            fill="#1F2937"
            animate={gloveLeftAnim}
          />
          <motion.circle
            cx="90"
            cy="60"
            r="5"
            fill="#1F2937"
            animate={gloveRightAnim}
          />
          {/* Legs */}
          <motion.line
            x1="38"
            y1="80"
            x2="38"
            y2="92"
            stroke="#3B82F6"
            strokeWidth="6"
            strokeLinecap="round"
            animate={legLeftAnim}
          />
          <motion.line
            x1="62"
            y1="80"
            x2="62"
            y2="92"
            stroke="#3B82F6"
            strokeWidth="6"
            strokeLinecap="round"
            animate={legRightAnim}
          />
          {/* Shoes */}
          <motion.ellipse
            cx="38"
            cy="94"
            rx="8"
            ry="4"
            fill="#1F2937"
            animate={shoeLeftAnim}
          />
          <motion.ellipse
            cx="62"
            cy="94"
            rx="8"
            ry="4"
            fill="#1F2937"
            animate={shoeRightAnim}
          />
        </svg>
      </motion.div>

      {/* Shadow */}
      <motion.div
        animate={{
          scale: isProcessing ? [1, 0.75, 1, 0.9, 1] : [1, 0.95, 1],
          opacity: isProcessing ? [0.4, 0.2, 0.4, 0.3, 0.4] : [0.3, 0.25, 0.3],
        }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-3 bg-black/40 rounded-full"
      />
    </div>
  );
}

function WalkingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
          className="w-2 h-2 rounded-full bg-[#7C3AED]"
        />
      ))}
    </div>
  );
}

function ActivityLogItem({ log, isCurrent }: { log: ActivityItem; isCurrent: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-2 px-2 rounded-lg ${isCurrent ? 'bg-[rgba(124,58,237,0.08)]' : ''}`}>
      <div className="flex-shrink-0 mt-0.5 text-lg leading-none">
        {log.status === 'done' ? '✅' : isCurrent ? '⏳' : '•'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-relaxed ${isCurrent ? 'text-[#F8FAFC] font-medium' : 'text-[#94A3B8]'}`}>
          {log.displayedMessage || log.message}
          {log.status === 'typing' && isCurrent && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#7C3AED] animate-pulse align-middle rounded-sm" />
          )}
        </p>
      </div>
    </div>
  );
}

const stageToIcon: Record<ActivityStage, ActivityIcon> = {
  idle: 'thinking',
  thinking: 'thinking',
  searching: 'search',
  analyzing: 'analyze',
  crafting: 'sparkle',
  success: 'success',
  error: 'error',
};

function ProgressBar({ stage, isProcessing }: { stage: ActivityStage; isProcessing: boolean }) {
  const meta = stageMeta[stageToIcon[stage]] || stageMeta.thinking;
  const progress = {
    idle: 5,
    thinking: 15,
    searching: 35,
    analyzing: 55,
    crafting: 80,
    success: 100,
    error: 100,
  }[stage];

  return (
    <div className="w-full mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-[#F8FAFC] flex items-center gap-1">
          {stage === 'success' && <Trophy className="w-3 h-3 text-[#22C55E]" />}
          {stage === 'error' && <Zap className="w-3 h-3 text-[#EF4444]" />}
          {stage === 'thinking' && <Target className="w-3 h-3 text-[#7C3AED]" />}
          {stage === 'searching' && <Rocket className="w-3 h-3 text-[#3B82F6]" />}
          {stage === 'analyzing' && <Zap className="w-3 h-3 text-[#06B6D4]" />}
          {stage === 'crafting' && <Sparkles className="w-3 h-3 text-[#EC4899]" />}
          {stage === 'idle' && <Target className="w-3 h-3 text-[#7C3AED]" />}
          {meta.label}
        </span>
        <span className="text-[11px] font-bold" style={{ color: meta.color }}>
          {progress}%
        </span>
      </div>
        <div className="h-2 w-full bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%`, opacity: isProcessing ? [0.8, 1, 0.8] : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ backgroundColor: meta.color }}
        />
      </div>
    </div>
  );
}

export default function ActivityPanel() {
  const { logs, isVisible, isProcessing, currentStage, clearLogs } = useActivity();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(true);
  const [funFactIndex] = useState(() => Math.floor(Math.random() * funFacts.length));

  const currentLog = logs[logs.length - 1];
  const currentIcon = currentLog?.icon || 'thinking';
  const meta = stageMeta[currentIcon] || stageMeta.thinking;
  const funMessage = useFunMessage(currentIcon);

  const currentLogId = currentLog?.id;
  const progress = {
    idle: 5,
    thinking: 15,
    searching: 35,
    analyzing: 55,
    crafting: 80,
    success: 100,
    error: 100,
  }[currentStage];

  // Reset collapse states when a new processing cycle starts.
  useEffect(() => {
    if (isProcessing) {
      setDesktopCollapsed(false);
      setMobileExpanded(true);
    }
  }, [isProcessing]);

  // Auto-hide the panel a few seconds after processing completes so the UI
  // returns to a clean state without blocking the chat area.
  useEffect(() => {
    if (!isProcessing && logs.length > 0) {
      const t = window.setTimeout(() => {
        clearLogs();
        setDesktopCollapsed(false);
        setMobileExpanded(false);
      }, 7000);
      return () => clearTimeout(t);
    }
  }, [isProcessing, logs.length, clearLogs]);

  // If processing ends and there are no logs, clean up state immediately.
  useEffect(() => {
    if (!isProcessing && logs.length === 0) {
      setDesktopCollapsed(false);
      setMobileExpanded(false);
    }
  }, [isProcessing, logs.length]);

  const openMobile = useCallback(() => {
    if (isProcessing || logs.length > 0) setMobileExpanded(true);
  }, [isProcessing, logs.length]);

  const closeMobile = useCallback(() => {
    setMobileExpanded(false);
  }, []);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 80 || info.velocity.y > 500) {
        closeMobile();
      }
    },
    [closeMobile]
  );

  // Keep the mobile mini bar visible while there are logs or processing is active.
  const showMobile = isVisible || logs.length > 0 || isProcessing;

  return (
    <>
      {/* Desktop Right Panel */}
      <AnimatePresence mode="popLayout">
        {!desktopCollapsed && (
          <motion.aside
            key="desktop-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hidden xl:flex fixed right-4 top-20 bottom-24 w-[300px] flex-col z-40 pointer-events-auto"
          >
            <div
              className={`bg-gradient-to-br ${meta.gradient} backdrop-blur-[16px] border border-[rgba(124,58,237,0.25)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden h-full bg-[#0F1423]/90`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(124,58,237,0.15)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  <h3 className="text-[13px] font-semibold text-[#F8FAFC]">
                    Pesat AI lagi kerja...
                  </h3>
                </div>
                <button
                  onClick={() => setDesktopCollapsed(true)}
                  className="p-1 rounded-md text-[#64748B] hover:text-[#CBD5E1] hover:bg-[rgba(124,58,237,0.1)] transition-colors"
                  aria-label="Collapse activity panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 scrollbar-chat">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <MinionCharacter icon={currentIcon} stage={currentStage} isProcessing={isProcessing} />
                  {isProcessing && <WalkingDots />}
                  <p className="text-[14px] font-bold text-[#F8FAFC] text-center leading-tight px-2">
                    {funMessage}
                  </p>
                  {currentStage === 'success' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-[#22C55E] to-[#3B82F6] text-white text-[11px] font-bold shadow-lg"
                    >
                      🏆 Quest Complete!
                    </motion.div>
                  )}
                </div>

                <ProgressBar stage={currentStage} isProcessing={isProcessing} />

                <div className="flex flex-col mt-3">
                  {logs.map((log) => (
                    <ActivityLogItem
                      key={log.id}
                      log={log}
                      isCurrent={log.id === currentLogId}
                    />
                  ))}
                </div>

                {!isProcessing && logs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.15)]"
                  >
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                      {funFacts[funFactIndex]}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Collapsed Pill */}
      <AnimatePresence>
        {desktopCollapsed && (isProcessing || logs.length > 0) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={() => setDesktopCollapsed(false)}
            className="hidden xl:flex fixed right-4 top-20 items-center gap-2 px-3.5 py-2 bg-[#0F1423]/95 backdrop-blur-[16px] border border-[rgba(124,58,237,0.3)] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.4)] z-40 pointer-events-auto"
          >
            <span className="text-lg">🤖</span>
            <span className="text-[12px] font-medium text-[#F8FAFC]">
              Lagi kerja...
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Kimi-style Activity Sheet */}
      <AnimatePresence>
        {showMobile && (
          <>
            {/* Expanded bottom sheet */}
            <motion.div
              key="mobile-sheet"
              initial={{ y: '100%' }}
              animate={{ y: mobileExpanded ? '0%' : '100%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="lg:hidden fixed left-0 right-0 bottom-0 z-[60] h-[70vh] pointer-events-auto"
            >
              <div className="h-full bg-[#0F1423] rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.35)] border-t border-[rgba(124,58,237,0.25)] flex flex-col overflow-hidden">
                {/* Drag handle */}
                <div className="flex flex-col items-center pt-3 pb-2 px-4 border-b border-[rgba(124,58,237,0.12)]">
                  <div className="w-12 h-1.5 rounded-full bg-[rgba(255,255,255,0.15)] mb-3" />
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                      <h3 className="text-[14px] font-semibold text-[#F8FAFC]">
                        Pesat AI lagi kerja...
                      </h3>
                    </div>
                    <button
                      onClick={closeMobile}
                      className="p-2 rounded-full text-[#64748B] hover:text-[#CBD5E1] hover:bg-[rgba(124,58,237,0.1)] transition-colors"
                      aria-label="Close activity panel"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sheet content */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-chat">
                  <div className="flex flex-col items-center gap-3 mb-4">
                    <MinionCharacter icon={currentIcon} stage={currentStage} isProcessing={isProcessing} />
                    {isProcessing && <WalkingDots />}
                    <p className="text-[16px] font-bold text-[#F8FAFC] text-center leading-tight px-6">
                      {funMessage}
                    </p>
                    {currentStage === 'success' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#22C55E] to-[#3B82F6] text-white text-[12px] font-bold shadow-lg"
                      >
                        🏆 Quest Complete!
                      </motion.div>
                    )}
                  </div>

                  <ProgressBar stage={currentStage} isProcessing={isProcessing} />

                  <div className="flex flex-col mt-4">
                    {logs.map((log) => (
                      <ActivityLogItem
                        key={log.id}
                        log={log}
                        isCurrent={log.id === currentLogId}
                      />
                    ))}
                  </div>

                  {!isProcessing && logs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 p-4 rounded-xl bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.15)]"
                    >
                      <p className="text-[12px] text-[#94A3B8] leading-relaxed">
                        {funFacts[funFactIndex]}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Backdrop for expanded sheet */}
            <AnimatePresence>
              {mobileExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden fixed inset-0 z-[55] bg-black/30 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Collapsed mini bar */}
            {!mobileExpanded && (
              <motion.button
                key="mobile-mini-bar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                onClick={openMobile}
                className="lg:hidden fixed left-1/2 -translate-x-1/2 bottom-[88px] z-[65] w-[92%] max-w-md flex items-center gap-3 px-4 py-3 bg-[#0F1423]/95 backdrop-blur-[16px] border border-[rgba(124,58,237,0.3)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] pointer-events-auto"
              >
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#3B82F6]/10">
                  {currentStage === 'success' ? (
                    <span className="text-lg">🎉</span>
                  ) : currentStage === 'error' ? (
                    <span className="text-lg">⚠️</span>
                  ) : (
                    <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-bold text-[#F8FAFC] leading-tight truncate">
                    {funMessage}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {meta.label} • {progress}%
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[rgba(124,58,237,0.15)] flex items-center justify-center">
                    <ChevronUp className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-10 h-1 rounded-full bg-[rgba(255,255,255,0.2)]" />
              </motion.button>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
