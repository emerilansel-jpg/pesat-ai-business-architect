import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useActivity, type ActivityItem, type ActivityIcon, type ActivityStage } from '../contexts/ActivityContext';
import {
  Sparkles,
  X,
  ChevronUp,
  Trophy,
  Loader2,
  Minus,
  Lightbulb,
  Search,
  BarChart3,
  Users,
  Paintbrush,
  Coffee,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const stageMeta: Record<
  ActivityIcon,
  { label: string; color: string; gradient: string; progress: number }
> = {
  thinking: {
    label: 'Mikir dulu...',
    color: '#7C3AED',
    gradient: 'from-[#7C3AED]/25 to-[#3B82F6]/10',
    progress: 15,
  },
  search: {
    label: 'Riset dulu...',
    color: '#3B82F6',
    gradient: 'from-[#3B82F6]/25 to-[#06B6D4]/10',
    progress: 30,
  },
  analyze: {
    label: 'Planning dulu...',
    color: '#06B6D4',
    gradient: 'from-[#06B6D4]/25 to-[#8B5CF6]/10',
    progress: 45,
  },
  sparkle: {
    label: 'Ajak tim ahli rapat...',
    color: '#EC4899',
    gradient: 'from-[#EC4899]/25 to-[#7C3AED]/10',
    progress: 60,
  },
  image: {
    label: 'Contacting Jaka Sembung (Design expert)...',
    color: '#F59E0B',
    gradient: 'from-[#F59E0B]/25 to-[#7C3AED]/10',
    progress: 80,
  },
  meeting: {
    label: 'Meeting dimulai...',
    color: '#8B5CF6',
    gradient: 'from-[#8B5CF6]/25 to-[#EC4899]/10',
    progress: 70,
  },
  coffee: {
    label: 'Ngopi dulu bentar...',
    color: '#A97142',
    gradient: 'from-[#A97142]/25 to-[#F59E0B]/10',
    progress: 75,
  },
  design: {
    label: 'Assign task ke Jaka Sembung...',
    color: '#EC4899',
    gradient: 'from-[#EC4899]/25 to-[#F59E0B]/10',
    progress: 85,
  },
  code: {
    label: 'Sri Asih & tim coding mulai gerak...',
    color: '#3B82F6',
    gradient: 'from-[#3B82F6]/25 to-[#06B6D4]/10',
    progress: 90,
  },
  deploy: {
    label: 'Tukang bubur depan juga dikasih task...',
    color: '#10B981',
    gradient: 'from-[#10B981]/25 to-[#3B82F6]/10',
    progress: 95,
  },
  success: {
    label: 'Done!',
    color: '#22C55E',
    gradient: 'from-[#22C55E]/25 to-[#3B82F6]/10',
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
    'Sedang mikir keras bareng tim...',
    'Nyalain otak AI dan ngopi dulu...',
    'Buka pikiran, siapin strategi...',
    ' brainstorming internal dulu...',
  ],
  search: [
    'Sedang jelajah internet & kompetitor...',
    'Riset market & tren terbaru...',
    'Intip data & review customer...',
    'Cari fakta menarik buat bisnis anda...',
  ],
  analyze: [
    'Sedang baca pola bisnis anda...',
    'Planning & connect the dots...',
    'Analisa bottleneck tersembunyi...',
    'Susun strategi jitu...',
  ],
  sparkle: [
    'Ajak tim ahli rapat virtual...',
    'Sedang diskusi seru sama expert...',
    'Racik solusi yang paling masuk akal...',
    'Polish ide jadi emas...',
  ],
  image: [
    'Contacting Jaka Sembung (Design expert)...',
    'Jaka Sembung lagi siapin sketch...',
    'Sedang gambar visual strategis...',
    'Design team lagi ngopi & ngerjain...',
  ],
  meeting: [
    'Meeting dimulai...',
    'Semua expert sudah on cam...',
    'Sedang presentasi hasil riset...',
  ],
  coffee: [
    'Ngopi dulu bentar...',
    'Istirahat sejenak sambil mikir...',
    'Kopi item pahit, ide manis...',
  ],
  design: [
    'Assign task ke Jaka Sembung...',
    'Jaka Sembung mulai design...',
    'Sri Asih siap bantu review...',
  ],
  code: [
    'Sri Asih & tim coding mulai gerak...',
    'Sedang bangun sistem & automasi...',
    'Coding sambil dengerin dangdut...',
  ],
  deploy: [
    'Tukang bubur depan juga dikasih task...',
    'Sedang deploy & final check...',
    'Semua tim fokus nyelesaiin...',
  ],
  success: [
    'Selesai! Keren kan? 🎉',
    'Jadi! Siap bantu lagi? 🚀',
    'Done! Semoga membantu! 🎊',
    'Mantap, respons sudah siap! ✨',
  ],
  error: [
    'Ups, ada error. Coba lagi ya? 😅',
    'Waduh, ada kendala teknis. Coba ulang! 🛠️',
    'Gagal nih, tapi jangan menyerah! 🚀',
    'Hickup! Mari coba sekali lagi. 💪',
  ],
};

const funFacts = [
  'Fun fact: Tim virtual kita kerja 24/7 tanpa ngantuk. ☕',
  'Robot fact: 1 otak AI = 10.000 cup kopi.',
  'Tips: Bisnis yang bagus = sistem + orang + otomatisasi.',
  'Tahukah anda? 80% bottleneck bisnis ada di operasional.',
  'Team kita ini jago strategi, tapi nggak bisa nyetir. 🚗',
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
  meeting: 0.6,
  image: 0.6,
  success: 0.35,
  error: 0,
};

const stageToIcon: Record<ActivityStage, ActivityIcon> = {
  idle: 'thinking',
  thinking: 'thinking',
  searching: 'search',
  analyzing: 'analyze',
  crafting: 'sparkle',
  meeting: 'meeting',
  image: 'image',
  success: 'success',
  error: 'error',
};

function CendekiaBot({
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

      {/* Robot character */}
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
          {/* Graduation cap + smart antenna */}
          <motion.path
            d="M22 22 L50 12 L78 22 L50 32 Z"
            fill="#0B0F1A"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinejoin="round"
            animate={isSuccess ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          <rect x="22" y="22" width="56" height="5" rx="2" fill="#0B0F1A" stroke="#7C3AED" strokeWidth="2.5" />
          <line x1="74" y1="22" x2="74" y2="30" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
          <motion.circle
            cx="74"
            cy="30"
            r="2.5"
            fill="#FCD34D"
            animate={isProcessing ? { opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          {/* Side antenna */}
          <line x1="83" y1="28" x2="83" y2="18" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <motion.circle
            cx="83"
            cy="18"
            r="3"
            fill="#3B82F6"
            animate={isProcessing ? { opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />

          {/* Head */}
          <rect x="25" y="28" width="50" height="40" rx="16" fill="#F8FAFC" />
          <rect x="25" y="28" width="50" height="40" rx="16" fill="url(#batik)" opacity="0.18" />

          {/* Eyes */}
          <motion.circle
            cx="38"
            cy="42"
            r="8"
            fill="#0B0F1A"
            animate={isProcessing ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
            transition={{ duration: 0.2, repeat: isProcessing ? 3 : 0, delay: 0.5, repeatDelay: 1.5 }}
          />
          <motion.circle
            cx="62"
            cy="42"
            r="8"
            fill="#0B0F1A"
            animate={isProcessing ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
            transition={{ duration: 0.2, repeat: isProcessing ? 3 : 0, delay: 0.5, repeatDelay: 1.5 }}
          />
          <circle cx="40" cy="40" r="2.5" fill="#F8FAFC" />
          <circle cx="64" cy="40" r="2.5" fill="#F8FAFC" />

          {/* Mouth */}
          <motion.path
            d={isSuccess ? 'M38 56 Q50 64 62 56' : isError ? 'M42 60 Q50 54 58 60' : 'M40 58 Q50 64 60 58'}
            stroke="#0B0F1A"
            strokeWidth="3"
            strokeLinecap="round"
            fill="transparent"
          />

          {/* Body with batik pattern */}
          <defs>
            <pattern id="batik" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#7C3AED" />
              <circle cx="5" cy="5" r="2" fill="#FCD34D" />
              <rect x="1" y="1" width="2" height="2" fill="#3B82F6" />
              <rect x="7" y="7" width="2" height="2" fill="#3B82F6" />
            </pattern>
          </defs>
          <rect x="30" y="68" width="40" height="26" rx="10" fill="#7C3AED" />
          <rect x="30" y="68" width="40" height="26" rx="10" fill="url(#batik)" opacity="0.3" />
          {/* Pesat badge */}
          <circle cx="50" cy="81" r="8" fill="#F8FAFC" opacity="0.9" />
          <text
            x="50"
            y="84.5"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#7C3AED"
            fontFamily="system-ui, sans-serif"
          >
            P
          </text>

          {/* Arms */}
          <motion.line
            x1="30"
            y1="75"
            x2="15"
            y2="80"
            stroke="#7C3AED"
            strokeWidth="4"
            strokeLinecap="round"
            animate={isProcessing ? { x2: [15, 10, 15], y2: [70, 55, 70] } : { x2: 15, y2: 80 }}
          />
          <motion.line
            x1="70"
            y1="75"
            x2="85"
            y2="80"
            stroke="#7C3AED"
            strokeWidth="4"
            strokeLinecap="round"
            animate={isProcessing ? { x2: [85, 90, 85], y2: [70, 55, 70] } : { x2: 85, y2: 80 }}
          />

          {/* Legs */}
          <motion.line
            x1="40"
            y1="94"
            x2="40"
            y2="100"
            stroke="#7C3AED"
            strokeWidth="4"
            strokeLinecap="round"
            animate={isProcessing ? { y2: [100, 95, 100] } : {}}
          />
          <motion.line
            x1="60"
            y1="94"
            x2="60"
            y2="100"
            stroke="#7C3AED"
            strokeWidth="4"
            strokeLinecap="round"
            animate={isProcessing ? { y2: [100, 105, 100] } : {}}
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

function FloatingSparkles({ isProcessing }: { isProcessing: boolean }) {
  const particles = [
    { color: '#FCD34D', x: -40, y: -30, delay: 0, size: 4 },
    { color: '#7C3AED', x: 40, y: -35, delay: 0.3, size: 3 },
    { color: '#3B82F6', x: -45, y: 10, delay: 0.6, size: 3.5 },
    { color: '#EC4899', x: 45, y: 15, delay: 0.9, size: 4 },
    { color: '#F59E0B', x: -30, y: 40, delay: 1.2, size: 3 },
    { color: '#22C55E', x: 35, y: 45, delay: 1.5, size: 3.5 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            marginLeft: p.x,
            marginTop: p.y,
          }}
          animate={{
            y: [0, -12, 0, 8, 0],
            x: [0, 6, 0, -6, 0],
            opacity: isProcessing ? [0.4, 1, 0.4, 0.8, 0.4] : [0.2, 0.5, 0.2, 0.4, 0.2],
            scale: [1, 1.3, 1, 1.1, 1],
          }}
          transition={{
            duration: 2.5 + i * 0.3,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function PulseRing({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-24 h-24 rounded-full"
        style={{ border: `2px solid ${color}` }}
      />
    </div>
  );
}

function BotTrail({ color, isProcessing }: { color: string; isProcessing: boolean }) {
  const trail = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    angle: (i * 72 + 30) * (Math.PI / 180),
    distance: 28 + i * 6,
    delay: i * 0.12,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {trail.map((t) => {
        const x = Math.cos(t.angle) * t.distance;
        const y = Math.sin(t.angle) * t.distance;
        return (
          <motion.div
            key={t.id}
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              width: 4,
              height: 4,
              marginLeft: x - 2,
              marginTop: y - 2,
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}`,
            }}
            animate={{
              scale: isProcessing ? [1, 1.5, 1] : [1, 1.2, 1],
              opacity: isProcessing ? [0.2, 0.7, 0.2] : [0.1, 0.3, 0.1],
              x: [0, x * 0.3, 0],
              y: [0, y * 0.3, 0],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: t.delay,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

function StageBadge({ stage, color }: { stage: ActivityStage; color: string }) {
  const labels: Record<ActivityStage, string> = {
    idle: 'Ready',
    thinking: 'Think',
    searching: 'Research',
    analyzing: 'Analyze',
    crafting: 'Craft',
    meeting: 'Meeting',
    image: 'Design',
    success: 'Done!',
    error: 'Oops',
  };

  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.6 }}
        animate={{ opacity: 1, y: -18, scale: 1 }}
        exit={{ opacity: 0, y: -28, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {labels[stage]}
      </motion.div>
    </div>
  );
}

function ActivityLogItem({ log, isCurrent }: { log: ActivityItem; isCurrent: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex items-start gap-3 py-2 px-2 rounded-lg ${isCurrent ? 'bg-[rgba(124,58,237,0.08)]' : ''}`}
    >
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
    </motion.div>
  );
}

function ProgressBar({ stage, isProcessing }: { stage: ActivityStage; isProcessing: boolean }) {
  const icon = stageToIcon[stage] || 'thinking';
  const meta = stageMeta[icon] || stageMeta.thinking;
  const progress = {
    idle: 5,
    thinking: 15,
    searching: 30,
    analyzing: 45,
    crafting: 60,
    meeting: 70,
    image: 80,
    success: 100,
    error: 100,
  }[stage];

  return (
    <div className="w-full mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-[#F8FAFC] flex items-center gap-1">
          {stage === 'success' && <Trophy className="w-3 h-3 text-[#22C55E]" />}
          {stage === 'error' && <AlertTriangle className="w-3 h-3 text-[#EF4444]" />}
          {stage === 'thinking' && <Lightbulb className="w-3 h-3 text-[#7C3AED]" />}
          {stage === 'searching' && <Search className="w-3 h-3 text-[#3B82F6]" />}
          {stage === 'analyzing' && <BarChart3 className="w-3 h-3 text-[#06B6D4]" />}
          {stage === 'crafting' && <Users className="w-3 h-3 text-[#EC4899]" />}
          {stage === 'meeting' && <Coffee className="w-3 h-3 text-[#8B5CF6]" />}
          {stage === 'image' && <Paintbrush className="w-3 h-3 text-[#F59E0B]" />}
          {stage === 'idle' && <Lightbulb className="w-3 h-3 text-[#7C3AED]" />}
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
          className="h-full rounded-full relative"
          style={{ backgroundColor: meta.color }}
        >
          {isProcessing && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 14px 2px ${meta.color}` }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)' }}
                initial={{ x: '-100%' }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#FCD34D', '#7C3AED', '#3B82F6', '#EC4899', '#22C55E', '#F59E0B'];
  const particles = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200 - 50,
    rotate: Math.random() * 360,
    color: colors[i % colors.length],
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            x: [0, p.x, p.x * 1.5],
            y: [0, p.y, p.y + 120],
            rotate: [0, p.rotate, p.rotate + 180],
            scale: [1, 1.2, 0.6],
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute rounded-sm"
          style={{ backgroundColor: p.color, width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}

export default function ActivityPanel() {
  const { logs, isProcessing, currentStage, clearLogs } = useActivity();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(true);
  const [funFactIndex] = useState(() => Math.floor(Math.random() * funFacts.length));

  const currentLog = logs[logs.length - 1];
  const currentIcon = currentLog?.icon || stageToIcon[currentStage] || 'thinking';
  const meta = stageMeta[currentIcon] || stageMeta.thinking;
  const funMessage = useFunMessage(currentIcon);
  const dragControls = useDragControls();

  const currentLogId = currentLog?.id;
  const progress = {
    idle: 5,
    thinking: 15,
    searching: 30,
    analyzing: 45,
    crafting: 60,
    meeting: 70,
    image: 80,
    success: 100,
    error: 100,
  }[currentStage];

  // Reset mobile/desktop open state when a new processing cycle starts.
  useEffect(() => {
    if (isProcessing) {
      setDesktopCollapsed(false);
      setMobileOpen(true);
    }
  }, [isProcessing]);

  // Expose mobile panel height as a CSS variable so the chat area can pad itself.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(
      '--mobile-panel-height',
      mobileOpen ? '55vh' : '0'
    );
  }, [mobileOpen]);

  // Auto-hide the panel a few seconds after processing completes.
  useEffect(() => {
    if (!isProcessing && logs.length > 0) {
      const t = window.setTimeout(() => {
        clearLogs();
        setDesktopCollapsed(false);
        setMobileOpen(false);
      }, 7000);
      return () => clearTimeout(t);
    }
  }, [isProcessing, logs.length, clearLogs]);

  const openMobile = useCallback(() => {
    if (isProcessing || logs.length > 0) setMobileOpen(true);
  }, [isProcessing, logs.length]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Keep the mobile mini bar visible while there are logs or processing is active.
  const showMobile = isProcessing || logs.length > 0;
  // Desktop panel only shows when there is actual activity.
  const showDesktop = isProcessing || logs.length > 0;

  return (
    <>
      {/* Desktop Right Panel */}
      <AnimatePresence mode="popLayout">
        {showDesktop && !desktopCollapsed && (
          <motion.aside
            key="desktop-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hidden xl:flex fixed right-4 top-20 bottom-24 w-[300px] flex-col z-40 pointer-events-auto"
          >
            <div
              className={`bg-gradient-to-br ${meta.gradient} backdrop-blur-[16px] border border-[rgba(124,58,237,0.25)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden h-full bg-[#0F1423]/90 relative`}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}22, transparent 60%)` }}
                animate={{ opacity: isProcessing ? [0.3, 0.6, 0.3] : [0.2, 0.3, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative z-10 flex flex-col h-full">
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
                    <div key={currentIcon} className="relative w-24 h-24 mx-auto">
                      <FloatingSparkles isProcessing={isProcessing} />
                      <BotTrail color={meta.color} isProcessing={isProcessing} />
                      <AnimatePresence mode="wait">
                        <PulseRing key={currentIcon + '-pulse'} color={meta.color} />
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        <StageBadge key={currentStage + '-badge'} stage={currentStage} color={meta.color} />
                      </AnimatePresence>
                      <CendekiaBot icon={currentIcon} stage={currentStage} isProcessing={isProcessing} />
                    </div>
                    {isProcessing && <WalkingDots />}
                  <motion.p
                    key={currentIcon + funMessage}
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[14px] font-bold text-[#F8FAFC] text-center leading-tight px-2"
                  >
                    {funMessage}
                  </motion.p>
                  {currentStage === 'success' && (
                    <>
                      <Confetti />
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="px-3 py-1 rounded-full bg-gradient-to-r from-[#22C55E] to-[#3B82F6] text-white text-[11px] font-bold shadow-lg"
                      >
                        🏆 Quest Complete!
                      </motion.div>
                    </>
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
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Collapsed Pill */}
      <AnimatePresence>
        {showDesktop && desktopCollapsed && (isProcessing || logs.length > 0) && (
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
              animate={{ y: mobileOpen ? '0%' : '100%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.35 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) {
                  closeMobile();
                }
              }}
              className="lg:hidden fixed left-0 right-0 bottom-0 z-[60] h-[55vh] pointer-events-auto"
            >
              <div className="h-full bg-[#0F1423] rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.35)] border-t border-[rgba(124,58,237,0.25)] flex flex-col overflow-hidden">
                {/* Drag handle */}
                <div className="flex flex-col items-center pt-3 pb-2 px-4 border-b border-[rgba(124,58,237,0.12)]">
                  <motion.div
                    onPointerDown={(e) => dragControls.start(e)}
                    onClick={closeMobile}
                    className="w-12 h-1.5 rounded-full bg-[rgba(255,255,255,0.15)] mb-3 cursor-pointer hover:bg-[rgba(255,255,255,0.25)] transition-colors"
                    whileTap={{ scale: 0.9 }}
                  />
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
                    <div key={currentIcon} className="relative w-24 h-24 mx-auto">
                      <FloatingSparkles isProcessing={isProcessing} />
                      <BotTrail color={meta.color} isProcessing={isProcessing} />
                      <AnimatePresence mode="wait">
                        <PulseRing key={currentIcon + '-pulse'} color={meta.color} />
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        <StageBadge key={currentStage + '-badge'} stage={currentStage} color={meta.color} />
                      </AnimatePresence>
                      <CendekiaBot icon={currentIcon} stage={currentStage} isProcessing={isProcessing} />
                    </div>
                    {isProcessing && <WalkingDots />}
                    <motion.p
                      key={currentIcon + funMessage}
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="text-[16px] font-bold text-[#F8FAFC] text-center leading-tight px-6"
                    >
                      {funMessage}
                    </motion.p>
                    {currentStage === 'success' && (
                      <>
                        <Confetti />
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#22C55E] to-[#3B82F6] text-white text-[12px] font-bold shadow-lg"
                        >
                          🏆 Quest Complete!
                        </motion.div>
                      </>
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
              {mobileOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={closeMobile}
                  className="lg:hidden fixed inset-0 z-[55] bg-black/30 pointer-events-auto"
                />
              )}
            </AnimatePresence>

            {/* Collapsed mini bar */}
            {!mobileOpen && (
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
