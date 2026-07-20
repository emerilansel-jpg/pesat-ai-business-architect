import { versions, type VersionEntry } from '../data/versions';
import LogoIcon from '../components/LogoIcon';
import { Link } from 'react-router-dom';

function Badge({ type }: { type: string }) {
  const color =
    type === 'MAJOR'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : type === 'FEATURE'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : type === 'FIX'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : 'bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/30';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${color}`}
    >
      {type}
    </span>
  );
}

export default function VersionPage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#F8FAFC]">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[rgba(11,15,26,0.8)] backdrop-blur-[20px] border-b border-[rgba(124,58,237,0.1)]">
        <div className="max-w-[900px] mx-auto h-full flex items-center justify-between px-4 md:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <LogoIcon />
            <span className="text-xl font-bold tracking-tight">
              pesat<span className="text-[#7C3AED]">.ai</span>
            </span>
          </Link>
          <span className="text-sm text-[#CBD5E1]">Version History</span>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 md:px-6">
        <div className="max-w-[700px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Version History</h1>
            <p className="text-[#94A3B8]">
              Riwayat perubahan dan pembaruan Pesat AI Business Architect.
            </p>
          </div>

          <div className="space-y-6">
            {versions.map((v: VersionEntry) => (
              <div
                key={v.version}
                className="relative rounded-2xl border border-[rgba(124,58,237,0.15)] bg-[#12121F] p-5 md:p-6"
              >
                {v.latest && (
                  <span className="absolute -top-3 right-4 inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#7C3AED] text-white text-xs font-bold">
                    LATEST
                  </span>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-[#F8FAFC]">
                    v{v.version}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge type={v.type} />
                    <span className="text-sm text-[#64748B]">{v.date}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {v.changes.map((change, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-[#CBD5E1] leading-relaxed"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 min-w-[6px] rounded-full bg-[#7C3AED]" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[rgba(124,58,237,0.1)] bg-[#0B0F1A]">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between text-sm text-[#64748B]">
          <span>Pesat AI Business Architect</span>
          <Link to="/" className="hover:text-[#A78BFA] transition-colors">
            Kembali ke Chat
          </Link>
        </div>
      </footer>
    </div>
  );
}
