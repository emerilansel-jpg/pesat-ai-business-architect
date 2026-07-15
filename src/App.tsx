import { useState, useCallback, useEffect, useRef, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';
import Navbar from './components/Navbar';
import ActivityPanel from './components/ActivityPanel';
import { ActivityProvider, useActivity } from './contexts/ActivityContext';
import { type Message } from './components/ChatMessage';
import Admin from './pages/Admin';
import { sendMessage, webSearch } from './services/ai';
import { getInlineVizPrompt } from './services/visualization';
import { loadSettings, STEP_1_FOCUS } from './services/settings';
import { MAIN_SYSTEM_PROMPT } from './services/mainPrompt';

// Context for input focus
export const InputFocusContext = createContext<{
  trigger: number;
  increment: () => void;
}>({
  trigger: 0,
  increment: () => {},
});

const ACTIVITY = {
  thinking: 'Sedang nyalain otak AI... 🤖',
  searching: 'Sedang jelajah internet... 🌐',
  analyzing: 'Sedang baca pola bisnis anda... 🔍',
  crafting: 'Sedang racik jawaban keren... ✨',
  image: 'Sedang gambar visual lucu... 🎨',
  success: 'Selesai! Siap bantu lagi 🎉',
  error: 'Ups, ada error. Coba lagi ya 😅',
};

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

  useEffect(() => {
    lastUserMessageRef.current = lastUserMessage;
  }, [lastUserMessage]);

  const focusInput = useCallback(() => {
    setFocusTrigger((t) => t + 1);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      setProcessing(true);
      clearLogs();
      setShowWelcome(false);

      const trimmed = content.trim();

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

      addLog(ACTIVITY.thinking, 'thinking');
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
            updateLastLog(ACTIVITY.searching, 'search');
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
            updateLastLog(ACTIVITY.analyzing, 'analyze');
          } else {
            setStage('analyzing');
            updateLastLog(ACTIVITY.analyzing, 'analyze');
          }
        } catch (searchErr) {
          // Ignore web search errors; proceed without it
          setStage('analyzing');
          updateLastLog(ACTIVITY.analyzing, 'analyze');
        }

        // Add inline visualization + choice system prompt
        const inlineVizPrompt = getInlineVizPrompt();
        const choicePrompt =
          "\n\nCRITICAL: Every response MUST end with clickable multiple choice options using this exact format: [CHOICE:option 1|option 2|option 3]. Options must be concise (2-5 words each). Always include a 'Lainnya...' option as the last choice so the user can type freely.";

        // For the very first user message, combine the full MAIN_SYSTEM_PROMPT with the
        // focused Step 1 instructions so the AI greets, gathers data, and follows the
        // full persona/flow from the start.
        const isFirstUserMessage =
          messages.filter((m) => m.role === 'assistant').length === 0;
        const systemPrompt = isFirstUserMessage
          ? MAIN_SYSTEM_PROMPT +
            '\n\n' +
            STEP_1_FOCUS +
            (inlineVizPrompt || '') +
            searchContext +
            choicePrompt
          : MAIN_SYSTEM_PROMPT +
            (inlineVizPrompt || '') +
            searchContext +
            choicePrompt;

        const apiMessagesWithSystem: Array<{
          role: string;
          content: string;
        }> = [...finalApiMessages];
        apiMessagesWithSystem.unshift({
          role: 'system',
          content: systemPrompt,
        });

        setStage('crafting');
        addLog(ACTIVITY.crafting, 'sparkle');
        const controller = new AbortController();
        const requestTimeout = window.setTimeout(() => controller.abort(), 60000);
        const response = await sendMessage(apiMessagesWithSystem, {
          signal: controller.signal,
        });
        window.clearTimeout(requestTimeout);
        const aiText = response.content || 'Maaf, terjadi kesalahan.';

        // Add AI message
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        markLastDone();
        setStage('success');
        finishLog(ACTIVITY.success, 'success');
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        markLastDone();
        setStage('error');
        finishLog(ACTIVITY.error, 'error');
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
    <div className="h-screen flex flex-col bg-[#0B0F1A] overflow-hidden">
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
        </Routes>
      </ActivityProvider>
    </BrowserRouter>
  );
}

export default App;
