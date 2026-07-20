import { memo } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import LogoIcon from './LogoIcon';
import { versions } from '../data/versions';

const Navbar = memo(function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[rgba(11,15,26,0.8)] backdrop-blur-[20px] border-b border-[rgba(124,58,237,0.1)] max-lg:bg-white/90 max-lg:border-slate-100">
      <div className="max-w-[900px] mx-auto h-full flex items-center justify-between px-4 md:px-6">
        {/* Logo Group */}
        <Link to="/" className="group flex items-center gap-2.5">
          <LogoIcon />
          <span className="hidden md:block text-xl font-bold text-[#F8FAFC] tracking-tight max-lg:text-slate-900">
            pesat<span className="text-[#7C3AED]">.ai</span>
          </span>
        </Link>

        {/* Center: AI Advisor Label + Status */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A78BFA] max-lg:text-[#7C3AED]" />
            <span className="text-sm font-medium text-[#CBD5E1] max-lg:text-slate-600">AI Business Architect</span>
          </div>

          <div className="hidden sm:block w-px h-5 bg-[#232A45] max-lg:bg-slate-200" />

          {/* Online badge */}
          <div className="flex items-center gap-1.5 pr-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
            </span>
            <span className="text-xs font-medium text-[#64748B] max-lg:text-slate-500">Online</span>
          </div>

          {/* Settings gear → admin */}
          <Link
            to="/admin"
            className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg text-[#64748B] hover:text-[#8B5CF6] hover:bg-[rgba(124,58,237,0.1)] transition-all duration-200 max-lg:text-slate-500 max-lg:hover:text-[#7C3AED] max-lg:hover:bg-slate-100"
            title="Admin Settings"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>

          {/* Version link */}
          <Link
            to="/version"
            className="flex items-center justify-center h-7 px-2 rounded-full text-[10px] font-semibold text-[#A78BFA] bg-[rgba(124,58,237,0.15)] hover:bg-[rgba(124,58,237,0.25)] transition-all duration-200 max-lg:text-[#7C3AED] max-lg:bg-[rgba(124,58,237,0.1)]"
            title="Version History"
          >
            v{versions[0]?.version}
          </Link>
        </div>
      </div>
    </header>
  );
});

export default Navbar;
