import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
}

const ScrollToBottom = memo(function ScrollToBottom({ visible, onClick }: ScrollToBottomProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-[rgba(124,58,237,0.2)] rounded-[20px] text-xs font-medium text-text-secondary hover:bg-[#232A45] transition-colors duration-200"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          Scroll to bottom
        </motion.button>
      )}
    </AnimatePresence>
  );
});

export default ScrollToBottom;
