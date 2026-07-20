import { memo } from 'react';
import { motion } from 'framer-motion';

interface AIAvatarProps {
  size?: 'sm' | 'md';
  isTyping?: boolean;
}

const AIAvatar = memo(function AIAvatar({ size = 'md', isTyping = false }: AIAvatarProps) {
  const sizeClasses = size === 'sm' ? 'w-9 h-9' : 'w-[36px] h-[36px]';
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const dotPosition = size === 'sm' ? '-bottom-0.5 -right-0.5' : '-bottom-0.5 -right-0.5';

  return (
    <div className={`relative ${sizeClasses} flex-shrink-0`}>
      <div
        className={`${sizeClasses} accent-gradient rounded-full flex items-center justify-center ${
          isTyping ? 'animate-avatar-glow' : ''
        }`}
      >
        <motion.span
          className={`font-bold text-white ${size === 'sm' ? 'text-[14px]' : 'text-[16px]'}`}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
          style={{ display: 'inline-block', transformOrigin: 'center' }}
        >
          P
        </motion.span>
      </div>
      {/* Online dot */}
      <div
        className={`absolute ${dotPosition} ${dotSize} rounded-full bg-status-online border-2 border-white animate-pulse-online`}
      />
    </div>
  );
});

export default AIAvatar;
