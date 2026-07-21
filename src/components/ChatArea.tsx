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
  const prevMessagesLenRef = useRef(0);
  const prevIsTypingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Detect mobile once — used to gate aggressive auto-scroll so the AI's
  // long answer doesn't yank the viewport down on phones.
  const isMobileViewport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Auto-scroll behavior (UX/CRO tuned):
  // - While the user is waiting (typing indicator ON): always smooth-scroll to bottom
  //   so the typing indicator stays visible.
  // - When a NEW AI message just landed (typing went true->false AND message count grew):
  //   on desktop, scroll to bottom as before; on mobile, leave the scroll position alone
  //   so the user can read from the top. A "jump to latest" pill stays accessible.
  // - When the user sends a new message (length grew but typing didn't flip): scroll to bottom.
  useEffect(() => {
    const len = messages.length;
    const grew = len > prevMessagesLenRef.current;
    const typingTurnedOff = prevIsTypingRef.current && !isTyping;
    const userJustSent = grew && !typingTurnedOff;

    if (isTyping) {
      // typing indicator visible — keep it in view
      scrollToBottom();
    } else if (userJustSent) {
      // user sent a new message — scroll their bubble into view
      scrollToBottom();
    } else if (typingTurnedOff && grew) {
      // AI just finished an answer
      if (!isMobileViewport()) {
        scrollToBottom();
      }
      // On mobile: do nothing. Let the user scroll at their own pace.
      // The ScrollToBottom pill appears automatically if they're not near the end.
    }

    prevMessagesLenRef.current = len;
    prevIsTypingRef.current = isTyping;
  }, [messages.length, isTyping, scrollToBottom, isMobileViewport]);

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden lg:block">
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
        className="relative z-[1] h-full overflow-y-auto scrollbar-chat bg-white lg:bg-transparent"
      >
        <div
          className="max-w-[900px] mx-auto px-3 py-3 lg:px-4 lg:py-8 flex flex-col gap-2.5 lg:gap-4"
          style={{ paddingBottom: 'var(--mobile-panel-height, 0)' }}
        >
          <AnimatePresence>
            {messages.map((message, index) => {
              // Count how many AI messages came before (inclusive) — used to
              // trigger the fallback WhatsApp CTA from the 3rd AI reply onward.
              const aiMessageIndex = messages
                .slice(0, index + 1)
                .filter((m) => m.role === 'assistant').length;
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLastAI={index === lastAIIndex}
                  aiMessageIndex={aiMessageIndex}
                  onRetry={index === lastAIIndex ? onRetry : undefined}
                  onChoiceClick={onChoiceClick}
                />
              );
            })}
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
