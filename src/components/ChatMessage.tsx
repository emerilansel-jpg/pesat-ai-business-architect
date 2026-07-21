import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, ImageOff, Wand2, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import AIAvatar from './AIAvatar';
import { parseInlineImages, buildDallePrompt, getPollinationsUrl } from '../services/visualization';
import { generateImage } from '../services/ai';
import { loadSettings } from '../services/settings';
import { useActivity } from '../contexts/ActivityContext';
import { useBrand } from '../contexts/BrandContext';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export interface MessageImage {
  url: string;
  description?: string;
  type?: string;
  subject?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: MessageImage[];
}

interface ChatMessageProps {
  message: Message;
  isLastAI?: boolean;
  aiMessageIndex?: number;
  onRetry?: () => void;
  onChoiceClick?: (choice: string) => void;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Extract [BRAND:Nama] markers from text */
function parseBrandMarker(text: string): { cleanText: string; brandName: string | null } {
  const regex = /\[BRAND:([^\]]+)\]/g;
  let brandName: string | null = null;
  const cleanText = text.replace(regex, (_match, name) => {
    if (!brandName) brandName = name.trim();
    return '';
  });
  return { cleanText, brandName };
}

/** Extract brand initials (first 2 letters or first letters of 2 words) */
function getBrandInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + (words[1][0] || '')).toUpperCase();
}

/** Parse [CHOICE:a|b|c] tags from text */
function parseChoices(text: string): { cleanText: string; choices: string[] } {
  const choiceRegex = /\[CHOICE:([^\]]+)\]/g;
  const choices: string[] = [];
  let match;
  while ((match = choiceRegex.exec(text)) !== null) {
    match[1].split('|').forEach((c) => {
      const trimmed = c.trim().replace(/^\s*[-•]\s*/, '');
      if (trimmed) choices.push(trimmed);
    });
  }
  const cleanText = text.replace(choiceRegex, '').trim();
  return { cleanText, choices };
}

/** Parse [CTA:url] tags from text */
function parseCTA(text: string): { cleanText: string; ctaUrl: string | null } {
  const ctaRegex = /\[CTA:([^\]]+)\]/g;
  let ctaUrl: string | null = null;
  let match;
  while ((match = ctaRegex.exec(text)) !== null) {
    ctaUrl = match[1].trim();
  }
  const cleanText = text.replace(ctaRegex, '').trim();
  return { cleanText, ctaUrl };
}

const ChatMessage = memo(function ChatMessage({
  message,
  isLastAI = false,
  aiMessageIndex = 0,
  onRetry,
  onChoiceClick,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [imageGenerating, setImageGenerating] = useState<Record<number, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [manualRequested, setManualRequested] = useState<Record<number, boolean>>({});
  const { addLog, finishLog } = useActivity();
  const { brandName, setBrandName } = useBrand();
  const isAI = message.role === 'assistant';

  // Parse brand marker and choices from content
  const brandParsed = parseBrandMarker(message.content);
  const { cleanText, choices } = isAI
    ? parseChoices(brandParsed.cleanText)
    : { cleanText: brandParsed.cleanText, choices: [] };
  const displayChoices = choices.filter((c) => {
    const lower = c.trim().toLowerCase();
    return !lower.startsWith('lainnya') && !lower.includes('ketik sendiri');
  });
  const { cleanText: ctaCleanText, ctaUrl: parsedCtaUrl } = isAI
    ? parseCTA(cleanText)
    : { cleanText, ctaUrl: null };
  // Fallback: starting from the 3rd AI message, always surface a WhatsApp CTA
  // even if the AI did not emit a [CTA:...] tag. Keeps the door open for warm leads.
  const WHATSAPP_FALLBACK_URL = 'https://wa.me/6281290401240';
  const ctaUrl =
    parsedCtaUrl || (isAI && aiMessageIndex >= 3 ? WHATSAPP_FALLBACK_URL : null);

  // If AI mentions a brand name, remember it for the user avatar
  useEffect(() => {
    if (isAI && brandParsed.brandName) {
      setBrandName(brandParsed.brandName);
    }
  }, [isAI, brandParsed.brandName, setBrandName]);

  // Parse inline images for AI messages
  const { segments } = useMemo(() => {
    return isAI ? parseInlineImages(ctaCleanText) : { segments: [] };
  }, [ctaCleanText, isAI]);

  // Pre-fill auto-generated image URLs from the message.
  useEffect(() => {
    if (!message.images || !isAI) return;
    const urls: Record<number, string> = {};
    let imageIdx = 0;
    segments.forEach((seg, i) => {
      if (seg.type === 'image') {
        const img = message.images![imageIdx];
        if (img) urls[i] = img.url;
        imageIdx++;
      }
    });
    setImageUrls(urls);
  }, [message.images, segments, isAI]);

  const generateOneImage = useCallback(
    async (index: number, description: string) => {
      setImageGenerating((prev) => ({ ...prev, [index]: true }));
      setImageLoaded((prev) => ({ ...prev, [index]: false }));
      setImageError((prev) => ({ ...prev, [index]: false }));
      addLog('Sedang gambar visual lucu... 🎨', 'image');

      try {
        const settings = loadSettings();
        const prompt = buildDallePrompt(description || '', settings.imageStyle);
        const result = await generateImage(prompt, 1);
        const url = result.imageUrls[0] || getPollinationsUrl(description, index);
        setImageUrls((prev) => ({ ...prev, [index]: url }));
        finishLog('Visual jadi! 🎨', 'success');
      } catch {
        const fallback = getPollinationsUrl(description, index);
        setImageUrls((prev) => ({ ...prev, [index]: fallback }));
        finishLog('Visual jadi pakai fallback! 🎨', 'success');
      } finally {
        setImageGenerating((prev) => ({ ...prev, [index]: false }));
      }
    },
    [addLog, finishLog]
  );

  const handleManualGenerate = useCallback(
    (index: number, description: string) => {
      setManualRequested((prev) => ({ ...prev, [index]: true }));
      generateOneImage(index, description);
    },
    [generateOneImage]
  );

  // Generate images asynchronously, falling back to Pollinations.
  // Skip if the message already carries pre-generated images from App.tsx.
  useEffect(() => {
    let cancelled = false;

    async function generateImages() {
      if (message.images) return;
      const settings = loadSettings();
      const generating: Record<number, boolean> = {};
      segments.forEach((seg, i) => {
        if (seg.type === 'image' && settings.autoImageGen) generating[i] = true;
      });
      setImageGenerating(generating);

      const urls: Record<number, string> = {};

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.type !== 'image') continue;

        if (!settings.autoImageGen) {
          // Manual mode: leave a generate button, do not auto-generate
          continue;
        }

        try {
          const prompt = buildDallePrompt(seg.description || '', settings.imageStyle);
          const result = await generateImage(prompt, 1);
          urls[i] = result.imageUrls[0] || getPollinationsUrl(seg.description || '', i);
        } catch {
          urls[i] = getPollinationsUrl(seg.description || '', i);
        }
      }

      if (!cancelled) {
        setImageUrls(urls);
        setImageGenerating((prev) => {
          const next = { ...prev };
          segments.forEach((_, i) => {
            if (next[i]) next[i] = false;
          });
          return next;
        });
      }
    }

    generateImages();
    return () => {
      cancelled = true;
    };
  }, [segments]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (isAI) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: easeOutExpo }}
        className="flex items-start gap-2 md:gap-3 w-full group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex-shrink-0 pt-1">
          <AIAvatar />
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1 max-w-[85%] md:max-w-[80%]">
          {/* Message bubble */}
          <div className="bg-[#F2F2F7] text-slate-900 backdrop-blur-[12px] border-l-0 rounded-[18px_18px_18px_4px] px-4 py-3 shadow-sm lg:bg-[#1A1F35]/80 lg:text-[#CBD5E1] lg:border-l-[3px] lg:border-[#7C3AED] lg:rounded-[4px_16px_16px_16px] lg:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            {/* Render segments: text (markdown) and images (inline) */}
            {segments.map((seg, segIdx) => {
              if (seg.type === 'text') {
                return (
                  <div
                    key={segIdx}
                    className="markdown-body text-[14px] md:text-[15px] text-slate-900 leading-relaxed lg:text-[#CBD5E1] space-y-4 [&_p]:mb-4 [&_ul]:my-4 [&_ol]:my-4 [&_li]:mb-2 [&_h1]:mt-6 [&_h1]:pt-4 [&_h1]:border-t [&_h1]:border-slate-300 [&_h1]:lg:border-slate-700 [&_h2]:mt-5 [&_h2]:pt-3 [&_h2]:border-t [&_h2]:border-slate-300 [&_h2]:lg:border-slate-700 [&_h3]:mt-4"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(seg.content) as string,
                    }}
                  />
                );
              }
              // Image segment - render inline image card
              const url = imageUrls[segIdx];
              const isGenerating = imageGenerating[segIdx];
              const hasError = imageError[segIdx];
              const hasLoaded = imageLoaded[segIdx];
              const isManualReady = !url && !isGenerating && !manualRequested[segIdx];

              return (
                <div
                  key={segIdx}
                  className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-white lg:border-[rgba(124,58,237,0.2)] lg:bg-[#0B0F1A]"
                >
                  {/* Manual generate prompt */}
                  {isManualReady && (
                    <div className="w-full aspect-square flex flex-col items-center justify-center gap-3 px-6 text-center bg-slate-50 lg:from-[#111827] lg:to-[#0B0F1A] lg:bg-gradient-to-br">
                      <div className="w-12 h-12 rounded-full bg-[rgba(124,58,237,0.12)] flex items-center justify-center">
                        <Wand2 className="w-6 h-6 text-[#7C3AED]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-slate-900 mb-1 lg:text-[#F8FAFC]">
                          Visualisasi AI siap dibuat
                        </p>
                        <p className="text-[12px] text-slate-500 leading-relaxed lg:text-[#94A3B8]">
                          {seg.description.substring(0, 90)}
                          {seg.description.length > 90 ? '...' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleManualGenerate(segIdx, seg.description)}
                        className="mt-1 inline-flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white rounded-xl text-[13px] font-semibold transition-all active:scale-95 shadow-[0_4px_16px_rgba(124,58,237,0.3)]"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Generate visual
                      </button>
                      <span className="text-[11px] text-slate-400 lg:text-[#64748B]">
                        ±15–30 detik
                      </span>
                    </div>
                  )}

                  {/* Loading state */}
                  {isGenerating && (
                    <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 bg-slate-50 lg:bg-gradient-to-br lg:from-[#111827] lg:to-[#0B0F1A]">
                      <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                      <span className="text-[11px] text-slate-400 lg:text-[#64748B]">
                        Membuat visual... (±15–30 detik)
                      </span>
                    </div>
                  )}

                  {/* Error state */}
                  {hasError && (
                    <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 bg-slate-50 lg:bg-[#111827]">
                      <ImageOff className="w-6 h-6 text-[#64748B]" />
                      <span className="text-[11px] text-slate-500 lg:text-[#64748B]">Gagal memuat gambar</span>
                      <button
                        onClick={() => {
                          setImageError((prev) => ({ ...prev, [segIdx]: false }));
                          setImageLoaded((prev) => ({ ...prev, [segIdx]: false }));
                        }}
                        className="text-[11px] text-[#7C3AED] hover:text-[#A78BFA] underline"
                      >
                        Coba lagi
                      </button>
                    </div>
                  )}

                  {/* Image */}
                  {!hasError && !isManualReady && (
                    <img
                      src={url}
                      alt={seg.description}
                      className={`w-full h-auto aspect-square object-contain transition-opacity duration-700 ${
                        hasLoaded ? 'opacity-100' : 'opacity-0 h-0'
                      }`}
                      onLoad={() =>
                        setImageLoaded((prev) => ({ ...prev, [segIdx]: true }))
                      }
                      onError={() => {
                        // Mark loaded so the spinner hides; error state shows the error UI
                        setImageError((prev) => ({ ...prev, [segIdx]: true }));
                        setImageLoaded((prev) => ({ ...prev, [segIdx]: true }));
                      }}
                    />
                  )}

                  {/* Caption bar */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 lg:bg-[#111827]">
                    <span className="text-[11px] text-slate-500 lg:text-[#64748B] truncate max-w-[260px]">
                      {seg.description.substring(0, 60)}...
                    </span>
                  </div>
                </div>
              );
            })}

            {/* CTA Button (WhatsApp) */}
            {ctaUrl && (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl font-semibold text-[14px] shadow-[0_4px_16px_rgba(34,197,94,0.3)] transition-all active:scale-95"
              >
                {parsedCtaUrl ? 'Chat WhatsApp' : 'Bicara langsung via WhatsApp'}
              </a>
            )}

            {/* ===== CHOICE BUTTONS — onClick (reliable) ===== */}
            {choices.length > 0 && onChoiceClick && (
              <div className="mt-4 pt-3 border-t border-[rgba(124,58,237,0.15)]">
                <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-2.5">
                  Pilih jawaban:
                </p>
                <div className="flex flex-col lg:flex-row lg:flex-wrap gap-2.5">
                  {displayChoices.map((choice, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.1 + i * 0.08,
                        duration: 0.3,
                        ease: easeOutExpo,
                      }}
                      onClick={() => onChoiceClick(choice)}
                      className="w-full lg:w-auto lg:flex-1 px-4 py-3.5 min-h-[52px] bg-white border-2 border-slate-400 rounded-xl text-[14px] font-bold text-slate-950 shadow-sm break-words leading-snug hover:bg-slate-50 active:scale-[0.95] transition-all duration-200 select-none touch-manipulation lg:px-5 lg:py-3.5 lg:min-h-[52px] lg:bg-gradient-to-r lg:from-[#7C3AED] lg:to-[#8B5CF6] lg:border-2 lg:border-[#7C3AED] lg:font-semibold lg:text-white lg:shadow-[0_2px_8px_rgba(124,58,237,0.3)] lg:hover:bg-gradient-to-r lg:hover:from-[#6D28D9] lg:hover:to-[#7C3AED] lg:hover:border-[#6D28D9] lg:hover:shadow-[0_4px_20px_rgba(124,58,237,0.4)]"
                    >
                      {choice}
                    </motion.button>
                  ))}
                  <motion.button
                    key="other"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.1 + displayChoices.length * 0.08,
                      duration: 0.3,
                      ease: easeOutExpo,
                    }}
                    onClick={() => onChoiceClick('Lainnya...')}
                    className="w-full lg:w-auto lg:flex-1 px-4 py-3.5 min-h-[52px] bg-slate-100 border-2 border-slate-400 border-dashed rounded-xl text-[14px] font-bold text-slate-900 break-words leading-snug hover:bg-slate-200 active:scale-[0.95] transition-all duration-200 select-none touch-manipulation lg:px-5 lg:py-3.5 lg:min-h-[52px] lg:bg-[rgba(124,58,237,0.15)] lg:border-2 lg:border-[rgba(124,58,237,0.5)] lg:font-semibold lg:text-white lg:hover:bg-[rgba(124,58,237,0.25)] lg:hover:border-[rgba(124,58,237,0.7)]"
                  >
                    Lainnya... (ketik sendiri)
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons + timestamp */}
          <div className="flex items-center justify-between ml-1 mt-1">
            <span className="text-[11px] text-slate-500 lg:text-[#64748B]">
              {formatTime(message.timestamp)}
            </span>
            <div
              className={`flex items-center gap-1 transition-opacity duration-200 ${
                showActions ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
              }`}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors lg:text-[#64748B] lg:hover:text-[#CBD5E1] lg:hover:bg-[rgba(124,58,237,0.1)]"
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {isLastAI && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors lg:text-[#64748B] lg:hover:text-[#CBD5E1] lg:hover:bg-[rgba(124,58,237,0.1)]"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // User message
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOutExpo }}
      className="flex items-start gap-2.5 md:gap-3 w-full flex-row-reverse"
    >
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          <span className="text-[10px] md:text-xs font-semibold text-white truncate max-w-[28px]">
            {brandName ? getBrandInitials(brandName) : 'U'}
          </span>
        </div>
        <motion.div
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FCD34D]"
          style={{ boxShadow: '0 0 6px #FCD34D' }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex flex-col gap-1 min-w-0 items-end max-w-[85%] md:max-w-[80%]">
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-[18px_18px_4px_18px] px-4 py-3 shadow-[0_2px_8px_rgba(124,58,237,0.18)] lg:shadow-[0_4px_16px_rgba(124,58,237,0.25)]">
          <p className="text-[14px] md:text-[15px] text-white leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 lg:text-[#64748B] mr-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
});

export default ChatMessage;
