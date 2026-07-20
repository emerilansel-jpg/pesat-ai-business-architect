import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  LogOut,
  Lock,
  MessageSquare,
  Image,
  Sparkles,
  Bot,
  Globe,
  Check,
  Zap,
  XCircle,
  ListOrdered,
  Send,
  DollarSign,
} from 'lucide-react';
import { testConnection, sendTextOnlyMessage, generateImage, type TestResult } from '../services/ai';
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  type AdvisorSettings,
  type StepPrompt,
} from '../services/settings';
import { versions } from '../data/versions';

const ADMIN_PASSWORD = 'jdp123';
const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);
  const [settings, setSettings] = useState<AdvisorSettings>(loadSettings());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult & { loading?: boolean }>>({});
  const [imageTestResult, setImageTestResult] = useState<TestResult & { loading?: boolean }>({
    ok: false,
    latency: 0,
  });
  const [stepTestResults, setStepTestResults] = useState<
    Record<number, { response: string; loading: boolean }>
  >({});

  const runStepTest = useCallback(async (step: StepPrompt) => {
    setStepTestResults((prev) => ({ ...prev, [step.step]: { response: '', loading: true } }));
    try {
      const result = await sendTextOnlyMessage(
        step.prompt,
        'Test the prompt above. Respond as if greeting a new user who runs a mid-size e-commerce business in Indonesia.'
      );
      setStepTestResults((prev) => ({
        ...prev,
        [step.step]: { response: result.content || 'No response', loading: false },
      }));
    } catch (e: any) {
      setStepTestResults((prev) => ({
        ...prev,
        [step.step]: { response: `Error: ${e.message || 'Failed'}`, loading: false },
      }));
    }
  }, []);

  const updateStepPrompt = useCallback((step: number, prompt: string) => {
    setSettings((prev) => {
      const nextPrompts = prev.stepPrompts.map((sp) =>
        sp.step === step ? { ...sp, prompt } : sp
      );
      const next = { ...prev, stepPrompts: nextPrompts };
      saveSettings(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const runTest = useCallback(async (type: 'openai' | 'deepseek' | 'tavily') => {
    setTestResults((prev) => ({ ...prev, [type]: { ok: false, latency: 0, loading: true } }));
    const result = await testConnection(type);
    setTestResults((prev) => ({ ...prev, [type]: { ...result, loading: false } }));
  }, []);

  const runImageTest = useCallback(async () => {
    setImageTestResult({ ok: false, latency: 0, loading: true });
    const start = performance.now();
    try {
      await generateImage('a simple test image of a blue water drop', 1);
      const latency = Math.round(performance.now() - start);
      setImageTestResult({ ok: true, latency, loading: false });
    } catch (e: any) {
      const latency = Math.round(performance.now() - start);
      setImageTestResult({ ok: false, latency, loading: false, error: e.message || 'Failed' });
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') setAuthenticated(true);
  }, []);

  const handleLogin = useCallback(() => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setPwError(false);
    } else {
      setPwError(true);
    }
  }, [password]);

  const toggleKeyVisibility = useCallback((key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateSetting = useCallback(<K extends keyof AdvisorSettings>(
    key: K,
    value: AdvisorSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleClearChats = useCallback(() => {
    localStorage.removeItem('chat_messages');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleResetDefaults = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    saveSettings({ ...DEFAULT_SETTINGS });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('admin_auth');
    setAuthenticated(false);
    setPassword('');
  }, []);

  // ---- Password Gate ----
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="w-full max-w-sm bg-[#1A1F35]/80 backdrop-blur-[16px] border border-[rgba(124,58,237,0.2)] rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-[rgba(124,58,237,0.15)] flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#7C3AED]" />
            </div>
            <h1 className="text-xl font-bold text-[#F8FAFC]">Admin Access</h1>
            <p className="text-sm text-[#64748B] text-center">
              Enter password to access settings
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              placeholder="Password"
              className="w-full px-4 py-3 bg-[#0B0F1A] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#F8FAFC] text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
              autoFocus
            />
            {pwError && (
              <p className="text-xs text-red-400">Incorrect password</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-xl text-sm font-semibold text-white hover:shadow-[0_4px_16px_rgba(124,58,237,0.35)] active:scale-[0.98] transition-all"
            >
              Access Settings
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Admin Panel ----
  return (
    <div className="min-h-screen bg-[#0B0F1A] overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[rgba(11,15,26,0.9)] backdrop-blur-[20px] border-b border-[rgba(124,58,237,0.1)]">
        <div className="max-w-[700px] mx-auto h-14 flex items-center justify-between px-4 md:px-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#64748B] hover:text-[#CBD5E1] transition-colors min-h-[44px] px-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>
          <h1 className="text-base font-semibold text-[#F8FAFC]">Settings</h1>
          <Link
            to="/version"
            className="text-xs font-semibold text-[#A78BFA] hover:text-[#8B5CF6] transition-colors"
          >
            v{versions[0]?.version}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[#64748B] hover:text-red-400 transition-colors min-h-[44px] px-2 -mr-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOutExpo }}
        className="max-w-[700px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 pb-20 overflow-y-auto"
      >
        {/* Saved indicator */}
        <div className="h-6 flex justify-center">
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E]"
            >
              <Check className="w-3.5 h-3.5" />
              Saved
            </motion.div>
          )}
        </div>

        {/* ======== TEXT AI PROVIDER ======== */}
        <Section title="Text AI Provider" icon={<Bot className="w-4 h-4 text-[#7C3AED]" />}>
          {/* Provider toggle */}
          <div className="flex gap-2 p-1 bg-[#0B0F1A] rounded-xl">
            {(['openai', 'deepseek'] as const).map((p) => (
              <button
                key={p}
                onClick={() => updateSetting('textProvider', p)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  settings.textProvider === p
                    ? 'bg-[rgba(124,58,237,0.2)] text-[#F8FAFC] border border-[rgba(124,58,237,0.4)]'
                    : 'text-[#64748B] hover:text-[#CBD5E1]'
                }`}
              >
                {p === 'openai' ? 'OpenAI' : 'DeepSeek'}
              </button>
            ))}
          </div>

          {/* OpenAI Model */}
          {settings.textProvider === 'openai' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Model</label>
              <select
                value={settings.openaiModel}
                onChange={(e) => updateSetting('openaiModel', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0B0F1A] border border-[rgba(124,58,237,0.2)] rounded-xl text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors appearance-none"
              >
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-4.5">gpt-4.5</option>
                <option value="gpt-5">gpt-5</option>
              </select>
            </div>
          )}

          {/* DeepSeek Model */}
          {settings.textProvider === 'deepseek' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Model</label>
              <select
                value={settings.deepseekModel}
                onChange={(e) => updateSetting('deepseekModel', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0B0F1A] border border-[rgba(124,58,237,0.2)] rounded-xl text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors appearance-none"
              >
                <option value="deepseek-chat">deepseek-chat</option>
                <option value="deepseek-reasoner">deepseek-reasoner</option>
              </select>
            </div>
          )}

          {/* API Key */}
          <KeyInput
            label={`${settings.textProvider === 'openai' ? 'OpenAI' : 'DeepSeek'} API Key`}
            value={settings.textProvider === 'openai' ? settings.openaiKey : settings.deepseekKey}
            onChange={(v) => updateSetting(settings.textProvider === 'openai' ? 'openaiKey' : 'deepseekKey', v)}
            shown={showKeys[settings.textProvider] || false}
            onToggle={() => toggleKeyVisibility(settings.textProvider)}
          />

          {/* Test Connection */}
          <TestButton
            type={settings.textProvider}
            result={testResults[settings.textProvider]}
            onTest={() => runTest(settings.textProvider)}
          />
        </Section>

        {/* ======== IMAGE AI PROVIDER ======== */}
        <Section title="Image AI Provider" icon={<Image className="w-4 h-4 text-[#7C3AED]" />}>
          <Toggle
            label="OpenAI gpt-image-1"
            enabled={settings.imageProvider === 'openai-image'}
            onChange={(val) => updateSetting('imageProvider', val ? 'openai-image' : 'openai-image')}
          />
          <KeyInput
            label="OpenAI API Key (shared)"
            value={settings.openaiKey}
            onChange={(v) => updateSetting('openaiKey', v)}
            shown={showKeys['image'] || false}
            onToggle={() => toggleKeyVisibility('image')}
          />

          <TestButton
            type="openai"
            label="Test Image Generation"
            result={imageTestResult}
            onTest={runImageTest}
          />
        </Section>

        {/* ======== WEB SEARCH ======== */}
        <Section title="Web Search" icon={<Globe className="w-4 h-4 text-[#7C3AED]" />}>
          <Toggle
            label="Enable Web Search"
            enabled={settings.webSearchEnabled}
            onChange={(val) => updateSetting('webSearchEnabled', val)}
          />
          <KeyInput
            label="Tavily API Key"
            value={settings.tavilyKey}
            onChange={(v) => updateSetting('tavilyKey', v)}
            shown={showKeys['tavily'] || false}
            onToggle={() => toggleKeyVisibility('tavily')}
          />

          <TestButton
            type="tavily"
            label="Test Web Search"
            result={testResults['tavily']}
            onTest={() => runTest('tavily')}
          />
        </Section>

        {/* ======== AUTO IMAGE GENERATION ======== */}
        <Section title="Auto Image Generation" icon={<Sparkles className="w-4 h-4 text-[#7C3AED]" />}>
          <Toggle
            label="Auto-generate visualizations"
            enabled={settings.autoImageGen}
            onChange={(val) => updateSetting('autoImageGen', val)}
          />
          {settings.autoImageGen && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['professional', 'creative', 'minimal', 'data-driven'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateSetting('imageStyle', s)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        settings.imageStyle === s
                          ? 'bg-[rgba(124,58,237,0.15)] border-[rgba(124,58,237,0.4)] text-[#F8FAFC]'
                          : 'bg-[#0B0F1A] border-[rgba(124,58,237,0.15)] text-[#64748B] hover:text-[#CBD5E1]'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Max Images Per Response</label>
                <div className="flex gap-2">
                  {([1, 2] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => updateSetting('maxImagesPerResponse', n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        settings.maxImagesPerResponse === n
                          ? 'bg-[rgba(124,58,237,0.15)] border-[rgba(124,58,237,0.4)] text-[#F8FAFC]'
                          : 'bg-[#0B0F1A] border-[rgba(124,58,237,0.15)] text-[#64748B] hover:text-[#CBD5E1]'
                      }`}
                    >
                      {n} image{n > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </Section>

        {/* ======== STEP PROMPTS ======== */}
        <Section
          title="Step Prompts"
          icon={<ListOrdered className="w-4 h-4 text-[#7C3AED]" />}
        >
          {/* Total cost summary */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0B0F1A] rounded-xl border border-[rgba(124,58,237,0.15)]">
            <DollarSign className="w-4 h-4 text-[#A78BFA]" />
            <span className="text-xs text-[#64748B]">Estimated total cost per conversation:</span>
            <span className="text-xs font-semibold text-[#F8FAFC]">~$0.20 - $0.35</span>
          </div>

          {/* Each step */}
          <div className="space-y-3">
            {settings.stepPrompts.map((sp) => (
              <div
                key={sp.step}
                className="bg-[#0B0F1A] rounded-xl border border-[rgba(124,58,237,0.12)] overflow-hidden"
              >
                {/* Step header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(124,58,237,0.08)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[rgba(124,58,237,0.2)] flex items-center justify-center text-[10px] font-bold text-[#A78BFA]">
                      {sp.step}
                    </span>
                    <span className="text-sm font-medium text-[#CBD5E1]">
                      {sp.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#64748B] bg-[rgba(124,58,237,0.1)] px-2 py-0.5 rounded-full">
                    {sp.costPer1K}
                  </span>
                </div>

                {/* Prompt editor */}
                <div className="p-3">
                  <textarea
                    value={sp.prompt}
                    onChange={(e) => updateStepPrompt(sp.step, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1A1F35] border border-[rgba(124,58,237,0.15)] rounded-lg text-xs text-[#CBD5E1] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-colors resize-vertical"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => runStepTest(sp)}
                      disabled={stepTestResults[sp.step]?.loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(124,58,237,0.2)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.1)] hover:border-[rgba(124,58,237,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stepTestResults[sp.step]?.loading ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      {stepTestResults[sp.step]?.loading ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                  {/* Test response */}
                  {stepTestResults[sp.step]?.response && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 p-3 bg-[#1A1F35] rounded-lg border border-[rgba(124,58,237,0.1)]"
                    >
                      <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1">
                        AI Response:
                      </p>
                      <p className="text-xs text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">
                        {stepTestResults[sp.step].response}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ======== ACTIONS ======== */}
        <Section title="Actions" icon={<MessageSquare className="w-4 h-4 text-[#7C3AED]" />}>
          <div className="flex flex-col gap-2">
            <ActionButton
              icon={<Trash2 className="w-4 h-4" />}
              label="Clear All Chats"
              danger
              onClick={handleClearChats}
            />
            <ActionButton
              icon={<RotateCcw className="w-4 h-4" />}
              label="Reset to Defaults"
              onClick={handleResetDefaults}
            />
            <ActionButton
              icon={<LogOut className="w-4 h-4" />}
              label="Logout"
              onClick={handleLogout}
            />
          </div>
        </Section>

        <div className="h-8" />
      </motion.div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1F35]/60 backdrop-blur-[12px] border border-[rgba(124,58,237,0.12)] rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-[rgba(124,58,237,0.08)]">
        {icon}
        <h2 className="text-sm font-semibold text-[#F8FAFC]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="w-full flex items-center justify-between py-2"
    >
      <span className="text-sm text-[#CBD5E1]">{label}</span>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-[#7C3AED]' : 'bg-[#1A1F35] border border-[rgba(124,58,237,0.2)]'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
}

function KeyInput({
  label,
  value,
  onChange,
  shown,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter API key"
          className="w-full px-3 py-2.5 pr-10 bg-[#0B0F1A] border border-[rgba(124,58,237,0.2)] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-colors"
        />
        <button
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#CBD5E1] transition-colors"
        >
          {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        danger
          ? 'text-red-400 hover:bg-[rgba(239,68,68,0.1)] bg-[rgba(239,68,68,0.05)]'
          : 'text-[#CBD5E1] hover:bg-[rgba(124,58,237,0.1)] bg-[#0B0F1A]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TestButton({
  type,
  label,
  result,
  onTest,
}: {
  type: string;
  label?: string;
  result?: TestResult & { loading?: boolean };
  onTest: () => void;
}) {
  const displayLabel = label || `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Connection`;
  const isLoading = result?.loading;
  const isOk = result?.ok;
  const hasResult = result && !isLoading;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onTest}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
          isLoading
            ? 'opacity-60 cursor-not-allowed border-[rgba(124,58,237,0.2)] text-[#64748B]'
            : hasResult && isOk
            ? 'border-[rgba(34,197,94,0.3)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.1)]'
            : hasResult
            ? 'border-[rgba(239,68,68,0.3)] text-red-400 hover:bg-[rgba(239,68,68,0.1)]'
            : 'border-[rgba(124,58,237,0.2)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.1)] hover:border-[rgba(124,58,237,0.4)]'
        }`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : hasResult && isOk ? (
          <Check className="w-4 h-4" />
        ) : hasResult ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        {isLoading ? 'Testing...' : displayLabel}
      </button>
      {hasResult && (
        <span className={`text-xs font-medium ${isOk ? 'text-[#22C55E]' : 'text-red-400'}`}>
          {isOk ? `${result.latency}ms` : 'Failed'}
        </span>
      )}
    </div>
  );
}