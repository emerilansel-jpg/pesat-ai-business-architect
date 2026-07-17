import { memo } from 'react';
import AIAvatar from './AIAvatar';

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <AIAvatar isTyping />
      <div className="bg-[#F2F2F7] border-0 rounded-[18px_18px_18px_4px] px-4 py-3 shadow-sm lg:bg-bg-tertiary lg:border-l-[3px] lg:border-accent-primary lg:rounded-[4px_16px_16px_16px] lg:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#7C3AED] lg:bg-accent-tertiary animate-dot-bounce" />
          <span className="w-2 h-2 rounded-full bg-[#7C3AED] lg:bg-accent-tertiary animate-dot-bounce-delayed" />
          <span className="w-2 h-2 rounded-full bg-[#7C3AED] lg:bg-accent-tertiary animate-dot-bounce-delayed-2" />
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
