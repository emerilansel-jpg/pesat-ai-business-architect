import { memo } from 'react';

interface SuggestionChipProps {
  label: string;
  onClick: () => void;
  delay?: number;
}

const SuggestionChip = memo(function SuggestionChip({ label, onClick, delay = 0 }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-[18px] py-[10px] bg-[#1A1F35] border border-[rgba(124,58,237,0.2)] rounded-[20px] text-[13px] font-normal text-[#CBD5E1] transition-all duration-200 ease-out hover:bg-[#232A45] hover:border-[rgba(124,58,237,0.5)] hover:text-[#F8FAFC] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.3)] active:scale-[0.96] text-left leading-relaxed"
      style={{ animationDelay: `${delay}s` }}
    >
      {label}
    </button>
  );
});

export default SuggestionChip;
