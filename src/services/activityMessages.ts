import { sendTextOnlyMessage } from './ai';
import type { ActivityStage } from '../contexts/ActivityContext';

const TEMPLATES: Record<ActivityStage, string[]> = {
  idle: ['Siap bantu! 🚀'],
  thinking: [
    'Sedang nyalain otak AI... 🤖',
    'Otak AI mulai panas nih...',
    'Sedang mikir keras bareng tim virtual...',
    'Persiapan otak AI sedang berlangsung...',
    'Lagi kumpulin ide cerdas...',
    'Tim expert virtual lagi ngumpul...',
    'Nyari sudut pandang paling tajam...',
    'CendekiaBot lagi ngerjain strategi...',
    'Sibuk brainstorming serius tapi lucu...',
    'Lagi nyusun rencana cerdas...',
  ],
  searching: [
    'Sedang jelajah internet... 🌐',
    'Riset market & kompetitor...',
    'Sedang intip data & review customer...',
    'Cari fakta menarik buat bisnis anda...',
    'Lagi baca tren industri...',
    'Jelajahi dunia maya buat insight...',
    'Scraping inspirasi dari kompetitor...',
    'Ngelacak data yang relevan...',
    'Sedang spy ke trend bisnis...',
    'Riset online dalam proses...',
  ],
  analyzing: [
    'Sedang baca pola bisnis anda...',
    'Planning & connect the dots...',
    'Analisa bottleneck tersembunyi...',
    'Susun strategi jitu...',
    'Lihat pola di balik data...',
    'Mengurai masalah jadi peluang...',
    'Ngehindari bias, cari fakta...',
    'Cari akar masalah dan solusi...',
    'Analisa sambil ngopi... ☕',
    'Connect the dots antar data...',
  ],
  crafting: [
    'Sedang racik jawaban keren... ✨',
    'Ajak tim ahli rapat virtual...',
    'Sedang diskusi seru sama expert...',
    'Racik solusi yang paling masuk akal...',
    'Polish ide jadi emas...',
    'Gundala & Sri Asih lagi brainstorming...',
    'Ngerangkai insight jadi rencana...',
    'Tim virtual voting solusi terbaik...',
    'Sedang buat output yang bikin wow...',
    'Racik jawaban sesuai konteks bisnis...',
  ],
  meeting: [
    'Meeting dimulai...',
    'Semua expert sudah on cam...',
    'Sedang presentasi hasil riset...',
    'Diskusi panas sedang berlangsung...',
  ],
  image: [
    'Sedang gambar visual lucu... 🎨',
    'Contacting Jaka Sembung (Design expert)...',
    'Jaka Sembung lagi siapin sketch...',
    'Design team lagi ngopi & ngerjain...',
    'Sedang gambar visual strategis...',
    'Jaka Sembung coret-coret ide...',
    'Sri Asih review desain...',
    'Tukang bubur kasih masukan warna...',
    'Visualisasi dalam proses...',
    'Sedang bikin gambar yang kece...',
  ],
  success: [
    'Selesai! Siap bantu lagi 🎉',
    'Jadi! Keren kan? 🚀',
    'Done! Semoga membantu! 🎊',
    'Mantap, respons sudah siap! ✨',
    'Selesai! Tim virtual istirahat dulu...',
    'Jadi! CendekiaBot bangga 🏆',
    'Done! Semoga bermanfaat! 🎁',
    'Respons siap pakai! 💪',
  ],
  error: [
    'Ups, ada error. Coba lagi ya 😅',
    'Waduh, ada kendala teknis. Coba ulang! 🛠️',
    'Gagal nih, tapi jangan menyerah! 🚀',
    'Hickup! Mari coba sekali lagi. 💪',
    'Error kecil, tim virtual lagi perbaiki...',
    'Waduh, CendekiaBot terpeleset! 🍌',
    'Coba ulang, semoga lancar 🤞',
    'Ada kendala, tim lagi reboot otak...',
  ],
};

function pickRandom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function taskSnippet(task?: string): string {
  if (!task) return 'ini';
  const clean = task.replace(/\[BRAND:[^\]]*\]/g, '').trim();
  return clean.length > 30 ? clean.slice(0, 30) + '...' : clean || 'ini';
}

/** Return a varied, task-aware status message instantly. */
export function getActivityMessage(
  stage: ActivityStage,
  task?: string,
  overrides?: Partial<Record<ActivityStage, string>>
): string {
  if (overrides?.[stage]) return overrides[stage]!;
  const base = pickRandom(TEMPLATES[stage] || TEMPLATES.idle);
  if (stage === 'thinking' || stage === 'analyzing' || stage === 'crafting') {
    const snippet = taskSnippet(task);
    return base.replace('...', ` soal "${snippet}"...`);
  }
  return base;
}

/** Try to generate AI-powered status messages for the whole flow. Falls back to templates. */
export async function generateActivityMessages(
  task: string
): Promise<Partial<Record<ActivityStage, string>> | null> {
  try {
    const prompt = `Kamu asisten AI lucu dan cerdas bernama Pesat AI. User meminta: "${task}".
Tim pahlawan Indonesia yang bekerja untukmu: Srikandi (Strategist), Godam (Architect), Wiro Sableng (Field Researcher), Gundala (Intel), Gatotkaca (Analyst/Engineer), Arjuna (Ideator), Jaka Sembung (Art Director), Sri Asih (Visual Designer), Tukang Bubur (Morale Officer). Buat status message pendek (maks 60 karakter) untuk tiap tahap, dalam Bahasa Indonesia, yang terasa seperti game notification dari tim pahlawan ini — beberapa ahli yang masuk/keluar sesuai tahapnya.
Tahap: thinking, searching, analyzing, crafting, image, success, error.
Gunakan emoji, humor, variasi, referensi task user, dan sebutkan nama pahlawan yang sedang bertugas. Jangan sama setiap sesi.
Format HANYA JSON:
{
  "thinking": "...",
  "searching": "...",
  "analyzing": "...",
  "crafting": "...",
  "image": "...",
  "success": "...",
  "error": "..."
}`;
    const res = await sendTextOnlyMessage(prompt, 'Generate activity messages');
    const text = res.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return parsed as Partial<Record<ActivityStage, string>>;
  } catch {
    return null;
  }
}
