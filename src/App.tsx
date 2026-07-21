import { useState, useCallback, useEffect, useRef, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';
import Navbar from './components/Navbar';
import ActivityPanel from './components/ActivityPanel';
import { ActivityProvider, useActivity, type ActivityIcon, type ActivityStage } from './contexts/ActivityContext';
import { type Message, type MessageImage } from './components/ChatMessage';
import Admin from './pages/Admin';
import Version from './pages/Version';
import { sendMessage, webSearch, generateImage } from './services/ai';
import { getInlineVizPrompt, parseInlineImages, buildDallePrompt, getPollinationsUrl } from './services/visualization';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './services/settings';
import { fetchServerConfig } from './services/serverConfig';
import { getActivityMessage, generateActivityMessages } from './services/activityMessages';
import { MAIN_SYSTEM_PROMPT } from './services/mainPrompt';

// Context for input focus
export const InputFocusContext = createContext<{
  trigger: number;
  increment: () => void;
}>({
  trigger: 0,
  increment: () => {},
});

const FIRST_MESSAGE_FOCUS = `\n\n## FOKUS PESAN PERTAMA (WAJIB)\nIni adalah pesan pertama dari user. JANGAN langsung kasih solusi final. JANGAN berpanjang-panjang.\nSapa user dengan ramah, perkenalkan diri sebagai Pesat AI Advisor, lalu tanya challenge utama bisnis mereka saat ini.\nAkhiri dengan pilihan multiple choice PERSIS seperti ini:\n[CHOICE:Tingkatkan omset miliaran|Hemat ratusan juta|Brand saya dipercaya & muncul di AI Search|Cegah Fraud ratusan juta|Business Intelligence|Forecast (prediksi) arah usaha|Lainnya (ketik sendiri)]\n\nPanjang maksimal 2-3 paragraf pendek.`;

const BRAND_PROMPT = `\n\nBRAND DETECTION: If the user mentions their brand/business name, extract it and append [BRAND:Name] at the very end of your response. Do not mention this tag to the user.`;

/** Show fun narrative logs while a promise is running. */
function runNarrative<T>(
  promise: Promise<T>,
  logs: { message: string; icon: ActivityIcon }[],
  addLog: (message: string, icon?: ActivityIcon) => void,
  markLastDone: () => void
): Promise<T> {
  let index = 0;
  if (logs.length > 0) {
    addLog(logs[0].message, logs[0].icon);
    index = 1;
  }
  const interval = window.setInterval(() => {
    if (index < logs.length) {
      markLastDone();
      addLog(logs[index].message, logs[index].icon);
      index++;
    }
  }, 1300);
  return promise.finally(() => {
    window.clearInterval(interval);
    if (index > 0) markLastDone();
  });
}

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const { addLog, updateLastLog, markLastDone, finishLog, clearLogs, setProcessing, setStage } =
    useActivity();
  const lastUserMessageRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const activityOverridesRef = useRef<Partial<Record<ActivityStage, string>>>({});

  useEffect(() => {
    lastUserMessageRef.current = lastUserMessage;
  }, [lastUserMessage]);

  useEffect(() => {
    fetchServerConfig().then((serverConfig) => {
      if (!serverConfig) return;
      const localSettings = loadSettings();
      const serverUpdated = new Date(serverConfig.updatedAt).getTime();
      const localUpdated = localSettings.updatedAt ? new Date(localSettings.updatedAt).getTime() : 0;
      if (serverUpdated <= localUpdated) return;

      const next = {
        ...localSettings,
        textProvider: serverConfig.textProvider,
        imageProvider: serverConfig.imageProvider,
        openaiModel: serverConfig.openaiModel,
        deepseekModel: serverConfig.deepseekModel,
        autoImageGen: serverConfig.autoImageGen,
        imageStyle: serverConfig.imageStyle,
        maxImagesPerResponse: serverConfig.maxImagesPerResponse,
        webSearchEnabled: serverConfig.webSearchEnabled,
        stepPrompts: serverConfig.stepPrompts.length ? serverConfig.stepPrompts : localSettings.stepPrompts,
        promptVersion: serverConfig.promptVersion,
        updatedAt: serverConfig.updatedAt,
      };
      saveSettings(next);
    });
  }, []);

  const focusInput = useCallback(() => {
    setFocusTrigger((t) => t + 1);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      clearLogs();
      setProcessing(true);
      setShowWelcome(false);

      const trimmed = content.trim();
      activityOverridesRef.current = {};
      generateActivityMessages(trimmed)
        .then((msgs) => {
          if (msgs) activityOverridesRef.current = msgs;
        })
        .catch(() => {});

      // Add user message
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLastUserMessage(trimmed);
      setIsTyping(true);

      addLog(getActivityMessage('thinking', trimmed, activityOverridesRef.current), 'thinking');
      setStage('thinking');
      const settings = loadSettings();

      try {
        // Build API messages
        const historyMessages = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        const finalApiMessages = [
          ...historyMessages,
          { role: 'user' as const, content: trimmed },
        ];

        // Optional web search context
        let searchContext = '';
        try {
          if (settings.webSearchEnabled && settings.tavilyKey) {
            setStage('searching');
              updateLastLog(getActivityMessage('searching', trimmed, activityOverridesRef.current), 'search');
            const searchResult = await webSearch(trimmed);
            if (
              searchResult &&
              (searchResult.answer || searchResult.results?.length)
            ) {
              const snippets =
                searchResult.results
                  ?.slice(0, 3)
                  .map(
                    (r: any) =>
                      `- ${r.title}: ${r.content || r.snippet || r.url}`
                  )
                  .join('\n') || '';
              searchContext = `\n\n[WEB SEARCH RESULTS]\n${searchResult.answer || ''}\n${snippets}\n\nGunakan informasi di atas sebagai tambahan konteks. Jika informasi tidak relevan atau tidak bisa diverifikasi, abaikan dan berdasarkan analisis anda sendiri. Jangan mengklaim fakta yang tidak bisa dibuktikan.\n`;
            }
            setStage('analyzing');
            updateLastLog(getActivityMessage('analyzing', trimmed, activityOverridesRef.current), 'analyze');
          } else {
            setStage('analyzing');
            updateLastLog(getActivityMessage('analyzing', trimmed, activityOverridesRef.current), 'analyze');
          }
        } catch (searchErr) {
          // Ignore web search errors; proceed without it
          setStage('analyzing');
          updateLastLog(getActivityMessage('analyzing', trimmed, activityOverridesRef.current), 'analyze');
        }

        // Add inline visualization + choice system prompt
        const inlineVizPrompt = getInlineVizPrompt();
        const choicePrompt =
          "\n\nCRITICAL: Every response MUST end with clickable multiple choice options using this exact format: [CHOICE:option 1|option 2|option 3]. Options must be concise (2-5 words each). Always include a 'Lainnya...' option as the last choice so the user can type freely. CRITICAL: If the user clicks a choice like 'Saya jawab semuanya sekarang' or 'Saya jawab satu per satu' without providing the actual data, do NOT assume the answers. Ask the user explicitly for each required value.";

        // For the very first user message, use a focused opening that asks for the
        // primary business challenge and supplies the exact choices. Skip the generic
        // choice/instruction prompts so they don't conflict with the first-message choices.
        const isFirstUserMessage =
          messages.filter((m) => m.role === 'assistant').length === 0;
        const systemPrompt = isFirstUserMessage
          ? MAIN_SYSTEM_PROMPT +
            '\n\n' +
            FIRST_MESSAGE_FOCUS +
            BRAND_PROMPT +
            searchContext
          : MAIN_SYSTEM_PROMPT +
            (inlineVizPrompt || '') +
            searchContext +
            choicePrompt +
            BRAND_PROMPT;

        const apiMessagesWithSystem: Array<{
          role: string;
          content: string;
        }> = [...finalApiMessages];
        apiMessagesWithSystem.unshift({
          role: 'system',
          content: systemPrompt,
        });

        setStage('crafting');
        addLog(getActivityMessage('crafting', trimmed, activityOverridesRef.current), 'sparkle');

        const isMobileDevice =
          typeof navigator !== 'undefined' &&
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
        const requestTimeoutMs = isMobileDevice ? 30000 : 60000;
        const maxAttempts = isMobileDevice ? 2 : 1;

        async function tryGenerateResponse(
          apiMessages: Array<{ role: string; content: string }>,
          timeoutMs: number
        ): Promise<{ text: string; images: MessageImage[] }> {
          const controller = new AbortController();
          const requestTimeout = window.setTimeout(
            () => controller.abort(),
            timeoutMs
          );
          const response = await sendMessage(apiMessages, {
            signal: controller.signal,
          });
          window.clearTimeout(requestTimeout);
          const text = response.content || 'Maaf, terjadi kesalahan.';

          let generatedImages: MessageImage[] = [];
          if (settings.autoImageGen) {
            const { segments } = parseInlineImages(text);
            const imageSegments = segments.filter(
              (s): s is { type: 'image'; description: string } =>
                s.type === 'image'
            );
            if (imageSegments.length > 0) {
              setStage('image');
              const imagePromises = imageSegments.map((seg, idx) => {
                const prompt = buildDallePrompt(seg.description, settings.imageStyle);
                return generateImage(prompt, 1)
                  .then((result) => ({
                    url: result.imageUrls[0] || getPollinationsUrl(seg.description, idx),
                    description: seg.description,
                  }))
                  .catch(() => ({
                    url: getPollinationsUrl(seg.description, idx),
                    description: seg.description,
                  }));
              });
              const narrativeLogs = [
                { message: 'Contacting Jaka Sembung (Design expert)...', icon: 'image' as ActivityIcon },
                { message: 'Meeting dimulai...', icon: 'meeting' as ActivityIcon },
                { message: 'Ngopi dulu bentar...', icon: 'coffee' as ActivityIcon },
                { message: 'Dipanggil istri...', icon: 'thinking' as ActivityIcon },
                { message: 'Meeting hampir selesai...', icon: 'meeting' as ActivityIcon },
                { message: 'Assign task ke Jaka Sembung untuk design...', icon: 'design' as ActivityIcon },
                { message: 'Sri Asih dapat task review...', icon: 'code' as ActivityIcon },
                { message: 'Tukang bubur depan juga dikasih task...', icon: 'deploy' as ActivityIcon },
              ];
              generatedImages = await runNarrative(Promise.all(imagePromises), narrativeLogs, addLog, markLastDone);
            }
          }
          return { text, images: generatedImages };
        }

        let lastError: any = null;
        let aiText = 'Maaf, terjadi kesalahan.';
        let images: MessageImage[] = [];

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const result = await tryGenerateResponse(apiMessagesWithSystem, requestTimeoutMs);
            aiText = result.text;
            images = result.images;
            lastError = null;
            break;
          } catch (err) {
            lastError = err;
            console.error(`Chat error (attempt ${attempt}):`, err);
            if (attempt < maxAttempts) {
              addLog('Sinyal lemot, tim virtual coba ulang... 🔄', 'thinking');
              setStage('thinking');
            }
          }
        }

        if (lastError) throw lastError;

        // Add AI message
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
          images,
        };
        setMessages((prev) => [...prev, aiMsg]);

        markLastDone();
        setStage('success');
        finishLog(getActivityMessage('success', trimmed, activityOverridesRef.current), 'success');
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorMessage =
          error?.name === 'AbortError' || error?.message?.includes('aborted')
            ? 'Waktu pemrosesan habis. Silakan coba lagi.'
            : 'Maaf, API key di server invalid atau quota habis. Coba ganti provider di pengaturan (icon gear) atau perbarui API key. Jika quota sudah cukup, kemungkinan key di .env server perlu di-update.';
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        markLastDone();
        setStage('error');
        finishLog(getActivityMessage('error', trimmed, activityOverridesRef.current), 'error');
      } finally {
        setIsTyping(false);
        setProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [
      messages,
      addLog,
      updateLastLog,
      markLastDone,
      finishLog,
      clearLogs,
      setProcessing,
      setStage,
    ]
  );

  const handleChoiceClick = useCallback(
    (choice: string) => {
      if (choice === 'Lainnya...') {
        focusInput();
        return;
      }
      handleSendMessage(choice);
    },
    [handleSendMessage, focusInput]
  );

  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current) {
      handleSendMessage(lastUserMessageRef.current);
    }
  }, [handleSendMessage]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="h-screen flex flex-col bg-[#0B0F1A] overflow-hidden max-lg:bg-white max-lg:text-slate-900">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 relative mt-16 mb-[72px] overflow-hidden">
        <AnimatePresence mode="wait">
          {showWelcome && messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-10"
            >
              <WelcomeScreen />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className="absolute inset-0 z-[5]"
          style={{
            opacity: showWelcome && messages.length === 0 ? 0 : 1,
            pointerEvents:
              showWelcome && messages.length === 0 ? 'none' : 'auto',
          }}
        >
          <ChatArea
            messages={messages}
            isTyping={isTyping}
            onRetry={handleRetry}
            onChoiceClick={handleChoiceClick}
          />
        </div>
      </main>

      {/* Activity Panel */}
      <ActivityPanel />

      {/* Input Bar */}
      <InputFocusContext.Provider
        value={{ trigger: focusTrigger, increment: focusInput }}
      >
        <InputBar onSend={handleSendMessage} disabled={isTyping} />
      </InputFocusContext.Provider>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/advisor">
      <ActivityProvider>
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/version" element={<Version />} />
        </Routes>
      </ActivityProvider>
    </BrowserRouter>
  );
}

export default App;
