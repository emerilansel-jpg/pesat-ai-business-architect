import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Message } from './ChatMessage';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ScrollToBottom from './ScrollToBottom';

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onRetry?: () => void;
  onChoiceClick?: (choice: string) => void;
}

const ChatArea = memo(function ChatArea({ messages, isTyping, onRetry, onChoiceClick }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping, scrollToBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Find the last AI message for action buttons
  const lastAIMessageIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant');
  const lastAIIndex =
    lastAIMessageIndex >= 0 ? messages.length - 1 - lastAIMessageIndex : -1;

  return (
    <div className="relative h-full">
      {/* Ambient Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-orb-drift-1"
          style={{
            top: '-200px',
            left: '-100px',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-orb-drift-2"
          style={{
            bottom: '100px',
            right: '-100px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Chat Content */}
      <div
        ref={scrollRef}
        className="relative z-[1] h-full overflow-y-auto scrollbar-chat"
      >
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLastAI={index === lastAIIndex}
                onRetry={index === lastAIIndex ? onRetry : undefined}
                onChoiceClick={onChoiceClick}
              />
            ))}
          </AnimatePresence>

          {isTyping && <TypingIndicator />}

          {/* Bottom spacer */}
          <div className="h-2" />
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      <ScrollToBottom visible={showScrollButton} onClick={scrollToBottom} />
    </div>
  );
});

export default ChatArea;
