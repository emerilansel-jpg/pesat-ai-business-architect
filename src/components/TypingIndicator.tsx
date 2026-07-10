import { memo } from 'react';
import AIAvatar from './AIAvatar';

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <AIAvatar isTyping />
      <div className="bg-bg-tertiary backdrop-blur-[12px] border-l-[3px] border-accent-primary rounded-[4px_16px_16px_16px] px-5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent-tertiary animate-dot-bounce" />
          <span className="w-2 h-2 rounded-full bg-accent-tertiary animate-dot-bounce-delayed" />
          <span className="w-2 h-2 rounded-full bg-accent-tertiary animate-dot-bounce-delayed-2" />
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
