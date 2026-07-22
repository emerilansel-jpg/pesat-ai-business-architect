import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useActivity, type ActivityItem, type ActivityIcon, type ActivityStage } from '../contexts/ActivityContext';
import {
  Sparkles,
  X,
  ChevronUp,
  Trophy,
  Minus,
  Lightbulb,
  Search,
  BarChart3,
  Users,
  Paintbrush,
  Coffee,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';

const stageMeta: Record<
  ActivityIcon,
  { label: string; color: string; gradient: string; progress: number }
> = {
  thinking: {
    label: 'Tim strategi berkumpul...',
    color: '#7C3AED',
    gradient: 'from-[#7C3AED]/25 to-[#3B82F6]/10',
    progress: 15,
  },
  search: {
    label: 'Wiro Sableng turun ke pasar...',
    color: '#3B82F6',
    gradient: 'from-[#3B82F6]/25 to-[#06B6D4]/10',
    progress: 30,
  },
  analyze: {
    label: 'Gundala menyalakan petir analisis...',
    color: '#06B6D4',
    gradient: 'from-[#06B6D4]/25 to-[#8B5CF6]/10',
    progress: 45,
  },
  sparkle: {
    label: 'Srikandi merangkul tim ahli...',
    color: '#EC4899',
    gradient: 'from-[#EC4899]/25 to-[#7C3AED]/10',
    progress: 60,
  },
  image: {
    label: 'Jaka Sembung buka sketchbook...',
    color: '#F59E0B',
    gradient: 'from-[#F59E0B]/25 to-[#7C3AED]/10',
    progress: 80,
  },
  meeting: {
    label: 'Godam memimpin rapat...',
    color: '#8B5CF6',
    gradient: 'from-[#8B5CF6]/25 to-[#EC4899]/10',
    progress: 70,
  },
  coffee: {
    label: 'Tukang bubur kirim update...',
    color: '#A97142',
    gradient: 'from-[#A97142]/25 to-[#F59E0B]/10',
    progress: 75,
  },
  design: {
    label: 'Arjuna & Srikandi menyusun visual...',
    color: '#EC4899',
    gradient: 'from-[#EC4899]/25 to-[#F59E0B]/10',
    progress: 85,
  },
  code: {
    label: 'Gatotkaca mulai coding...',
    color: '#3B82F6',
    gradient: 'from-[#3B82F6]/25 to-[#06B6D4]/10',
    progress: 90,
  },
  deploy: {
    label: 'TimFinish menyentuh final check...',
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

// Cast of Indonesian legend characters. Each character owns a domain and a
// rotating set of in-character messages. The activity panel picks a member
// per stage so the panel feels like a real team working in parallel — not
// a single mascot looping the same lines.
interface CastMember {
  name: string;
  role: string;
  emoji: string;
  accent: string; // hex color
  lines: string[];
}

const CAST: Record<ActivityIcon, CastMember[]> = {
  thinking: [
    {
      name: 'Srikandi',
      role: 'Strategist',
      emoji: '🏹',
      accent: '#EC4899',
      lines: [
        'Srikandi menarik busur strategi, membidik sasaran...',
        'Srikandi menyusun battle plan buat bisnis anda...',
      ],
    },
    {
      name: 'Godam',
      role: 'Architect',
      emoji: '🔨',
      accent: '#8B5CF6',
      lines: [
        'Godam menarik napas, memusatkan pikiran...',
        'Godam menyusun blueprint di kepalanya...',
      ],
    },
  ],
  search: [
    {
      name: 'Wiro Sableng',
      role: 'Field Researcher',
      emoji: '⚔️',
      accent: '#3B82F6',
      lines: [
        'Wiro Sableng menyusuri pasar internet dengan kapak 212...',
        'Wiro mengejar data kompetitor sampai ke ujung dunia...',
      ],
    },
    {
      name: 'Gundala',
      role: 'Intel',
      emoji: '⚡',
      accent: '#06B6D4',
      lines: [
        'Gundala menyalakan petir, scan seluruh market...',
        'Gundala kejar review customer dengan kecepatan kilat...',
      ],
    },
  ],
  analyze: [
    {
      name: 'Gatotkaca',
      role: 'Analyst',
      emoji: '🛡️',
      accent: '#F59E0B',
      lines: [
        'Gatotkaca menabrak dinding data, otaknya membaca pola...',
        'Gatotkaca otak-kuning menyala, menghubungkan titik-titik...',
      ],
    },
    {
      name: 'Godam',
      role: 'Architect',
      emoji: '🔨',
      accent: '#8B5CF6',
      lines: [
        'Godam membedah bottleneck dengan palu logika...',
      ],
    },
  ],
  sparkle: [
    {
      name: 'Arjuna',
      role: 'Ideator',
      emoji: '🏹',
      accent: '#10B981',
      lines: [
        'Arjuna membidik ide paling tajam dari sempalan strategi...',
        'Arjuna merangkai solusi seindah panah sakti...',
      ],
    },
    {
      name: 'Srikandi',
      role: 'Strategist',
      emoji: '🏹',
      accent: '#EC4899',
      lines: [
        'Srikandi memoles draft strategi sampai kinclong...',
      ],
    },
  ],
  meeting: [
    {
      name: 'Godam',
      role: 'Architect',
      emoji: '🔨',
      accent: '#8B5CF6',
      lines: [
        'Godam ketok palu, rapat dimulai!',
        'Semua pahlawan on-cam, Godam pimpin diskusi...',
      ],
    },
  ],
  image: [
    {
      name: 'Jaka Sembung',
      role: 'Art Director',
      emoji: '🗡️',
      accent: '#F59E0B',
      lines: [
        'Jaka Sembung buka sketchbook, mulai sketsa visual...',
        'Jaka Sembung goreskan kuas, design mengalir...',
        'Jaka Sembung ngopi item sambil polish layout...',
      ],
    },
    {
      name: 'Sri Asih',
      role: 'Visual Designer',
      emoji: '💫',
      accent: '#EC4899',
      lines: [
        'Sri Asih bantu Jaka Sembung merangkai palet warna...',
        'Sri Asih tambah sentuhan estetik di setiap frame...',
      ],
    },
  ],
  coffee: [
    {
      name: 'Tukang Bubur',
      role: 'Morale Officer',
      emoji: '🍲',
      accent: '#A97142',
      lines: [
        'Tukang bubur datang bawa sarapan, tim on fire!',
        'Tukang bubur share gosip kompetitor sambil tuang bubur...',
      ],
    },
  ],
  design: [
    {
      name: 'Jaka Sembung',
      role: 'Art Director',
      emoji: '🗡️',
      accent: '#F59E0B',
      lines: [
        'Jaka Sembung finalisasi visual strategis...',
        'Jaka Sembung ukir infografis sampai presisi...',
      ],
    },
    {
      name: 'Sri Asih',
      role: 'Visual Designer',
      emoji: '💫',
      accent: '#EC4899',
      lines: [
        'Sri Asih review detail kecil yang sering kepalya...',
      ],
    },
  ],
  code: [
    {
      name: 'Gatotkaca',
      role: 'Engineer',
      emoji: '🛡️',
      accent: '#3B82F6',
      lines: [
        'Gatotkaca nugel kode bug dengan otot Kawitra...',
        'Gatotkaca build automasi secepat kilat...',
      ],
    },
    {
      name: 'Gundala',
      role: 'Backend',
      emoji: '⚡',
      accent: '#06B6D4',
      lines: [
        'Gundala alirkan listrik ke setiap endpoint API...',
      ],
    },
  ],
  deploy: [
    {
      name: 'Wiro Sableng',
      role: 'QA',
      emoji: '⚔️',
      accent: '#10B981',
      lines: [
        'Wiro Sableng uji sistem, pastikan tidak ada celah...',
        'Wiro lempar kapak 212, tebas bug terakhir...',
      ],
    },
  ],
  success: [
    {
      name: 'Tim Pahlawan',
      role: 'Done!',
      emoji: '🎉',
      accent: '#22C55E',
      lines: [
        'Semua pahlawan angkat gelas, misi selesai! 🎊',
        'Tim kembali ke markas, hasil sudah siap! 🚀',
        'Godam ketuk palu: APPROVED! ✅',
      ],
    },
  ],
  error: [
    {
      name: 'Tim Pahlawan',
      role: 'Hickup',
      emoji: '🚧',
      accent: '#EF4444',
      lines: [
        'Waduh, ada musuh baru. Tim mundur sebentar, sregroupp! 🛡️',
        'Ada gangguan kekuatan, kami sambut lagi sebentar...',
      ],
    },
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

/**
 * Return Pesat as the always-present leader plus 2-3 pahlawan workers who are
 * "on duty" for the current stage. The worker set rotates on a cadence so the
 * panel reads as a real team working in parallel, not one mascot.
 *
 * Each stage has a pool of relevant experts. We always show Pesat (leader)
 * plus a rotating subset of 2 workers; one of them is flagged "active" so the
 * caption can highlight who's doing the main task right now.
 */
const STAGE_WORKERS: Record<ActivityIcon, CastMember[]> = {
  thinking: [
    CAST.thinking[0], CAST.thinking[1], CAST.analyze[0], CAST.sparkle[0],
  ].filter(Boolean) as CastMember[],
  search: [
    CAST.search[0], CAST.search[1], CAST.analyze[1],
  ].filter(Boolean) as CastMember[],
  analyze: [
    CAST.analyze[0], CAST.analyze[1], CAST.sparkle[1],
  ].filter(Boolean) as CastMember[],
  sparkle: [
    CAST.sparkle[0], CAST.sparkle[1], CAST.thinking[0],
  ].filter(Boolean) as CastMember[],
  meeting: [
    CAST.meeting[0], CAST.sparkle[0], CAST.analyze[0],
  ].filter(Boolean) as CastMember[],
  image: [
    CAST.image[0], CAST.image[1], CAST.design[1],
  ].filter(Boolean) as CastMember[],
  coffee: [
    CAST.coffee[0], CAST.thinking[0],
  ].filter(Boolean) as CastMember[],
  design: [
    CAST.design[0], CAST.design[1], CAST.image[0],
  ].filter(Boolean) as CastMember[],
  code: [
    CAST.code[0], CAST.code[1], CAST.analyze[0],
  ].filter(Boolean) as CastMember[],
  deploy: [
    CAST.deploy[0], CAST.code[0], CAST.search[0],
  ].filter(Boolean) as CastMember[],
  success: CAST.success,
  error: CAST.error,
};

const PESAT_LEADER: CastMember = {
  name: 'Pesat',
  role: 'Leader',
  emoji: '🟣',
  accent: '#7C3AED',
  lines: [
    'Pesat mengkoordinasikan tim…',
    'Pesat mengarahkan strategi…',
  ],
};

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function useActiveCast(icon: ActivityIcon, isProcessing: boolean) {
  const pool = STAGE_WORKERS[icon] || STAGE_WORKERS.thinking;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;
    setTick((t) => t + 1);
    const interval = window.setInterval(() => setTick((t) => t + 1), 3200);
    return () => window.clearInterval(interval);
  }, [icon, isProcessing]);

  // Pick 2 workers (3 if pool is rich) + derive the active speaker
  const workers = useMemo(() => {
    const count = pool.length >= 3 ? 3 : Math.min(2, pool.length);
    return pickRandom(pool, count);
    // re-pick whenever stage or tick changes
  }, [pool, tick]);

  const activeWorker = workers[0] || pool[0];
  const line = activeWorker?.lines[Math.floor(Math.random() * activeWorker.lines.length)] || PESAT_LEADER.lines[0];

  return { leader: PESAT_LEADER, workers, activeWorker, line };
}

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

/**
 * CastRing — Pesat in the center as leader, with 2-3 worker pahlawan avatars
 * orbiting around him. The active worker has a glowing ring + label.
 * This replaces the old single-mascot mount point and makes the panel read
 * as a real team working in parallel.
 */
function CastRing({
  leader,
  workers,
  activeWorker,
  stageColor,
  isProcessing,
}: {
  leader: CastMember;
  workers: CastMember[];
  activeWorker?: CastMember;
  stageColor: string;
  isProcessing: boolean;
}) {
  const size = 144; // ring diameter area
  const center = size / 2;
  const leaderRadius = 26;
  const workerRadius = 18;
  // place workers on a circle around the leader
  const workerRingRadius = 48;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* pulse backdrop */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{ background: `radial-gradient(circle, ${stageColor}22, transparent 65%)` }}
        animate={{ opacity: isProcessing ? [0.25, 0.55, 0.25] : [0.15, 0.25, 0.15] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Leader: Pesat in the center */}
      <motion.div
        className="absolute rounded-full flex items-center justify-center text-white font-bold shadow-lg"
        style={{
          width: leaderRadius * 2,
          height: leaderRadius * 2,
          left: center - leaderRadius,
          top: center - leaderRadius,
          background: `radial-gradient(circle at 30% 30%, ${leader.accent}, #4C1D95)`,
          boxShadow: `0 0 18px ${leader.accent}66`,
        }}
        animate={isProcessing ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[20px] leading-none">{leader.emoji}</span>
      </motion.div>
      <div
        className="absolute text-center"
        style={{ left: center - 40, top: center + leaderRadius + 4, width: 80 }}
      >
        <p className="text-[10px] font-semibold text-[#F8FAFC] leading-tight">{leader.name}</p>
        <p className="text-[8px] text-[#A78BFA] leading-tight">{leader.role}</p>
      </div>

      {/* Workers orbiting */}
      {workers.map((w, i) => {
        const angle = (i / Math.max(workers.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = center + Math.cos(angle) * workerRingRadius - workerRadius;
        const y = center + Math.sin(angle) * workerRingRadius - workerRadius;
        const isActive = activeWorker && w.name === activeWorker.name;
        return (
          <motion.div
            key={w.name + i}
            className="absolute rounded-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [0, Math.cos(angle) * 3, 0],
              y: [0, Math.sin(angle) * 3, 0],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
              x: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              width: workerRadius * 2,
              height: workerRadius * 2,
              left: x,
              top: y,
              background: `radial-gradient(circle at 30% 30%, ${w.accent}, ${w.accent}99)`,
              boxShadow: isActive
                ? `0 0 0 2px #fff, 0 0 14px ${w.accent}`
                : `0 0 8px ${w.accent}55`,
              zIndex: isActive ? 5 : 2,
            }}
            title={`${w.name} · ${w.role}`}
          >
            <span className="text-[14px] leading-none">{w.emoji}</span>
            {/* floating label for active worker */}
            {isActive && (
              <motion.span
                layoutId="active-worker-label"
                className="absolute -bottom-4 whitespace-nowrap text-[9px] font-semibold text-white px-1.5 py-0.5 rounded-full"
                style={{ background: w.accent }}
              >
                {w.name}
              </motion.span>
            )}
          </motion.div>
        );
      })}

      {/* connecting lines leader <-> workers (svg overlay) */}
      <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
        {workers.map((w, i) => {
          const angle = (i / Math.max(workers.length, 1)) * Math.PI * 2 - Math.PI / 2;
          const x2 = center + Math.cos(angle) * workerRingRadius;
          const y2 = center + Math.sin(angle) * workerRingRadius;
          return (
            <line
              key={w.name + '-line-' + i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke={stageColor}
              strokeOpacity={0.25}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          );
        })}
      </svg>
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
  const { leader, workers, activeWorker, line: activeLine } = useActiveCast(currentIcon, isProcessing);
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
                    <CastRing
                      key={currentIcon}
                      leader={leader}
                      workers={workers}
                      activeWorker={activeWorker}
                      stageColor={meta.color}
                      isProcessing={isProcessing}
                    />
                    {isProcessing && <WalkingDots />}
                    {/* Active cast member badge — feels like an expert stepping up */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={(activeWorker?.name || 'pesat') + currentIcon}
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.92 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-[rgba(26,31,53,0.7)] backdrop-blur-sm"
                        style={{ borderColor: `${activeWorker?.accent || leader.accent}55` }}
                      >
                        <span className="text-[16px] leading-none">{activeWorker?.emoji || leader.emoji}</span>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[12px] font-semibold text-[#F8FAFC]">{activeWorker?.name || leader.name}</span>
                          <span className="text-[10px] text-[#A78BFA]">{activeWorker?.role || leader.role}</span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  <motion.p
                    key={currentIcon + activeLine}
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[14px] font-bold text-[#F8FAFC] text-center leading-tight px-2"
                  >
                    {activeLine}
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
                    <CastRing
                      key={currentIcon}
                      leader={leader}
                      workers={workers}
                      activeWorker={activeWorker}
                      stageColor={meta.color}
                      isProcessing={isProcessing}
                    />
                    {isProcessing && <WalkingDots />}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={(activeWorker?.name || 'pesat') + currentIcon}
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.92 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-[rgba(26,31,53,0.7)] backdrop-blur-sm"
                        style={{ borderColor: `${activeWorker?.accent || leader.accent}55` }}
                      >
                        <span className="text-[18px] leading-none">{activeWorker?.emoji || leader.emoji}</span>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[13px] font-semibold text-[#F8FAFC]">{activeWorker?.name || leader.name}</span>
                          <span className="text-[11px] text-[#A78BFA]">{activeWorker?.role || leader.role}</span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <motion.p
                      key={currentIcon + activeLine}
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="text-[16px] font-bold text-[#F8FAFC] text-center leading-tight px-6"
                    >
                      {activeLine}
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
                    <span className="text-lg">{activeWorker?.emoji || leader.emoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-bold text-[#F8FAFC] leading-tight truncate">
                    {activeWorker?.name || leader.name} · {activeLine}
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
