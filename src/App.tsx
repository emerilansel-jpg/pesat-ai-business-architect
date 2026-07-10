import { useState, useCallback, useEffect, useRef, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';
import Navbar from './components/Navbar';
import ScrollToBottom from './components/ScrollToBottom';
import ChatMessage, { type Message } from './components/ChatMessage';
import Admin from './pages/Admin';
import { sendMessage } from './services/ai';
import { getInlineVizPrompt } from './services/visualization';

// Context for input focus
export const InputFocusContext = createContext<{
  trigger: number;
  increment: () => void;
}>({
  trigger: 0,
  increment: () => {},
});

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
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
      setShowWelcome(false);

      // Add user message
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLastUserMessage(content.trim());
      setIsTyping(true);

      try {
        // Build API messages
        const historyMessages = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.role === 'assistant' ? m.content : m.content,
          }));

        const finalApiMessages = [
          ...historyMessages,
          { role: 'user' as const, content: content.trim() },
        ];

        // Add inline visualization + choice system prompt
        const inlineVizPrompt = getInlineVizPrompt();
        const choicePrompt =
          "\n\nALWAYS end your response with multiple choice options using this exact format: [CHOICE:option 1|option 2|option 3]. Keep options concise (2-5 words each).";
        const apiMessagesWithSystem: Array<{
          role: string;
          content: string;
        }> = [...finalApiMessages];
        if (inlineVizPrompt) {
          apiMessagesWithSystem.unshift({
            role: 'system',
            content:
              'You are Pesat AI Business Architect, an expert business consultant.' +
              inlineVizPrompt +
              choicePrompt,
          });
        }

        const response = await sendMessage(apiMessagesWithSystem);
        const aiText = response.content || 'Maaf, terjadi kesalahan.';

        // Add AI message
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (error) {
        console.error('Chat error:', error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
        isProcessingRef.current = false;
      }
    },
    [messages]
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

  // Handle scroll to bottom
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const threshold = el.scrollHeight - el.clientHeight - 100;
      setShowScrollButton(el.scrollTop < threshold);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const isLastAI = messages.length > 0 && messages[messages.length - 1].role === 'assistant';

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
    <HashRouter>
      <Routes>
        <Route path="/" element={<ChatInterface />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
