import { memo, useState, useRef, useCallback, useEffect, useContext, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Paperclip } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { InputFocusContext } from '../App';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  prefill?: string;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const InputBar = memo(function InputBar({ onSend, disabled = false, prefill = '' }: InputBarProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { trigger } = useContext(InputFocusContext);

  // Focus textarea when "Lainnya..." is clicked, or apply prefill when provided
  useEffect(() => {
    if (trigger > 0) {
      if (prefill) {
        setInput(prefill);
        // clear after apply so user edits are preserved
        setTimeout(() => {
          textareaRef.current?.focus();
          // move cursor to end
          const el = textareaRef.current;
          if (el) {
            const len = el.value.length;
            el.setSelectionRange(len, len);
          }
        }, 50);
      } else {
        textareaRef.current?.focus();
      }
    }
  }, [trigger, prefill]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [input, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const isEmpty = input.trim().length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 h-auto lg:h-[72px] bg-white lg:bg-[rgba(26,31,53,0.85)] backdrop-blur-[16px] border-t border-slate-100/80 lg:border-[rgba(124,58,237,0.15)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-[900px] mx-auto h-full flex items-end gap-2 lg:gap-3 px-3 py-2 lg:px-4 lg:items-center lg:py-0">
        {/* Attach icon (hidden on mobile) */}
        <button className="hidden md:flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full text-[#64748B] hover:text-[#CBD5E1] hover:bg-[rgba(124,58,237,0.1)] transition-all">
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <TextareaAutosize
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ceritakan bisnis Anda… contoh: Brand saya adalah X, domain X.com, produk utama X..."
            disabled={disabled}
            minRows={1}
            maxRows={4}
            className="w-full px-4 py-2.5 bg-[#F2F2F7] border border-transparent rounded-[22px] lg:rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[rgba(124,58,237,0.3)] resize-none disabled:opacity-50 transition-all lg:bg-[#0B0F1A] lg:border-[rgba(124,58,237,0.2)] lg:text-[#F8FAFC] lg:placeholder:text-[#64748B]"
          />
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={isEmpty || disabled}
          className={`flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full transition-all duration-200 ${
            isEmpty || disabled
              ? 'bg-[#E5E7EB] text-slate-400 cursor-not-allowed lg:bg-[#1A1F35] lg:text-[#64748B]'
              : 'bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_24px_rgba(124,58,237,0.5)]'
          }`}
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
});

export default InputBar;
