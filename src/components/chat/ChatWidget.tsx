import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  autopilotChat,
  clearChatHistory,
  getChatHistory,
  getCoachTour,
} from '../../api/autopilot';
import { ApiError } from '../../api/client';
import type {
  AutopilotChatResponse,
  ChatHistoryMessage,
  ChatVisual,
  CoachTourStep,
  SuggestedAction,
} from '../../types';
import { ChatVisualCards, CoachAvatar, SuggestedActionChips } from './ChatVisuals';
import { useCoachTour } from '../../context/CoachTourContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visuals?: ChatVisual[];
  suggested_actions?: SuggestedAction[];
  mood?: AutopilotChatResponse['mood'];
  tour?: CoachTourStep[];
  tour_id?: string | null;
}

function fromHistory(m: ChatHistoryMessage, i: number): ChatMessage {
  return {
    id: `h-${i}`,
    role: m.role,
    content: m.content,
    visuals: m.visuals,
    suggested_actions: m.suggested_actions,
  };
}

interface ChatPanelProps {
  compact?: boolean;
  onClose?: () => void;
  className?: string;
}

export function ChatPanel({ compact = false, onClose, className = '' }: ChatPanelProps) {
  const { token } = useAuth();
  const { startTour, setThinking, flashRedirect } = useCoachTour();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mood, setMood] = useState<AutopilotChatResponse['mood']>('neutral');
  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    void getChatHistory(token)
      .then((h) => {
        if (h.messages.length) {
          setMessages(h.messages.map(fromHistory));
        } else {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content:
                "Hi — I'm your Career Copilot. Ask what to do next, and I'll show your queue as cards you can act on.",
              visuals: [
                {
                  type: 'quick_replies',
                  quick_replies: [
                    'Show me around the app',
                    'What should I do next?',
                    'How do I apply?',
                    'Help with follow-ups',
                  ],
                },
              ],
              mood: 'encouraging',
            },
          ]);
        }
      })
      .catch(() => {
        /* ignore history load errors */
      });
  }, [token]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const last = messages[messages.length - 1];

    if (busy || !last || last.role === 'user') {
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      return;
    }

    // A reply with visual cards can be taller than the panel, so keep its text
    // anchored near the top and let the cards extend below it.
    const alignReplyToTop = () => {
      const el = lastMessageRef.current;
      if (!el) return;
      const delta = el.getBoundingClientRect().top - list.getBoundingClientRect().top;
      list.scrollTo({ top: list.scrollTop + delta - 12, behavior: 'smooth' });
    };

    alignReplyToTop();
    const settle = window.setTimeout(alignReplyToTop, 200);
    return () => window.clearTimeout(settle);
  }, [messages, busy]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!token || !message || busy) return;
    setError(null);
    setBusy(true);
    setInput('');
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const res = await autopilotChat(token, { message });
      setMood(res.mood || 'neutral');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          visuals: res.visuals,
          suggested_actions: res.suggested_actions,
          mood: res.mood,
          tour: res.tour,
          tour_id: res.tour_id,
        },
      ]);
      // Auto-start tour when user clearly asked for a guide and steps exist
      const wantsGuide = /tour|guide|walk|show me around|how do i|how to|tutorial|onboarding/i.test(
        message,
      );
      if (wantsGuide && res.tour && res.tour.length > 0) {
        onClose?.();
        window.setTimeout(() => startTour(res.tour!), 280);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chat failed');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const beginTour = async (tourId: string | undefined, embedded?: CoachTourStep[]) => {
    if (!token) return;
    if (embedded?.length) {
      onClose?.();
      startTour(embedded);
      return;
    }
    if (!tourId) return;
    try {
      setThinking(true);
      const data = await getCoachTour(token, tourId);
      onClose?.();
      startTour(data.steps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start tour');
    } finally {
      setThinking(false);
    }
  };

  const handleAction = (action: SuggestedAction, from?: ChatMessage) => {
    if (action.action.startsWith('start_tour:')) {
      const tid = action.action.slice('start_tour:'.length);
      const embedded =
        from?.tour_id === tid && from.tour?.length
          ? from.tour
          : from?.tour?.length && !from.tour_id
            ? from.tour
            : undefined;
      void beginTour(tid, embedded);
      return;
    }
    if (action.path) {
      flashRedirect(action.path);
      onClose?.();
      return;
    }
    void send(action.label);
  };

  const handleClear = async () => {
    if (!token) return;
    try {
      await clearChatHistory(token);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Conversation cleared. What would you like to focus on?',
          visuals: [
            {
              type: 'quick_replies',
              quick_replies: ['What should I do next?', 'Show my top jobs', 'Help with follow-ups'],
            },
          ],
          mood: 'neutral',
        },
      ]);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 bg-surface border border-line overflow-hidden ${className}`}>
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-canvas/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <CoachAvatar mood={mood} speaking={busy} size={compact ? 'sm' : 'md'} />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink truncate">
              Career Coach
            </p>
            <p className="text-[12px] text-muted truncate">
              {busy ? 'Thinking…' : 'Text + visual guidance'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void handleClear()}
            className="p-2 rounded-full hover:bg-soft text-muted"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-soft text-muted"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              ref={i === messages.length - 1 ? lastMessageRef : undefined}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <CoachAvatar mood={m.mood || mood} size="sm" />
              )}
              <div className={`max-w-[92%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-4 py-2.5 text-[14px] leading-relaxed tracking-[-0.01em] ${
                    m.role === 'user'
                      ? 'bg-ink text-white rounded-[18px] rounded-br-md'
                      : 'bg-soft text-ink rounded-[18px] rounded-bl-md border border-line'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <>
                    <ChatVisualCards
                      visuals={m.visuals || []}
                      compact={compact}
                      onQuickReply={(t) => void send(t)}
                    />
                    <SuggestedActionChips
                      actions={m.suggested_actions || []}
                      onAction={(a) => handleAction(a, m)}
                    />
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex items-center gap-2 text-[13px] text-muted pl-1">
            <CoachAvatar mood={mood} speaking size="sm" />
            Building a visual reply…
          </div>
        )}
        {error && <p className="text-[13px] text-[#b00020]">{error}</p>}
      </div>

      <form
        className="shrink-0 border-t border-line px-3 py-2.5 flex items-center gap-2 bg-canvas"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your job search…"
          disabled={busy}
          className="flex-1 min-w-0 text-[14px] px-4 py-2 rounded-full border border-line bg-surface outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40 hover:bg-accent-hover transition-colors"
          aria-label="Send"
        >
          <Send className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );
}

/** Floating chat bubble available on every authenticated page. */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { active, phase } = useCoachTour();
  const tourBusy = active || phase === 'thinking' || phase === 'redirecting';

  return (
    <>
      <AnimatePresence>
        {open && !tourBusy && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-24 right-5 z-[60] w-[min(420px,calc(100vw-2rem))] h-[min(640px,calc(100vh-8rem))] shadow-[0_24px_60px_rgba(0,0,0,0.18)] rounded-[22px] overflow-hidden flex flex-col"
          >
            <ChatPanel compact className="h-full min-h-0 rounded-[22px] border-0" onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {!tourBusy && (
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-ink text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)] flex items-center justify-center"
          aria-label={open ? 'Close coach' : 'Open coach'}
        >
          {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </motion.button>
      )}
    </>
  );
}
