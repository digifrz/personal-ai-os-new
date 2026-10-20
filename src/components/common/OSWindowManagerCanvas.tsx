import React, { useState } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { OSWindow } from './OSWindow';
import { VoiceRoomWindow } from '../lounge/VoiceRoomWindow';
import { DirectChatModal } from '../lounge/DirectChatModal';
import { TaskItem, NoteItem, DirectThreadItem, HabitItem, FinanceTransactionItem } from '../../types';
import { askAI } from '../../services/ai';
import { Send, Sparkles, Check, Trash2, Plus, Music, Key, ExternalLink, FolderKanban, Flame, DollarSign, Droplet } from 'lucide-react';
import { WellnessWidget } from './WellnessWidget';

interface OSWindowManagerCanvasProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  habits?: HabitItem[];
  transactions?: FinanceTransactionItem[];
  onToggleTaskStatus?: (taskId: string) => void;
  onToggleHabit?: (habitId: string, dateStr: string, completedDates: string[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OSWindowManagerCanvas: React.FC<OSWindowManagerCanvasProps> = ({
  tasks,
  notes,
  habits = [],
  transactions = [],
  onToggleTaskStatus,
  onToggleHabit,
  onNavigateTab,
}) => {
  const { windows, closeWindow } = useWindowManager();

  // Scratchpad state
  const [scratchText, setScratchText] = useState(() => {
    try {
      return localStorage.getItem('paio_scratchpad_text') || '✦ Quick OS Scratchpad\n- Write daily action items\n- Jot temporary thoughts\n- Auto-saved locally!';
    } catch {
      return '';
    }
  });

  const handleScratchChange = (text: string) => {
    setScratchText(text);
    try {
      localStorage.setItem('paio_scratchpad_text', text);
    } catch {}
  };

  // Mini assistant chat state for floating window
  const [miniAssistantInput, setMiniAssistantInput] = useState('');
  const [miniAssistantMessages, setMiniAssistantMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    { role: 'model', text: 'Hello! I am your floating OS AI Assistant. Ask me anything while you work across windows.' },
  ]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const handleSendMiniAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniAssistantInput.trim() || isAssistantLoading) return;
    const q = miniAssistantInput.trim();
    setMiniAssistantInput('');
    setMiniAssistantMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsAssistantLoading(true);

    try {
      const res = await askAI({
        prompt: q,
        mode: 'chat',
        provider: 'gemini',
        context: {
          openTasks: tasks.filter((t) => t.status !== 'done').map((t) => t.title),
          recentNotes: notes.slice(0, 3).map((n) => n.title),
        },
      });
      setMiniAssistantMessages((prev) => [...prev, { role: 'model', text: res }]);
    } catch {
      setMiniAssistantMessages((prev) => [...prev, { role: 'model', text: 'I am here to help. Please try your request again.' }]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  return (
    <>
      {windows.map((win) => {
        return (
          <OSWindow key={win.id} instance={win}>
            {/* Render component inside window */}
            {win.component === 'voice_room' && <VoiceRoomWindow />}

            {win.component === 'direct_chat' && (
              <div className="h-full">
                {win.props?.thread ? (
                  <DirectChatModal
                    thread={win.props.thread as DirectThreadItem}
                    onClose={() => closeWindow(win.id)}
                    onDeleteThread={() => closeWindow(win.id)}
                    onShowToast={() => {}}
                  />
                ) : (
                  <div className="p-4 text-xs text-[var(--color-muted)]">
                    No active chat thread selected.
                  </div>
                )}
              </div>
            )}

            {win.component === 'assistant' && (
              <div className="flex flex-col h-full bg-[var(--color-bg)] text-xs">
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {miniAssistantMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                        m.role === 'user'
                          ? 'ml-auto bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))}
                  {isAssistantLoading && (
                    <div className="p-2.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] max-w-[85%] text-[var(--color-muted)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
                      <span>Thinking…</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMiniAssistant} className="p-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex gap-1.5">
                  <input
                    type="text"
                    value={miniAssistantInput}
                    onChange={(e) => setMiniAssistantInput(e.target.value)}
                    placeholder="Ask AI anything…"
                    className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!miniAssistantInput.trim() || isAssistantLoading}
                    className="rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-3 py-1.5 font-bold text-white disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {win.component === 'scratchpad' && (
              <div className="flex flex-col h-full bg-[var(--color-surface)] p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] border-b border-[var(--color-border)] pb-2">
                  <span>Autosaved persistent scratchpad</span>
                  <button
                    type="button"
                    onClick={() => handleScratchChange('')}
                    className="text-red-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={scratchText}
                  onChange={(e) => handleScratchChange(e.target.value)}
                  placeholder="Type notes, snippets, or temporary ideas here…"
                  className="flex-1 w-full bg-transparent border-0 outline-none font-mono text-xs text-[var(--color-text)] resize-none leading-relaxed"
                />
              </div>
            )}

            {win.component === 'tasks' && (
              <div className="flex flex-col h-full bg-[var(--color-bg)] p-3 text-xs space-y-2 overflow-y-auto">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                  Active Tasks Checklist ({tasks.filter((t) => t.status !== 'done').length})
                </span>
                <div className="space-y-1.5">
                  {tasks.slice(0, 10).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <button
                          type="button"
                          onClick={() => onToggleTaskStatus && onToggleTaskStatus(t.id)}
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            t.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--color-border)]'
                          }`}
                        >
                          {t.status === 'done' && <Check className="w-3 h-3" />}
                        </button>
                        <span className={`truncate ${t.status === 'done' ? 'line-through opacity-60' : 'font-medium'}`}>
                          {t.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.priority === 'high' ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {win.component === 'spotify' && (
              <div className="p-3 bg-black text-white h-full flex flex-col justify-between">
                <iframe
                  src={`https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0`}
                  width="100%"
                  height="380"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-2xl border border-white/10"
                  title="Spotify Focus Player"
                />
              </div>
            )}
            {win.component === 'files' && (
              <div className="flex flex-col h-full bg-[var(--color-bg)] p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--color-text)]">Cloud Vault Storage</span>
                  <span className="text-[11px] text-emerald-400 font-medium">✓ Synced with Cloud</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                  <div className="flex justify-between text-[11px] text-[var(--color-muted)]">
                    <span>Used Space</span>
                    <span className="font-mono text-[var(--color-text)]">124.5 MB / 500 MB</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full w-[25%]" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-2xl p-4 text-center hover:border-[var(--color-primary)] transition-colors">
                  <FolderKanban className="w-8 h-8 text-indigo-400 mb-2" />
                  <p className="font-bold text-[var(--color-text)]">Drag & Drop files here</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-1">Or click to open the full Cloud Storage manager</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('files');
                      closeWindow(win.id);
                    }}
                    className="mt-3 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 font-bold text-white shadow-sm hover:brightness-110"
                  >
                    Open Storage Hub
                  </button>
                </div>
              </div>
            )}

            {win.component === 'habits' && (
              <div className="flex flex-col h-full bg-[var(--color-bg)] p-4 text-xs space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--color-text)]">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Today's Habits Checklist</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('habits');
                      closeWindow(win.id);
                    }}
                    className="text-[11px] text-emerald-400 font-bold hover:underline"
                  >
                    Open Hub →
                  </button>
                </div>

                <div className="space-y-2">
                  {habits.map((h) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isDone = (h.completedDates || []).includes(todayStr);
                    return (
                      <div
                        key={h.id}
                        onClick={() => onToggleHabit && onToggleHabit(h.id, todayStr, h.completedDates)}
                        className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                          isDone
                            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${
                            isDone ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-[var(--color-border)]'
                          }`}>
                            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="font-bold truncate">{h.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0 ml-2">
                          🔥 {h.streakCount || 0}d
                        </span>
                      </div>
                    );
                  })}

                  {habits.length === 0 && (
                    <p className="text-xs text-[var(--color-muted)] text-center py-6">
                      No habits set yet. Visit the Habits Hub to create your first streak.
                    </p>
                  )}
                </div>
              </div>
            )}

            {win.component === 'finance' && (
              <div className="flex flex-col h-full bg-[var(--color-bg)] p-4 text-xs space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--color-text)]">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Personal Finance Quick Ledger</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('finance');
                      closeWindow(win.id);
                    }}
                    className="text-[11px] text-cyan-400 font-bold hover:underline"
                  >
                    Open Ledger →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-muted)]">Inflow</span>
                    <p className="font-mono font-bold text-emerald-400">
                      ${transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-muted)]">Outflow</span>
                    <p className="font-mono font-bold text-rose-400">
                      ${transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Recent Transactions</span>
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <span className="truncate pr-2 font-medium">{t.note}</span>
                      <span className={`font-mono font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {win.component === 'wellness' && (
              <div className="p-4 h-full bg-[var(--color-bg)] overflow-y-auto">
                <WellnessWidget />
              </div>
            )}
          </OSWindow>
        );
      })}
    </>
  );
};
