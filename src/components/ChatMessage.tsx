import { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, ImageOff } from 'lucide-react';
import { marked } from 'marked';
import AIAvatar from './AIAvatar';
import { parseInlineImages, buildDallePrompt } from '../services/visualization';
import { generateImage } from '../services/ai';
import { loadSettings } from '../services/settings';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export interface MessageImage {
  url: string;
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
  onRetry?: () => void;
  onChoiceClick?: (choice: string) => void;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

/** Deterministic hash for consistent image URLs */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Generate deterministic Pollinations URL — same desc = same URL */
function getPollinationsUrl(description: string, index: number): string {
  const seed = hashString(description) + index * 1000;
  const clean = description.replace(/\[|\]/g, '').substring(0, 900);
  const encoded = encodeURIComponent(clean);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

const ChatMessage = memo(function ChatMessage({
  message,
  isLastAI = false,
  onRetry,
  onChoiceClick,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [imageGenerating, setImageGenerating] = useState<Record<number, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const isAI = message.role === 'assistant';

  // Parse choices from content
  const { cleanText, choices } = isAI
    ? parseChoices(message.content)
    : { cleanText: message.content, choices: [] };
  const displayChoices = choices.filter((c) => c !== 'Lainnya...');

  // Parse inline images for AI messages
  const { segments } = useMemo(() => {
    return isAI ? parseInlineImages(cleanText) : { segments: [] };
  }, [cleanText, isAI]);

  // Generate DALL-E 3 images asynchronously, falling back to Pollinations
  useEffect(() => {
    let cancelled = false;

    async function generateImages() {
      const generating: Record<number, boolean> = {};
      segments.forEach((seg, i) => {
        if (seg.type === 'image') generating[i] = true;
      });
      setImageGenerating(generating);

      const urls: Record<number, string> = {};

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.type !== 'image') continue;

        try {
          const settings = loadSettings();
          if (!settings.autoImageGen) {
            urls[i] = getPollinationsUrl(seg.description || '', i);
          } else {
            const prompt = buildDallePrompt(seg.description || '', settings.imageStyle);
            const result = await generateImage(prompt, 1);
            urls[i] = result.imageUrls[0] || getPollinationsUrl(seg.description || '', i);
          }
        } catch {
          urls[i] = getPollinationsUrl(seg.description || '', i);
        }
      }

      if (!cancelled) {
        setImageUrls(urls);
        setImageGenerating({});
      }
    }

    generateImages();
    return () => { cancelled = true; };
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
        className="flex items-start gap-2.5 md:gap-3 w-full"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex-shrink-0 pt-1">
          <AIAvatar />
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1 max-w-[85%] md:max-w-[80%]">
          {/* Message bubble */}
          <div className="bg-[#1A1F35]/80 backdrop-blur-[12px] border-l-[3px] border-[#7C3AED] rounded-[4px_16px_16px_16px] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            {/* Render segments: text (markdown) and images (inline) */}
            {segments.map((seg, segIdx) => {
              if (seg.type === 'text') {
                return (
                  <div
                    key={segIdx}
                    className="markdown-body text-[14px] md:text-[15px] text-[#CBD5E1] leading-relaxed"
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
              return (
                <div
                  key={segIdx}
                  className="my-4 rounded-xl overflow-hidden border border-[rgba(124,58,237,0.2)] bg-[#0B0F1A]"
                >
                  {/* Loading state */}
                  {(!url || isGenerating || (!hasLoaded && !hasError)) && (
                    <div className="w-full h-[180px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#111827] to-[#0B0F1A]">
                      <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
                      <span className="text-[11px] text-[#64748B]">
                        Menghasilkan visualisasi...
                      </span>
                    </div>
                  )}

                  {/* Error state */}
                  {hasError && (
                    <div className="w-full h-[120px] flex flex-col items-center justify-center gap-2 bg-[#111827]">
                      <ImageOff className="w-6 h-6 text-[#64748B]" />
                      <span className="text-[11px] text-[#64748B]">Gagal memuat gambar</span>
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
                  {!hasError && (
                    <img
                      src={url}
                      alt={seg.description}
                      className={`w-full object-cover transition-opacity duration-700 ${
                        hasLoaded ? 'opacity-100 max-h-[260px]' : 'opacity-0 h-0'
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
                  <div className="flex items-center justify-between px-3 py-2 bg-[#111827]">
                    <span className="px-2 py-0.5 bg-[rgba(124,58,237,0.15)] border border-[rgba(124,58,237,0.25)] rounded-full text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider">
                      Visualisasi AI
                    </span>
                    <span className="text-[11px] text-[#64748B] truncate ml-2 max-w-[200px]">
                      {seg.description.substring(0, 50)}...
                    </span>
                  </div>
                </div>
              );
            })}

            {/* ===== CHOICE BUTTONS — onClick (reliable) ===== */}
            {choices.length > 0 && onChoiceClick && (
              <div className="mt-4 pt-3 border-t border-[rgba(124,58,237,0.15)]">
                <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-2.5">
                  Pilih jawaban:
                </p>
                <div className="flex flex-wrap gap-2.5">
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
                      className="px-5 py-3.5 min-h-[52px] bg-gradient-to-r from-[rgba(124,58,237,0.15)] to-[rgba(139,92,246,0.1)] border-2 border-[rgba(124,58,237,0.4)] rounded-xl text-[14px] font-semibold text-[#F8FAFC] shadow-[0_2px_8px_rgba(124,58,237,0.15)] hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#8B5CF6] hover:border-[#7C3AED] hover:shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:text-white active:scale-[0.95] transition-all duration-200 cursor-pointer select-none touch-manipulation"
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
                    className="px-5 py-3.5 min-h-[52px] bg-[rgba(124,58,237,0.05)] border-2 border-[rgba(124,58,237,0.2)] border-dashed rounded-xl text-[14px] font-medium text-[#A78BFA] hover:bg-[rgba(124,58,237,0.15)] hover:border-[rgba(124,58,237,0.5)] active:scale-[0.95] transition-all duration-200 cursor-pointer select-none touch-manipulation"
                  >
                    Lainnya... (ketik sendiri)
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons + timestamp */}
          <div className="flex items-center justify-between ml-1 mt-1">
            <span className="text-[11px] text-[#64748B]">
              {formatTime(message.timestamp)}
            </span>
            <div
              className={`flex items-center gap-1 transition-opacity duration-200 ${
                showActions ? 'opacity-100' : 'opacity-0 md:opacity-0'
              }`}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[#64748B] hover:text-[#CBD5E1] hover:bg-[rgba(124,58,237,0.1)] transition-colors"
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
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[#64748B] hover:text-[#CBD5E1] hover:bg-[rgba(124,58,237,0.1)] transition-colors"
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
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
        <span className="text-xs font-semibold text-white">U</span>
      </div>
      <div className="flex flex-col gap-1 min-w-0 items-end max-w-[85%] md:max-w-[80%]">
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-[16px_16px_4px_16px] px-4 py-3 shadow-[0_4px_16px_rgba(124,58,237,0.25)]">
          <p className="text-[14px] md:text-[15px] text-white leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="text-[11px] text-[#64748B] mr-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
});

export default ChatMessage;
