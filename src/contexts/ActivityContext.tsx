import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';

export type ActivityIcon =
  | 'thinking'
  | 'search'
  | 'analyze'
  | 'image'
  | 'sparkle'
  | 'success'
  | 'error';

export type ActivityStage =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'analyzing'
  | 'crafting'
  | 'success'
  | 'error';

export interface ActivityItem {
  id: string;
  message: string;
  displayedMessage: string;
  status: 'typing' | 'done';
  icon: ActivityIcon;
}

interface ActivityContextValue {
  logs: ActivityItem[];
  isVisible: boolean;
  isProcessing: boolean;
  currentStage: ActivityStage;
  addLog: (message: string, icon?: ActivityIcon) => void;
  updateLastLog: (message: string, icon?: ActivityIcon) => void;
  markLastDone: () => void;
  finishLog: (message: string, icon?: ActivityIcon) => void;
  clearLogs: () => void;
  setProcessing: (processing: boolean) => void;
  setVisible: (visible: boolean) => void;
  setStage: (stage: ActivityStage) => void;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

const TYPEWRITER_INTERVAL_MS = 16;

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setStage] = useState<ActivityStage>('idle');
  const timeoutsRef = useRef<number[]>([]);
  const currentTypingIdRef = useRef<string | null>(null);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const typeMessage = useCallback((id: string, message: string) => {
    clearTimeouts();
    currentTypingIdRef.current = id;
    let charIndex = 0;

    const typeNextChar = () => {
      if (charIndex <= message.length) {
        setLogs((prev) =>
          prev.map((log) =>
            log.id === id
              ? {
                  ...log,
                  displayedMessage: message.slice(0, charIndex),
                  status: 'typing' as const,
                }
              : log
          )
        );
        charIndex += 1;
        const timeoutId = window.setTimeout(
          typeNextChar,
          TYPEWRITER_INTERVAL_MS
        );
        timeoutsRef.current.push(timeoutId);
      } else {
        setLogs((prev) =>
          prev.map((log) =>
            log.id === id ? { ...log, status: 'done' as const } : log
          )
        );
        currentTypingIdRef.current = null;
      }
    };

    typeNextChar();
  }, [clearTimeouts]);

  const addLog = useCallback(
    (message: string, icon: ActivityIcon = 'thinking') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newLog: ActivityItem = {
        id,
        message,
        displayedMessage: '',
        status: 'typing',
        icon,
      };

      // Keep only done logs and replace any active typing log with the new
      // one so the list doesn't grow indefinitely during a single stage.
      setLogs((prev) => {
        const doneLogs = prev.filter((l) => l.status === 'done');
        return [...doneLogs, newLog];
      });
      setIsVisible(true);
      typeMessage(id, message);
    },
    [typeMessage]
  );

  const updateLastLog = useCallback(
    (message: string, icon: ActivityIcon = 'thinking') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setLogs((prev) => {
        if (prev.length === 0) {
          return [
            { id, message, displayedMessage: '', status: 'typing', icon },
          ];
        }
        const last = prev[prev.length - 1];
        if (last.status === 'typing') {
          return [
            ...prev.slice(0, -1),
            { ...last, id, message, displayedMessage: '', status: 'typing', icon },
          ];
        }
        return [
          ...prev,
          { id, message, displayedMessage: '', status: 'typing', icon },
        ];
      });
      setIsVisible(true);
      typeMessage(id, message);
    },
    [typeMessage]
  );

  const markLastDone = useCallback(() => {
    setLogs((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.status === 'done') return prev;
      return [...prev.slice(0, -1), { ...last, status: 'done' }];
    });
  }, []);

  const finishLog = useCallback(
    (message: string, icon: ActivityIcon = 'success') => {
      clearTimeouts();
      currentTypingIdRef.current = null;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setLogs((prev) => {
        const doneLogs = prev.filter((l) => l.status === 'done');
        return [
          ...doneLogs,
          { id, message, displayedMessage: message, status: 'done', icon },
        ];
      });
      setIsVisible(true);
    },
    [clearTimeouts]
  );

  const clearLogs = useCallback(() => {
    clearTimeouts();
    currentTypingIdRef.current = null;
    setLogs([]);
    setIsVisible(false);
    setIsProcessing(false);
    setStage('idle');
  }, [clearTimeouts]);

  const setStageCallback = useCallback((stage: ActivityStage) => {
    setStage(stage);
  }, []);

  const setProcessing = useCallback((processing: boolean) => {
    setIsProcessing(processing);
    if (processing) setIsVisible(true);
  }, []);

  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return (
    <ActivityContext.Provider
      value={{
        logs,
        isVisible,
        isProcessing,
        currentStage,
        addLog,
        updateLastLog,
        markLastDone,
        finishLog,
        clearLogs,
        setProcessing,
        setVisible,
        setStage: setStageCallback,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return ctx;
}
