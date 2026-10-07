import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Mic,
  MicOff,
  Trash2,
  Copy,
  FilePlus,
  BookOpen,
  CheckSquare,
  Search,
  Check,
  Brain,
  Paperclip,
  Image as ImageIcon,
  X,
  Calendar,
  Target,
  GraduationCap,
  ExternalLink,
  FileText,
  Zap,
  HardDrive,
  Plus,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  Edit2,
  Share2,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  AIChatMessage,
  TaskItem,
  NoteItem,
  FileItem,
  CalendarEventItem,
  AIMemoryItem,
} from '../types';
import {
  listenToAIChats,
  addAIChatMessage,
  clearAIChats,
  createNote,
  createTask,
  createAIMemory,
  createFlashcard,
  createCalendarEvent,
  createGoal,
} from '../services/db';
import { askAI } from '../services/ai';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AIChatMessage[];
}

interface AssistantViewProps {
  tasks: TaskItem[];
  notes: NoteItem[];
  files: FileItem[];
  events: CalendarEventItem[];
  memories?: AIMemoryItem[];
  aiMemoryEnabled?: boolean;
  onNavigate?: (tab: string) => void;
  onLogActivity?: (action: string, entityType: string, entityTitle: string, details?: string) => void;
}

interface AttachedMedia {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

interface ExecutedAction {
  type: 'task' | 'note' | 'flashcard' | 'event' | 'goal';
  title: string;
  details?: string;
  navTab: string;
}

const STORAGE_KEY_SESSIONS = 'personal_ai_chat_sessions_v3';

export const AssistantView: React.FC<AssistantViewProps> = ({
  tasks,
  notes,
  files,
  events,
  memories = [],
  aiMemoryEnabled = true,
  onNavigate,
  onLogActivity,
}) => {
  const { user, profile } = useAuth();
  
  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved sessions:', e);
    }
    // Default initial session
    return [
      {
        id: 'session_welcome',
        title: 'Workspace Assistant Welcome',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'welcome_init',
            role: 'model',
            text: "Hello! I am your Personal AI OS Assistant. I'm connected to your workspace data (tasks, notes, calendar, goals, and lounge activities). Feel free to ask me to analyze your tasks, summarize files, generate study flashcards, schedule events, or plan your day! You can also upload photos and documents for multimodal vision analysis.",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session_welcome';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<
    'chat' | 'suggest_tasks' | 'study_quiz' | 'code' | 'summarize'
  >('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [attachedMediaList, setAttachedMediaList] = useState<AttachedMedia[]>([]);
  const [recentExecutedActions, setRecentExecutedActions] = useState<ExecutedAction[]>([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceRecognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition requires Chrome, Edge, or Safari with microphone permissions.');
      return;
    }

    if (isVoiceListening) {
      if (voiceRecognitionRef.current) {
        try {
          voiceRecognitionRef.current.stop();
        } catch {}
      }
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        showToast('Listening to your voice command…');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Assistant voice recognition notice:', event.error);
        setIsVoiceListening(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone permission was denied. Please allow microphone access.');
        } else if (event.error !== 'aborted') {
          showToast(`Voice input notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      voiceRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice recognition start error:', err);
      setIsVoiceListening(false);
      showToast('Could not start microphone. Check browser permissions.');
    }
  };

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  const messages = activeSession?.messages || [];

  const visibleMemories = memories.filter(
    (m) => m.isVisible !== false && m.is_visible !== false
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Unable to persist sessions to local storage:', e);
    }
  }, [sessions]);

  // Sync AI chat messages from Firebase Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = listenToAIChats(user.uid, (firestoreMsgs) => {
      if (firestoreMsgs.length > 0) {
        setSessions((prev) => {
          const current = prev.find((s) => s.id === activeSessionId) || prev[0];
          if (!current) return prev;
          const existingIds = new Set(current.messages.map((m) => m.id));
          const newOnes = firestoreMsgs.filter((m) => !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          return prev.map((s) =>
            s.id === current.id
              ? { ...s, messages: [...s.messages, ...newOnes], updatedAt: new Date().toISOString() }
              : s
          );
        });
      }
    });
    return () => unsub && unsub();
  }, [user, activeSessionId]);

  // Scroll to bottom on message update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputPrompt]);

  // Handle media selection (Photos, screenshots, documents)
  const handleMediaPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > 10 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds 10MB limit.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedMediaList((prev) => [
          ...prev,
          {
            id: 'media_' + Date.now() + '_' + i,
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            sizeBytes: file.size,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    if (mediaInputRef.current) mediaInputRef.current.value = '';
    showToast('Media attached to AI prompt.');
  };

  const removeAttachedMedia = (id: string) => {
    setAttachedMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  // Parse and execute actions
  const parseAndExecuteActions = async (replyText: string) => {
    const executed: ExecutedAction[] = [];
    const activeUserId = user?.uid || 'guest_user';

    // 1. [ACTION_CREATE_TASK: Title | Priority | Category | DueDate]
    const taskMatches = replyText.matchAll(/\[ACTION_CREATE_TASK:\s*([^|\]]+)(?:\|\s*([^|\]]+))?(?:\|\s*([^|\]]+))?(?:\|\s*([^|\]]+))?\]/gi);
    for (const match of taskMatches) {
      const taskTitle = match[1]?.trim();
      const priority = (match[2]?.trim().toLowerCase() as any) || 'medium';
      const category = match[3]?.trim() || 'Work';
      const dueAt = match[4]?.trim() || null;

      if (taskTitle) {
        try {
          await createTask({
            userId: activeUserId,
            title: taskTitle,
            description: 'Created by Personal AI Assistant',
            status: 'open',
            priority: ['high', 'urgent', 'medium', 'low'].includes(priority) ? priority : 'medium',
            category,
            dueAt: dueAt || null,
          });
          executed.push({
            type: 'task',
            title: taskTitle,
            details: `Priority: ${priority} · Category: ${category}`,
            navTab: 'tasks',
          });
          onLogActivity?.('created', 'task', taskTitle, 'Auto-generated by AI Assistant');
        } catch (e) {
          console.warn('Failed to auto-create task:', e);
        }
      }
    }

    // 2. [ACTION_CREATE_NOTE: Title | Content | Category]
    const noteMatches = replyText.matchAll(/\[ACTION_CREATE_NOTE:\s*([^|\]]+)(?:\|\s*([^|\]]+))?(?:\|\s*([^|\]]+))?\]/gi);
    for (const match of noteMatches) {
      const noteTitle = match[1]?.trim();
      const noteBody = match[2]?.trim() || '';
      const category = match[3]?.trim() || 'AI Insights';

      if (noteTitle) {
        try {
          await createNote({
            userId: activeUserId,
            title: noteTitle,
            body: noteBody,
            category,
            color: 'Purple',
            isPinned: false,
            isArchived: false,
            isTrashed: false,
          });
          executed.push({
            type: 'note',
            title: noteTitle,
            details: `Category: ${category}`,
            navTab: 'notes',
          });
          onLogActivity?.('created', 'note', noteTitle, 'Auto-generated by AI Assistant');
        } catch (e) {
          console.warn('Failed to auto-create note:', e);
        }
      }
    }

    if (executed.length > 0) {
      setRecentExecutedActions(executed);
      showToast(`AI executed ${executed.length} workspace action(s)!`);
    }
  };

  // Create a New Chat Session (ChatGPT / Gemini style)
  const handleCreateNewChat = () => {
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputPrompt('');
    setAttachedMediaList([]);
    setRecentExecutedActions([]);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Delete a Chat Session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Clear messages of only session
      setSessions([
        {
          id: 'session_' + Date.now(),
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        },
      ]);
      return;
    }

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
    showToast('Chat removed.');
  };

  // Rename Chat Title
  const handleSaveRename = (sessionId: string) => {
    if (!editingTitleText.trim()) {
      setEditingSessionId(null);
      return;
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, title: editingTitleText.trim(), updatedAt: new Date().toISOString() }
          : s
      )
    );
    setEditingSessionId(null);
    setEditingTitleText('');
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if ((!text && attachedMediaList.length === 0) || loading) return;

    const currentMedia = [...attachedMediaList];
    setInputPrompt('');
    setAttachedMediaList([]);
    setLoading(true);

    const userMsgText = text || (currentMedia.length ? `[Uploaded ${currentMedia.length} media file(s)]` : '');
    const userMsg: AIChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      text: userMsgText,
      createdAt: new Date().toISOString(),
    };

    // Auto-generate title if currently "New Conversation"
    let updatedTitle = activeSession?.title;
    if (!updatedTitle || updatedTitle === 'New Conversation') {
      updatedTitle = text.slice(0, 36) + (text.length > 36 ? '…' : '');
    }

    // Add user message to active session immediately
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: updatedTitle || s.title,
            updatedAt: new Date().toISOString(),
            messages: [...s.messages, userMsg],
          };
        }
        return s;
      })
    );

    // Context preparation with active long-term AI memory
    const memoryContext = aiMemoryEnabled
      ? visibleMemories.map(
          (m) =>
            `[${(m.type || 'Personal').toUpperCase()}] ${m.title}: ${m.content} (Importance: ${m.importance ?? 50})`
        )
      : [];

    const workspaceContext = {
      openTasksCount: tasks.filter((t) => t.status !== 'done').length,
      recentTasks: tasks.slice(0, 6).map((t) => `${t.title} [${t.priority}] (${t.status})`),
      totalNotesCount: notes.length,
      recentNotes: notes.slice(0, 5).map((n) => n.title),
      recentFiles: files.slice(0, 5).map((f) => f.name),
      upcomingEvents: events.slice(0, 4).map((e) => `${e.title} at ${e.startsAt}`),
      aiMemoryActive: aiMemoryEnabled,
      userMemories: memoryContext,
    };

    // Format media attachments for Gemini API multimodal payload
    const mediaPayload = currentMedia.map((m) => ({
      data: m.dataUrl,
      mimeType: m.mimeType,
      name: m.name,
    }));

    try {
      if (user) {
        addAIChatMessage(user.uid, 'user', userMsgText).catch(() => {});
      }

      const aiReply = await askAI({
        prompt: userMsgText,
        mode: activeMode,
        context: workspaceContext,
        media: mediaPayload.length > 0 ? mediaPayload : undefined,
      });

      await parseAndExecuteActions(aiReply);

      const modelMsg: AIChatMessage = {
        id: 'msg_model_' + Date.now(),
        role: 'model',
        text: aiReply,
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, modelMsg],
            };
          }
          return s;
        })
      );

      if (user) {
        addAIChatMessage(user.uid, 'model', aiReply).catch(() => {});
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: AIChatMessage = {
        id: 'msg_fallback_' + Date.now(),
        role: 'model',
        text: 'I have logged your request. You can review your open tasks and notes in the left navigation or ask another question!',
        createdAt: new Date().toISOString(),
      };
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, fallbackMsg],
            };
          }
          return s;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all AI chat sessions? This will wipe your history.')) return;
    const freshSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions([freshSession]);
    setActiveSessionId(freshSession.id);
    if (user) {
      await clearAIChats(user.uid).catch(() => {});
    }
    showToast('AI history cleared.');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNote = async (text: string) => {
    const activeUserId = user?.uid || 'guest_user';
    try {
      await createNote({
        userId: activeUserId,
        title: 'AI Insight: ' + new Date().toLocaleDateString(),
        body: text,
        category: 'Personal',
        color: 'Purple',
        isPinned: false,
        isArchived: false,
        isTrashed: false,
      });
      onLogActivity?.('created', 'note', 'AI Insight Note', 'Saved from AI Assistant chat');
      showToast('Saved to Notes!');
    } catch (e) {
      showToast('Could not save note.');
    }
  };

  const handleSaveToMemory = async (text: string) => {
    try {
      const cleanSnippet = text.replace(/[*#`_]/g, '').trim();
      const firstLine = cleanSnippet.split('\n')[0].slice(0, 50) || 'Assistant Key Takeaway';
      const activeUserId = user?.uid || 'guest_user';
      await createAIMemory({
        userId: activeUserId,
        title: firstLine,
        content: cleanSnippet.slice(0, 1000),
        type: 'conversation',
        importance: 50,
        source: 'conversation',
        isVisible: true,
        is_visible: true,
      });
      onLogActivity?.('created', 'ai_memory', firstLine, 'Saved to long-term memory context');
      showToast('Saved to AI Memory!');
    } catch (e) {
      showToast('Could not save to AI Memory.');
    }
  };

  // Quick Action Buttons
  const triggerQuickAction = (type: 'task' | 'note' | 'flashcard' | 'event' | 'goal') => {
    switch (type) {
      case 'task':
        setInputPrompt('Create a high-priority task for: ');
        break;
      case 'note':
        setInputPrompt('Write a structured note synthesizing: ');
        break;
      case 'flashcard':
        setInputPrompt('Generate 3 study flashcards about: ');
        break;
      case 'event':
        setInputPrompt('Schedule a 45-minute focus session for tomorrow at 2 PM');
        break;
      case 'goal':
        setInputPrompt('Set a new quarterly goal to: ');
        break;
    }
    textareaRef.current?.focus();
  };

  // Section Grouping Logic for Previous Chats (Like ChatGPT and Gemini)
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 3600 * 1000;
    const past7DaysStart = todayStart - 7 * 24 * 3600 * 1000;
    const past30DaysStart = todayStart - 30 * 24 * 3600 * 1000;

    const filtered = sessions.filter((s) =>
      s.title.toLowerCase().includes(historySearchQuery.toLowerCase())
    );

    const groups: {
      today: ChatSession[];
      yesterday: ChatSession[];
      previous7Days: ChatSession[];
      previous30Days: ChatSession[];
      older: ChatSession[];
    } = {
      today: [],
      yesterday: [],
      previous7Days: [],
      previous30Days: [],
      older: [],
    };

    filtered.forEach((session) => {
      const sessionTime = new Date(session.updatedAt || session.createdAt).getTime();
      if (sessionTime >= todayStart) {
        groups.today.push(session);
      } else if (sessionTime >= yesterdayStart) {
        groups.yesterday.push(session);
      } else if (sessionTime >= past7DaysStart) {
        groups.previous7Days.push(session);
      } else if (sessionTime >= past30DaysStart) {
        groups.previous30Days.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  }, [sessions, historySearchQuery]);

  // Format timestamp helper
  const formatSessionTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const quickPrompts = [
    {
      title: '⚡ Prioritize Tasks',
      desc: 'Review open tasks and pick top 2 priorities',
      prompt: 'Review my open tasks and tell me what 2 items deserve my absolute focus today and why.',
    },
    {
      title: '✍️ Lounge Post Draft',
      desc: 'Compose a high-engagement community post',
      prompt: 'Draft an engaging and thoughtful social post for The Lounge discussing modern modular developer tools.',
    },
    {
      title: '📝 Synthesize Notes',
      desc: 'Distill workspace notes into key takeaways',
      prompt: 'Create a structured executive summary synthesizing my current workspace notes and next action points.',
    },
    {
      title: '💡 Generate Flashcards',
      desc: 'Create active recall flashcards from concepts',
      prompt: 'Generate 3 challenging study flashcards based on recent notes and study concepts.',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1550px] px-2 sm:px-4 py-4 sm:py-6 space-y-4 select-none">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden Media Input */}
      <input
        type="file"
        ref={mediaInputRef}
        multiple
        accept="image/*,application/pdf,text/*"
        className="hidden"
        onChange={handleMediaPicked}
      />

      {/* Action Execution Banner (When AI executes real tasks/notes) */}
      {recentExecutedActions.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 sm:p-4 animate-fade-in flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
              ⚡
            </span>
            <div>
              <strong className="block font-bold text-emerald-300">
                AI Executed {recentExecutedActions.length} Real Workspace Action(s)
              </strong>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[var(--color-text)]">
                {recentExecutedActions.map((act, i) => (
                  <span
                    key={i}
                    onClick={() => onNavigate && onNavigate(act.navTab)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-surface)] px-2 py-0.5 border border-emerald-500/40 text-emerald-300 cursor-pointer hover:underline"
                  >
                    <span>{act.type.toUpperCase()}:</span>
                    <span className="font-semibold">{act.title}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRecentExecutedActions([])}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ChatGPT & Gemini Style Two-Column Workspace Container */}
      <div className="flex h-[82vh] min-h-[620px] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden relative">
        {/* ============================================================ */}
        {/* LEFT SIDEBAR: Previous Chats Grouped by Time (ChatGPT / Gemini) */}
        {/* ============================================================ */}
        <aside
          className={`${
            isSidebarOpen ? 'w-72 sm:w-80' : 'w-0'
          } flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]/70 backdrop-blur-md transition-all duration-300 overflow-hidden shrink-0`}
        >
          {/* Top Action: + New Chat */}
          <div className="p-3 border-b border-[var(--color-border)]/60 space-y-2">
            <button
              type="button"
              onClick={handleCreateNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] via-indigo-600 to-[var(--color-cyan)] p-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>New Chat</span>
            </button>

            {/* Filter Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[var(--color-muted)]" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search past chats…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-3 text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Section-Based Previous Chats List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
            {/* Section Helper Function */}
            {[
              { label: 'Today', items: groupedSessions.today },
              { label: 'Yesterday', items: groupedSessions.yesterday },
              { label: 'Previous 7 Days', items: groupedSessions.previous7Days },
              { label: 'Previous 30 Days', items: groupedSessions.previous30Days },
              { label: 'Older', items: groupedSessions.older },
            ].map((section) => {
              if (section.items.length === 0) return null;
              return (
                <div key={section.label} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-extrabold tracking-wider uppercase text-[var(--color-muted)]">
                    {section.label}
                  </div>

                  {section.items.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isEditing = editingSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setRecentExecutedActions([]);
                        }}
                        className={`group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 text-[var(--color-primary)] font-semibold shadow-sm'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-surface)] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-1 flex-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`} />
                          
                          {isEditing ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              onBlur={() => handleSaveRename(session.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(session.id);
                                if (e.key === 'Escape') setEditingSessionId(null);
                              }}
                              className="w-full bg-[var(--color-surface)] border border-[var(--color-primary)] rounded px-1.5 py-0.5 text-xs outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="truncate">
                              <span className="block truncate leading-tight">
                                {session.title || 'Untitled Chat'}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted)] font-mono mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{formatSessionTime(session.updatedAt || session.createdAt)}</span>
                                <span>·</span>
                                <span>{session.messages.length} msgs</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Hover Actions: Rename & Delete */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(session.id);
                              setEditingTitleText(session.title);
                            }}
                            title="Rename chat"
                            className="p-1 rounded-md hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            title="Delete chat"
                            className="p-1 rounded-md hover:bg-red-500/20 text-[var(--color-muted)] hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="p-4 text-center text-xs text-[var(--color-muted)]">
                No conversations yet. Start a new chat!
              </div>
            )}
          </div>

          {/* Sidebar Footer Controls */}
          <div className="p-3 border-t border-[var(--color-border)]/60 bg-[var(--color-surface)]/40 flex items-center justify-between text-xs text-[var(--color-muted)]">
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex items-center gap-1 hover:text-red-400 transition-colors"
              title="Clear all chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
                title="View storage quota"
              >
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Storage</span>
              </button>
            )}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* RIGHT MAIN CANVAS: Conversation Stream & Modern Prompt Dock */}
        {/* ============================================================ */}
        <main className="flex-1 flex flex-col min-w-0 bg-[var(--color-surface)]">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              {/* Toggle Sidebar Button */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
                title={isSidebarOpen ? 'Collapse past chats' : 'Expand past chats'}
              >
                {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm sm:text-base text-[var(--color-text)] truncate">
                    {activeSession?.title || 'Personal AI Assistant'}
                  </h2>
                  <span className="rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-400 shrink-0">
                    Gemini 2.5 Flash
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)] pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" />
                    <span>{tasks.length} Tasks</span>
                  </span>
                  <span>·</span>
                  <span>{notes.length} Notes</span>
                  <span>·</span>
                  <span>{files.length} Files</span>
                </div>
              </div>
            </div>

            {/* Top Bar Quick Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((msg) => {
              const isModel = msg.role === 'model';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 sm:gap-4 max-w-4xl mx-auto ${
                    isModel ? '' : 'flex-row-reverse'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold shadow-md ${
                      isModel
                        ? 'bg-gradient-to-tr from-[var(--color-primary)] via-indigo-600 to-[var(--color-cyan)] text-white'
                        : 'bg-[var(--color-primary)] text-white'
                    }`}
                  >
                    {isModel ? <Sparkles className="w-4 h-4" /> : (user?.email?.charAt(0).toUpperCase() || 'U')}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`relative max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isModel
                        ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)]'
                        : 'bg-[var(--color-primary)] text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap select-text leading-relaxed font-sans">
                      {msg.text}
                    </div>

                    {isModel && (
                      <div className="mt-3.5 flex items-center justify-end gap-2.5 pt-2.5 border-t border-[var(--color-border)]/60 text-[11px] text-[var(--color-muted)]">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
                          title="Copy reply text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveToNote(msg.text)}
                          className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors ml-1"
                          title="Save insight to workspace notes"
                        >
                          <FilePlus className="w-3.5 h-3.5 text-purple-400" />
                          <span>Save to Note</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveToMemory(msg.text)}
                          className="flex items-center gap-1 text-[var(--color-ai)] hover:underline ml-1"
                          title="Save key insight to permanent AI memory"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          <span>Save to Memory</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Thinking Animation */}
            {loading && (
              <div className="flex items-start gap-3 sm:gap-4 max-w-4xl mx-auto">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--color-primary)] via-indigo-600 to-[var(--color-cyan)] text-white shadow-md">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-3.5 text-xs text-[var(--color-muted)] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-ping" />
                  <span>Thinking with full workspace context…</span>
                </div>
              </div>
            )}

            {/* Empty State / New Chat Screen (Gemini & ChatGPT style) */}
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-6 max-w-2xl mx-auto my-auto animate-fade-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-[var(--color-primary)] via-indigo-600 to-[var(--color-cyan)] text-white text-3xl shadow-2xl">
                  ✦
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)]">
                    What can I help you accomplish today?
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[var(--color-muted)] max-w-md mx-auto">
                    Ask me anything, attach documents or screenshots, or command me to schedule tasks, synthesize notes, and plan sprints!
                  </p>
                </div>

                {/* Quick Prompts Grid */}
                <div className="grid sm:grid-cols-2 gap-3 w-full pt-2 text-left">
                  {quickPrompts.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 hover:border-[var(--color-primary)] hover:shadow-lg transition-all group"
                    >
                      <strong className="block text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                        {item.title}
                      </strong>
                      <small className="block text-[11px] text-[var(--color-muted)] mt-1">
                        {item.desc}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Attached Media Previews */}
          {attachedMediaList.length > 0 && (
            <div className="flex items-center gap-2.5 overflow-x-auto border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 px-6 scrollbar-none">
              <span className="text-[11px] font-bold text-cyan-400 shrink-0 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Media ({attachedMediaList.length}):</span>
              </span>

              {attachedMediaList.map((media) => (
                <div
                  key={media.id}
                  className="relative flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 pr-2.5 text-xs text-[var(--color-text)] shrink-0"
                >
                  {media.mimeType.startsWith('image/') ? (
                    <img
                      src={media.dataUrl}
                      alt={media.name}
                      className="h-9 w-9 rounded-lg object-cover border border-[var(--color-border)]"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold text-[10px]">
                      DOC
                    </div>
                  )}

                  <div className="max-w-[120px] truncate">
                    <span className="block truncate text-[11px] font-medium">{media.name}</span>
                    <span className="block text-[9px] text-[var(--color-muted)] font-mono">
                      {(media.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachedMedia(media.id)}
                    className="rounded-full bg-red-500/20 text-red-400 p-0.5 hover:bg-red-500 hover:text-white transition-all ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Action Launcher Toolbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6 py-2 text-xs scrollbar-none">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)] mr-1 shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>AI Actions:</span>
            </span>

            <button
              type="button"
              onClick={() => triggerQuickAction('task')}
              className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] shrink-0 transition-all"
            >
              <CheckSquare className="w-3 h-3 text-cyan-400" />
              <span>+ Task</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction('note')}
              className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] shrink-0 transition-all"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              <span>+ Note</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction('flashcard')}
              className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] shrink-0 transition-all"
            >
              <GraduationCap className="w-3 h-3 text-pink-400" />
              <span>+ Flashcard</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction('event')}
              className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] shrink-0 transition-all"
            >
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>+ Event</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction('goal')}
              className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] shrink-0 transition-all"
            >
              <Target className="w-3 h-3 text-amber-400" />
              <span>+ Goal</span>
            </button>

            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="flex items-center gap-1 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20 shrink-0 transition-all ml-auto"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Upload Photo/Media</span>
            </button>
          </div>

          {/* Bottom Floating Prompt Dock (ChatGPT / Gemini style) */}
          <div className="p-3 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
            <div className="max-w-4xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all shadow-inner"
              >
                {/* Paperclip attachment button */}
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  title="Attach photos or documents"
                  className="p-2.5 rounded-2xl text-[var(--color-muted)] hover:text-cyan-400 hover:bg-white/5 transition-all shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Commanding Microphone Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title={isVoiceListening ? 'Stop listening' : 'Voice command AI assistant (Speak prompt)'}
                  className={`p-2.5 rounded-2xl transition-all shrink-0 ${
                    isVoiceListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                      : 'text-[var(--color-muted)] hover:text-purple-400 hover:bg-white/5'
                  }`}
                >
                  {isVoiceListening ? (
                    <Mic className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Multiline auto-expanding textarea */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask anything, formulate plans, or command AI to create tasks/notes… (Enter to send, Shift+Enter for new line)"
                  className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm text-[var(--color-text)] outline-none resize-none placeholder:text-[var(--color-muted)] max-h-[180px]"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || (!inputPrompt.trim() && attachedMediaList.length === 0)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
