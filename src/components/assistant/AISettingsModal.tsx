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
} from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  // Model & Engine
  const [model, setModel] = useState(() => {
    try {
      return localStorage.getItem('ai_pref_model') || 'gemini-2.5-flash';
    } catch {
      return 'gemini-2.5-flash';
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

  const [visionMultimodal, setVisionMultimodal] = useState<boolean>(true);

  // Custom System Instructions
  const [customInstructions, setCustomInstructions] = useState(() => {
    try {
      return (
        localStorage.getItem('ai_pref_custom_instructions') ||
        'Be direct, prioritize actionable next steps, use markdown bullet formatting, and synthesize insights across tasks and notes.'
      );
    } catch {
      return 'Be direct, prioritize actionable next steps, use markdown bullet formatting, and synthesize insights across tasks and notes.';
    }
  });

  // TTS Voice
  const [ttsVoice, setTtsVoice] = useState('Puck');
  const [autoSpeak, setAutoSpeak] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('ai_pref_model', model);
      localStorage.setItem('ai_pref_persona', persona);
      localStorage.setItem('ai_pref_temperature', String(temperature));
      localStorage.setItem('ai_pref_memory_context', String(contextMemoryEnabled));
      localStorage.setItem('ai_pref_auto_save_facts', String(autoSaveFacts));
      localStorage.setItem('ai_pref_web_grounding', String(webSearchGrounding));
      localStorage.setItem('ai_pref_code_exec', String(codeExecution));
      localStorage.setItem('ai_pref_custom_instructions', customInstructions);
    } catch {}
    onShowToast('✓ AI Assistant intelligence parameters saved live!');
    onClose();
  };

  const handleResetDefaults = () => {
    setModel('gemini-2.5-flash');
    setPersona('executive');
    setTemperature(0.7);
    setContextMemoryEnabled(true);
    setAutoSaveFacts(true);
    setWebSearchGrounding(true);
    setCodeExecution(true);
    setCustomInstructions('Be direct, prioritize actionable next steps, use markdown bullet formatting, and synthesize insights across tasks and notes.');
    onShowToast('Reset to default balanced parameters.');
  };

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
                  AI Assistant Settings &amp; Intelligence Controls
                </h3>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  v3.8
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Tune model architecture, personality persona, memory retention &amp; tool capabilities
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Foundation Model Selector */}
          <div className="space-y-3">
            <label className="block font-bold text-[var(--color-text)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Foundation Model Architecture</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Server-Side Active</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'gemini-2.5-flash',
                  name: 'Gemini 2.5 Flash',
                  badge: 'Recommended',
                  desc: 'Sub-second latency, multimodal reasoning, tool calling',
                },
                {
                  id: 'gemini-2.5-pro',
                  name: 'Gemini 2.5 Pro',
                  badge: 'Deep Reasoning',
                  desc: 'Complex code generation, academic synthesis & planning',
                },
                {
                  id: 'chatgpt-4o',
                  name: 'OpenAI GPT-4o',
                  badge: 'Alternative',
                  desc: 'Cross-model verification and comparative logic',
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

          {/* Section 2: AI Persona & Tone */}
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

          {/* Section 3: Creativity Temperature Slider */}
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

          {/* Section 4: Memory & Workspace Context Retention */}
          <div className="space-y-3 border-t border-[var(--color-border)]/60 pt-5">
            <label className="block font-bold text-[var(--color-text)] flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-pink-400" />
              <span>Workspace Memory &amp; Semantic Grounding</span>
            </label>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div>
                  <strong className="block text-xs font-bold text-[var(--color-text)]">
                    Inject Active Workspace Facts
                  </strong>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Automatically injects memories, tasks, and project goals into the assistant prompt context.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContextMemoryEnabled(!contextMemoryEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    contextMemoryEnabled ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      contextMemoryEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div>
                  <strong className="block text-xs font-bold text-[var(--color-text)]">
                    Auto-Extract Facts from Chats
                  </strong>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Synthesizes key takeaways, project names, and preferences into AI Memory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSaveFacts(!autoSaveFacts)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    autoSaveFacts ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoSaveFacts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Real-time Tools & Web Grounding */}
          <div className="space-y-3 border-t border-[var(--color-border)]/60 pt-5">
            <label className="block font-bold text-[var(--color-text)] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Tools &amp; Capabilities</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <span className="font-semibold text-[var(--color-text)]">Google Web Grounding</span>
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
                <span className="font-semibold text-[var(--color-text)]">Code Sandbox Execution</span>
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

          {/* Section 6: Custom System Instructions */}
          <div className="space-y-2 border-t border-[var(--color-border)]/60 pt-5">
            <label className="block font-bold text-[var(--color-text)] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Custom System Instructions &amp; Persona Prompt</span>
            </label>
            <textarea
              rows={3}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="What would you like the AI Assistant to always keep in mind? (e.g. Always write clean TypeScript, focus on high ROI tasks)..."
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text)] outline-none leading-relaxed focus:border-purple-500 transition-colors"
            />
          </div>
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
              Save AI Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
