import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Brain,
  Cpu,
  Zap,
  Volume2,
  Lock,
  Globe,
  Code,
  Shield,
  Check,
  RotateCcw,
  MessageSquare,
  Eye,
  SlidersHorizontal,
  Trash2,
  Plus,
  AlertTriangle,
  Search,
  UserCheck,
} from 'lucide-react';
import { AIMemoryItem } from '../../types';

export interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  memories?: AIMemoryItem[];
  onDeleteMemory?: (id: string) => Promise<void>;
  onClearMemories?: () => Promise<void>;
  onAddMemory?: (fact: string) => Promise<void>;
}

type TabType = 'general' | 'instructions' | 'memory';

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  memories = [],
  onDeleteMemory,
  onClearMemories,
  onAddMemory,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Custom Assistant Name
  const [assistantName, setAssistantName] = useState(() => {
    try {
      return localStorage.getItem('ai_pref_custom_name') || 'Personal AI';
    } catch {
      return 'Personal AI';
    }
  });

  // Model & Engine
  const [model, setModel] = useState(() => {
    try {
      return localStorage.getItem('ai_pref_model') || 'chatgpt-4o';
    } catch {
      return 'chatgpt-4o';
    }
  });

  // Persona & Tone
  const [persona, setPersona] = useState(() => {
    try {
      return localStorage.getItem('ai_pref_persona') || 'executive';
    } catch {
      return 'executive';
    }
  });

  // Temperature / Creativity (0.0 to 1.0)
  const [temperature, setTemperature] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ai_pref_temperature');
      return saved ? parseFloat(saved) : 0.7;
    } catch {
      return 0.7;
    }
  });

  // Memory & Context Injection
  const [contextMemoryEnabled, setContextMemoryEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_pref_memory_context') !== 'false';
    } catch {
      return true;
    }
  });

  const [autoSaveFacts, setAutoSaveFacts] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_pref_auto_save_facts') !== 'false';
    } catch {
      return true;
    }
  });

  // Tool Capabilities
  const [webSearchGrounding, setWebSearchGrounding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_pref_web_grounding') !== 'false';
    } catch {
      return true;
    }
  });

  const [codeExecution, setCodeExecution] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_pref_code_exec') !== 'false';
    } catch {
      return true;
    }
  });

  // ChatGPT 2-field Custom Instructions
  const [userBackground, setUserBackground] = useState(() => {
    try {
      return (
        localStorage.getItem('ai_pref_user_background') ||
        'Software engineer & workspace architect building modern web apps and high-performance workflows.'
      );
    } catch {
      return 'Software engineer & workspace architect building modern web apps and high-performance workflows.';
    }
  });

  const [responseStyle, setResponseStyle] = useState(() => {
    try {
      return (
        localStorage.getItem('ai_pref_response_style') ||
        'Be direct, prioritize actionable next steps, use markdown bullet formatting, and synthesize insights across tasks and notes.'
      );
    } catch {
      return 'Be direct, prioritize actionable next steps, use markdown bullet formatting, and synthesize insights across tasks and notes.';
    }
  });

  // Memory management state inside modal
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('ai_pref_custom_name', assistantName);
      localStorage.setItem('ai_pref_model', model);
      localStorage.setItem('ai_pref_persona', persona);
      localStorage.setItem('ai_pref_temperature', String(temperature));
      localStorage.setItem('ai_pref_memory_context', String(contextMemoryEnabled));
      localStorage.setItem('ai_pref_auto_save_facts', String(autoSaveFacts));
      localStorage.setItem('ai_pref_web_grounding', String(webSearchGrounding));
      localStorage.setItem('ai_pref_code_exec', String(codeExecution));
      localStorage.setItem('ai_pref_user_background', userBackground);
      localStorage.setItem('ai_pref_response_style', responseStyle);
      localStorage.setItem('ai_pref_custom_instructions', `${userBackground}\n\n${responseStyle}`);
    } catch {}
    onShowToast('✓ AI Assistant settings & preferences updated!');
    onClose();
  };

  const handleResetDefaults = () => {
    setAssistantName('Personal AI');
    setModel('chatgpt-4o');
    setPersona('executive');
    setTemperature(0.7);
    setContextMemoryEnabled(true);
    setAutoSaveFacts(true);
    setWebSearchGrounding(true);
    setCodeExecution(true);
    setUserBackground('Software engineer & workspace architect building modern web apps and high-performance workflows.');
    setResponseStyle('Be direct, prioritize actionable next steps, use markdown bullet formatting, and synthesize insights across tasks and notes.');
    onShowToast('Reset to default ChatGPT parameters.');
  };

  const handleCreateMemorySnippet = async () => {
    if (!newMemoryInput.trim()) return;
    setIsAddingMemory(true);
    try {
      if (onAddMemory) {
        await onAddMemory(newMemoryInput.trim());
      }
      setNewMemoryInput('');
      onShowToast('Fact added to AI Memory!');
    } catch (e) {
      console.warn('Memory add error:', e);
    } finally {
      setIsAddingMemory(false);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (!memorySearchQuery.trim()) return true;
    const q = memorySearchQuery.toLowerCase();
    return (
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.content && m.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-purple-950/40 via-[var(--color-surface)] to-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white font-black shadow-md shadow-purple-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[var(--color-text)]">
                  Settings &amp; Personalization
                </h3>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  ChatGPT Interface
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Manage custom instructions, foundation models, and AI memory in one place
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (ChatGPT Style) */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>General &amp; Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all ${
              activeTab === 'instructions'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Custom Instructions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all ${
              activeTab === 'memory'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Personalization &amp; Memory</span>
            {memories.length > 0 && (
              <span className="rounded-full bg-pink-500/20 text-pink-300 px-1.5 py-0.2 text-[9px] font-mono">
                {memories.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: GENERAL & ENGINE */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Custom Assistant Name */}
              <div className="space-y-2">
                <label className="block font-bold text-[var(--color-text)]">
                  Assistant Custom Display Name
                </label>
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="e.g. ChatGPT, Nova, Jarvis, Cortex"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text)] outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Foundation Model Selector */}
              <div className="space-y-3">
                <label className="block font-bold text-[var(--color-text)] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>Foundation Model Architecture</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Active</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'chatgpt-4o',
                      name: 'ChatGPT-4o (Omni)',
                      badge: 'ChatGPT Standard',
                      desc: 'Advanced reasoning, vision analysis, fast responses',
                    },
                    {
                      id: 'chatgpt-4o-mini',
                      name: 'GPT-4o Mini',
                      badge: 'Fast & Lightweight',
                      desc: 'Optimized for quick queries and rapid chat answers',
                    },
                    {
                      id: 'gemini-2.5-flash',
                      name: 'Gemini 2.5 Flash',
                      badge: 'Google Multimodal',
                      desc: 'Sub-second latency, document analysis, tool calling',
                    },
                    {
                      id: 'gemini-2.5-pro',
                      name: 'Gemini 2.5 Pro',
                      badge: 'Deep Reasoning',
                      desc: 'Complex code synthesis, academic research & planning',
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModel(m.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1.5 ${
                        model === m.id
                          ? 'border-purple-500 bg-purple-500/15 shadow-sm ring-1 ring-purple-500/40'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-[var(--color-text)]">{m.name}</strong>
                        {model === m.id ? (
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <span className="text-[9px] text-[var(--color-muted)] font-mono">{m.badge}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--color-muted)] leading-tight">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona & Tone */}
              <div className="space-y-3 border-t border-[var(--color-border)]/60 pt-5">
                <label className="block font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Persona &amp; Response Style</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'executive', name: 'Executive Chief', emoji: '👔' },
                    { id: 'socratic', name: 'Socratic Mentor', emoji: '🏛️' },
                    { id: 'architect', name: 'Tech Architect', emoji: '💻' },
                    { id: 'direct', name: 'Brutal Truth Coach', emoji: '🎯' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPersona(p.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        persona === p.id
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold shadow-sm'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <span className="text-base">{p.emoji}</span>
                      <span className="text-[11px] leading-tight">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Creativity Temperature Slider */}
              <div className="space-y-2 border-t border-[var(--color-border)]/60 pt-5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Creativity &amp; Temperature</span>
                  </label>
                  <span className="font-mono text-cyan-400 font-bold">{temperature}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[var(--color-muted)] shrink-0">Precise (0.0)</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[var(--color-bg-secondary)] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] text-[var(--color-muted)] shrink-0">Creative (1.0)</span>
                </div>
              </div>

              {/* Tools & Web Grounding */}
              <div className="space-y-3 border-t border-[var(--color-border)]/60 pt-5">
                <label className="block font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Grounding &amp; Tools</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <span className="font-semibold text-[var(--color-text)]">Web Grounding &amp; Search</span>
                    <button
                      type="button"
                      onClick={() => setWebSearchGrounding(!webSearchGrounding)}
                      className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                        webSearchGrounding ? 'bg-emerald-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          webSearchGrounding ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <span className="font-semibold text-[var(--color-text)]">Code Execution &amp; Sandbox</span>
                    <button
                      type="button"
                      onClick={() => setCodeExecution(!codeExecution)}
                      className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                        codeExecution ? 'bg-emerald-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          codeExecution ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM INSTRUCTIONS (ChatGPT Style) */}
          {activeTab === 'instructions' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300">
                <p className="font-semibold">
                  Custom instructions let you share anything you'd like the AI to consider in its responses.
                </p>
                <p className="text-[11px] text-[var(--color-muted)] mt-1">
                  Your preferences are automatically applied to every new chat conversation.
                </p>
              </div>

              {/* Field 1: What should the AI know about you? */}
              <div className="space-y-2">
                <label className="block font-bold text-[var(--color-text)]">
                  What would you like the AI to know about you to provide better responses?
                </label>
                <textarea
                  rows={4}
                  value={userBackground}
                  onChange={(e) => setUserBackground(e.target.value)}
                  placeholder="Where are you based? What do you do for work? What are your subjects or focus goals? What topics can you talk about for hours?"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 text-xs text-[var(--color-text)] outline-none leading-relaxed focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Field 2: How would you like the AI to respond? */}
              <div className="space-y-2">
                <label className="block font-bold text-[var(--color-text)]">
                  How would you like the AI to respond?
                </label>
                <textarea
                  rows={4}
                  value={responseStyle}
                  onChange={(e) => setResponseStyle(e.target.value)}
                  placeholder="How formal or casual should the AI be? How long or short should responses generally be? How do you want to be addressed? Should the AI have opinions on topics or remain neutral?"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 text-xs text-[var(--color-text)] outline-none leading-relaxed focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PERSONALIZATION & MEMORY (ChatGPT Style) */}
          {activeTab === 'memory' && (
            <div className="space-y-5">
              {/* Memory Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-[var(--color-text)]">
                      AI Memory
                    </strong>
                    <span className="rounded-full bg-pink-500/20 text-pink-300 text-[9px] px-2 py-0.5 font-bold">
                      ChatGPT Style
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                    As you chat, the AI becomes more helpful, remembering details and preferences across all chats.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContextMemoryEnabled(!contextMemoryEnabled)}
                  className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    contextMemoryEnabled ? 'bg-pink-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                      contextMemoryEnabled ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Save Facts Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div>
                  <strong className="block text-xs font-bold text-[var(--color-text)]">
                    Automatically update memory during chats
                  </strong>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Save key details and context without needing to ask explicitly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSaveFacts(!autoSaveFacts)}
                  className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 ${
                    autoSaveFacts ? 'bg-pink-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      autoSaveFacts ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Manage Memories Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[var(--color-text)]">
                      Manage Memories ({memories.length})
                    </h4>
                    <p className="text-[10px] text-[var(--color-muted)]">
                      View or remove specific facts the AI remembers about you.
                    </p>
                  </div>

                  {memories.length > 0 && onClearMemories && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Clear all AI memories? This cannot be undone.')) {
                          await onClearMemories();
                          onShowToast('All AI memories cleared.');
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 font-bold text-[11px] hover:underline"
                    >
                      Clear all memories
                    </button>
                  )}
                </div>

                {/* Add new memory input */}
                <div className="flex gap-2 p-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <input
                    type="text"
                    value={newMemoryInput}
                    onChange={(e) => setNewMemoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateMemorySnippet();
                    }}
                    placeholder="Teach a new fact (e.g. 'I prefer Next.js 14 with App Router')..."
                    className="flex-1 bg-transparent px-2 text-xs text-[var(--color-text)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateMemorySnippet}
                    disabled={isAddingMemory || !newMemoryInput.trim()}
                    className="rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
                  >
                    {isAddingMemory ? 'Adding…' : 'Add'}
                  </button>
                </div>

                {/* Memory Search */}
                {memories.length > 4 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={memorySearchQuery}
                      onChange={(e) => setMemorySearchQuery(e.target.value)}
                      placeholder="Search saved memories..."
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text)] outline-none"
                    />
                  </div>
                )}

                {/* Memories List */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredMemories.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 space-y-2 border border-dashed border-[var(--color-border)] rounded-2xl">
                      <Brain className="w-7 h-7 mx-auto opacity-30 text-pink-400" />
                      <p className="text-xs">No memories stored yet.</p>
                      <p className="text-[10px]">
                        As you chat, the AI will remember details here, or you can add them above.
                      </p>
                    </div>
                  ) : (
                    filteredMemories.map((m) => (
                      <div
                        key={m.id}
                        className="group flex items-start justify-between gap-3 p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-pink-500/30 transition-all"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs text-[var(--color-text)] leading-relaxed">
                            {m.content}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
                            <span>{new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleDateString()}</span>
                            {m.source && <span>• Source: {m.source}</span>}
                          </div>
                        </div>

                        {onDeleteMemory && (
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteMemory(m.id);
                              onShowToast('Memory removed.');
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100 shrink-0"
                            title="Forget memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-[var(--color-muted)] hover:text-[var(--color-text)] font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-text)] font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-black shadow-md transition-all cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
