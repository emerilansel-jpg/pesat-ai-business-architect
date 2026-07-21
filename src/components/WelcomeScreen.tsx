import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface WelcomeScreenProps {
  onPickExample?: (text: string) => void;
}

const EXAMPLES = [
  {
    label: 'Contoh brand',
    text: 'Brand saya adalah Pesat AI, dengan domain pesat.ai didirikan oleh Nell VH praktisi SEO/AI Search dan AI internasional. Kami membantu UKM menemukan apps dan sistem AI yang paling cocok untuk menyelesaikan tantangan bisnis mereka.',
  },
  {
    label: 'Contoh singkat',
    text: 'Bisnis saya toko kue online di Jakarta, omset 50jt/bulan, mau scale tapi tim admin sudah overload.',
  },
  {
    label: 'Contoh UKM',
    text: 'Saya punya brand skincare lokal, jual lewat Shopee dan TikTok Shop,Repeat order-nya rendah dan CS kewalahan jawab pertanyaan repetitif.',
  },
];

const WelcomeScreen = memo(function WelcomeScreen({ onPickExample }: WelcomeScreenProps) {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 6,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
      opacity: 0.2 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-4 relative overflow-hidden">
      {/* Ambient floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-particle-drift"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              background:
                p.id % 3 === 0
                  ? '#7C3AED'
                  : p.id % 3 === 1
                    ? '#8B5CF6'
                    : '#3B82F6',
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 pointer-events-none hidden lg:block"
        style={{
          background:
            'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, rgba(15,23,42,0) 50%)',
        }}
      />

      {/* AI Avatar */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.4 }}
        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center relative z-10"
        style={{ boxShadow: '0 0 28px rgba(124, 58, 237, 0.25)' }}
      >
        <span className="text-[32px] md:text-[40px] font-bold text-white">P</span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.7 }}
        className="relative z-10 text-[26px] md:text-[36px] font-bold text-center leading-tight tracking-tight"
      >
        <span className="text-slate-900 lg:gradient-text">
          Pesat AI Business Architect
        </span>
      </motion.h1>

      {/* Subtitle line 1 */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo, delay: 1.0 }}
        className="relative z-10 text-[16px] md:text-[18px] font-semibold text-slate-700 text-center max-w-[520px] leading-snug lg:text-[#F8FAFC]"
      >
        Naikkan omset, hemat banyak, tanpa harus tambah karyawan.
      </motion.p>

      {/* Subtitle line 2 */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo, delay: 1.2 }}
        className="relative z-10 text-[14px] md:text-[15px] font-medium text-[#7C3AED] text-center max-w-[480px] leading-relaxed lg:text-[#A78BFA]"
      >
        AI yang belajar bisnis Anda, bukan bisnis Anda yang belajar AI.
      </motion.p>

      {/* Subtitle line 3 */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo, delay: 1.4 }}
        className="relative z-10 text-[13px] md:text-[14px] font-normal text-slate-500 text-center max-w-[520px] leading-relaxed lg:text-[#CBD5E1]"
      >
        Ceritakan bisnis atau brand Anda, dan saya bantu carikan solusi
        Apps/AI yang paling cocok untuk menyelesaikan tantangan bisnis yang
        paling mahal dan paling layak diselesaikan.
      </motion.p>

      {/* Example chips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo, delay: 1.6 }}
        className="relative z-10 w-full max-w-[560px] flex flex-col gap-2 mt-2"
      >
        <div className="flex items-center justify-center gap-1.5 text-[11px] md:text-xs font-medium text-slate-400 lg:text-[#64748B]">
          <Sparkles className="w-3 h-3" />
          <span>Belum tahu harus mulai dari mana? Coba salah satu contoh:</span>
        </div>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onPickExample?.(ex.text)}
              className="group text-left px-4 py-3 rounded-2xl border border-slate-200/80 lg:border-[rgba(124,58,237,0.2)] bg-white/70 lg:bg-[rgba(26,31,53,0.6)] backdrop-blur-sm hover:border-[#7C3AED] lg:hover:bg-[rgba(124,58,237,0.08)] transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED] lg:text-[#A78BFA]">
                  {ex.label}
                </span>
                <span className="text-[10px] text-slate-400 lg:text-[#475569] opacity-0 group-hover:opacity-100 transition-opacity">
                  klik untuk pakai →
                </span>
              </div>
              <p className="text-[12px] md:text-[13px] text-slate-600 lg:text-[#CBD5E1] leading-relaxed line-clamp-2">
                {ex.text}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
});

export default WelcomeScreen;
