import { memo, useState, useRef, useCallback, useEffect, useContext, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Paperclip } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { InputFocusContext } from '../App';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const InputBar = memo(function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { trigger } = useContext(InputFocusContext);

  // Focus textarea when "Lainnya..." is clicked
  useEffect(() => {
    if (trigger > 0) {
      textareaRef.current?.focus();
    }
  }, [trigger]);

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
      className="fixed bottom-0 left-0 right-0 z-50 h-[72px] bg-[rgba(26,31,53,0.85)] backdrop-blur-[16px] border-t border-[rgba(124,58,237,0.15)]"
    >
      <div className="max-w-[900px] mx-auto h-full flex items-center gap-3 px-4">
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
            placeholder="Ceritakan bisnis Anda..."
            disabled={disabled}
            minRows={1}
            maxRows={4}
            className="w-full px-4 py-3 bg-[#0B0F1A] border border-[rgba(124,58,237,0.2)] rounded-full text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[rgba(124,58,237,0.3)] resize-none disabled:opacity-50 transition-all"
          />
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={isEmpty || disabled}
          className={`flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full transition-all duration-200 ${
            isEmpty || disabled
              ? 'bg-[#1A1F35] text-[#64748B] cursor-not-allowed'
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
