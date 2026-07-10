import { memo } from 'react';

interface AIAvatarProps {
  size?: 'sm' | 'md';
  isTyping?: boolean;
}

const AIAvatar = memo(function AIAvatar({ size = 'md', isTyping = false }: AIAvatarProps) {
  const sizeClasses = size === 'sm' ? 'w-9 h-9' : 'w-[36px] h-[36px]';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const dotPosition = size === 'sm' ? '-bottom-0.5 -right-0.5' : '-bottom-0.5 -right-0.5';

  return (
    <div className={`relative ${sizeClasses} flex-shrink-0`}>
      <div
        className={`${sizeClasses} accent-gradient rounded-full flex items-center justify-center ${
          isTyping ? 'animate-avatar-glow' : ''
        }`}
      >
        <span className={`${textSize} font-semibold text-white tracking-wide`}>AI</span>
      </div>
      {/* Online dot */}
      <div
        className={`absolute ${dotPosition} ${dotSize} rounded-full bg-status-online border-2 border-bg-primary animate-pulse-online`}
      />
    </div>
  );
});

export default AIAvatar;
