import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Shield,
  Layers,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Check,
  Send,
  MessageSquare,
  Network,
  Cpu,
  Flame,
  FileCheck,
  Share2,
  Code2,
  Copy,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { WarRoomAgent, WarRoomMessage, WarRoomMission, ViewTab } from '../types';
import { askAI } from '../services/ai';
import { contextFabric } from '../services/contextFabric';

interface WarRoomsViewProps {
  onNavigateTab: (tab: ViewTab) => void;
  onShowToast?: (msg: string) => void;
}

const AGENTS: WarRoomAgent[] = [
  {
    id: 'agent_architect',
    name: 'Aiden',
    role: 'architect',
    title: 'Lead Systems Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    badge: 'System Design',
    color: 'from-cyan-500 to-blue-600',
    specialty: 'Distributed graphs, micro-frontends, event-driven state streams',
    bias: 'Pushes for modular decoupling and clean contract boundaries.',
  },
  {
    id: 'agent_security',
    name: 'Vesper',
    role: 'security',
    title: 'Zero-Trust Security Auditor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    badge: 'Zero Trust',
    color: 'from-rose-500 to-red-600',
    specialty: 'OAuth 2.0 PKCE, biometric hardware keys, token replay defense',
    bias: 'Challenges any architectural shortcut as a potential attack surface.',
  },
  {
    id: 'agent_creative',
    name: 'Lyra',
    role: 'creative',
    title: 'Product & UX Strategist',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    badge: 'Experience',
    color: 'from-fuchsia-500 to-pink-600',
    specialty: 'Fluid micro-interactions, spatial gestures, Zero-UI command palettes',
    bias: 'Insists on zero user friction and delightful ambient feedback.',
  },
  {
    id: 'agent_perf',
    name: 'Kael',
    role: 'performance',
    title: 'Edge & Performance Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    badge: 'Sub-10ms Latency',
    color: 'from-amber-500 to-orange-600',
    specialty: 'WebSockets, WASM sandboxing, memory compaction, interruptible streams',
    bias: 'Benchmarking obsessed; refuses unneeded roundtrips and DOM thrashing.',
  },
];

const PRESET_MISSIONS: Array<{ title: string; objective: string }> = [
  {
    title: 'Cross-App Unified Context Fabric',
    objective:
      'Design a real-time event-driven memory stream that correlates active notes, code sandboxes, and lounge threads without manual user copy-pasting.',
  },
  {
    title: 'Zero-Trust Mobile Payments & Auth',
    objective:
      'Architect an end-to-end encrypted mobile transaction pipeline with ephemeral sessions, biometric verification, and zero credential exposure.',
  },
  {
    title: 'Interruptible Ambient Voice Stream',
    objective:
      'Construct a low-latency voice pipeline allowing instantaneous barge-in speech interruption and spatial audio state management on Android & iOS.',
  },
];

export const WarRoomsView: React.FC<WarRoomsViewProps> = ({ onNavigateTab, onShowToast }) => {
  const [activeMission, setActiveMission] = useState<string>(PRESET_MISSIONS[0].title);
  const [objective, setObjective] = useState<string>(PRESET_MISSIONS[0].objective);
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'split' | 'blueprint'>('feed');
  const [directorInput, setDirectorInput] = useState<string>('');
  const [synthesizedPlan, setSynthesizedPlan] = useState<string | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<WarRoomMessage[]>([
    {
      id: 'wm-1',
      agentId: 'agent_architect',
      agentName: 'Aiden',
      role: 'architect',
      content:
        'To establish a true Unified Context Fabric, we must avoid localized siloed states. I propose an in-memory event-bus that indexes delta mutations from Notes, Tasks, and Code, assigning vector-like semantic correlation scores.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      tags: ['event-bus', 'architecture', 'reactive'],
      voteScore: 4,
    },
    {
      id: 'wm-2',
      agentId: 'agent_security',
      agentName: 'Vesper',
      role: 'security',
      critiqueOfAgentId: 'agent_architect',
      content:
        'A single event bus is an attack vector if context leaks across tenant or authorization boundaries. The Fabric must enforce strict field-level redaction so sensitive tokens or diary secrets never cross into public Lounge chats without explicit user intent.',
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      tags: ['data-boundary', 'zero-trust', 'redaction'],
      voteScore: 6,
    },
    {
      id: 'wm-3',
      agentId: 'agent_creative',
      agentName: 'Lyra',
      role: 'creative',
      content:
        'From a UX perspective, users do not want to configure access controls manually. We should present "Context Bubbles" right inside chat or editor sidebars that glow when correlated, allowing 1-tap injection.',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      tags: ['context-bubbles', 'ux-elegance', 'zero-ui'],
      voteScore: 5,
    },
    {
      id: 'wm-4',
      agentId: 'agent_perf',
      agentName: 'Kael',
      role: 'performance',
      content:
        'Agreed on simplicity, but memory compaction is critical. We cap the active stream to the top 50 correlated nodes with debounced localStorage snapshots, keeping UI frame rate locked at 60 FPS on mobile devices.',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      tags: ['60fps', 'compaction', 'mobile-perf'],
      voteScore: 7,
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Launch a multi-agent debate turn
  const runDebateTurn = async (customDirectorPrompt?: string) => {
    setIsDebating(true);
    try {
      // Pick random next speaker from the 4 agents
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const recentHistory = messages
        .slice(-4)
        .map((m) => `${m.agentName} (${m.role}): ${m.content}`)
        .join('\n');

      const prompt = `You are ${agent.name}, the ${agent.title} in an elite multi-agent AI War Room.
Mission Objective: "${objective}"
Specialty: ${agent.specialty}. Bias: ${agent.bias}.
Recent Debate Context:
${recentHistory}
${customDirectorPrompt ? `Lead Director Directive: "${customDirectorPrompt}"` : ''}

Provide your punchy, high-impact assessment (2-3 sentences max). Critique or build upon a colleague's point, propose a concrete pattern, and give a technical recommendation.`;

      const aiResponse = await askAI({ prompt });
      const cleanText = aiResponse.trim();

      const newMsg: WarRoomMessage = {
        id: `wm-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        content: cleanText || `${agent.name}: Verified. We need to implement this with strict guarantees.`,
        timestamp: new Date().toISOString(),
        tags: [agent.role, 'consensus'],
        voteScore: Math.floor(Math.random() * 5) + 3,
      };

      setMessages((prev) => [...prev, newMsg]);

      // Add to context fabric automatically
      contextFabric.addItem({
        sourceModule: 'code',
        title: `War Room Debate: ${agent.name} on ${activeMission}`,
        excerpt: cleanText.slice(0, 140),
        tags: ['war-room', agent.role, 'architecture'],
        correlationScore: 0.96,
      });
    } catch (e) {
      console.warn('Debate error:', e);
    } finally {
      setIsDebating(false);
    }
  };

  const handleDirectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorInput.trim() || isDebating) return;

    const userText = directorInput.trim();
    setDirectorInput('');

    // Add Director message
    const dirMsg: WarRoomMessage = {
      id: `wm-${Date.now()}`,
      agentId: 'director_user',
      agentName: 'You (Lead Director)',
      role: 'director',
      content: userText,
      timestamp: new Date().toISOString(),
      tags: ['director-command'],
      voteScore: 10,
    };

    setMessages((prev) => [...prev, dirMsg]);
    runDebateTurn(userText);
  };

  const handleSynthesizePlan = async () => {
    setIsDebating(true);
    try {
      const summaryContext = messages.map((m) => `${m.agentName}: ${m.content}`).join('\n\n');
      const prompt = `Synthesize an authoritative, production-grade Execution Blueprint for:
Mission: "${activeMission}"
Objective: "${objective}"

Based on the debate points from Architect, Security, UX, and Performance agents:
${summaryContext}

Format as markdown with:
1. Executive Architectural Blueprint
2. Security & Zero-Trust Threat Model
3. High-Performance Mobile/Desktop Implementation Spec
4. Action Checklist for Developers`;

      const result = await askAI({ prompt });
      setSynthesizedPlan(result);
      setActiveTab('blueprint');
      onShowToast?.('Consensus reached! Execution Blueprint generated.');
    } catch (e) {
      console.warn('Plan synthesis error:', e);
    } finally {
      setIsDebating(false);
    }
  };

  const handleCopyPlan = () => {
    if (synthesizedPlan) {
      navigator.clipboard.writeText(synthesizedPlan);
      setCopiedPlan(true);
      setTimeout(() => setCopiedPlan(false), 2000);
      onShowToast?.('Execution blueprint copied to clipboard!');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-white overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
            <Users className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight">Multi-Agent War Room</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Autonomous Debates
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive strategic simulation where specialized agents debate and solve complex problems under your direction.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => runDebateTurn()}
            disabled={isDebating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isDebating ? 'animate-spin' : ''}`} />
            <span>{isDebating ? 'Agents Debating…' : 'Trigger Agent Debate'}</span>
          </button>

          <button
            type="button"
            onClick={handleSynthesizePlan}
            disabled={isDebating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Synthesize Blueprint</span>
          </button>
        </div>
      </div>

      {/* Preset Missions Selector */}
      <div className="px-4 py-2 bg-zinc-900/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
          Mission Preset:
        </span>
        {PRESET_MISSIONS.map((m) => (
          <button
            key={m.title}
            type="button"
            onClick={() => {
              setActiveMission(m.title);
              setObjective(m.objective);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeMission === m.title
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            {m.title}
          </button>
        ))}
      </div>

      {/* 4 Agent Profile Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 sm:px-4 bg-zinc-950 border-b border-white/10">
        {AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="p-2.5 rounded-2xl bg-zinc-900/70 border border-white/5 hover:border-white/20 transition-all flex items-center gap-2.5 shadow-sm"
          >
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate">{agent.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-white/10 text-zinc-300">
                  {agent.badge}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">{agent.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Switcher: Live Stream Feed / Split View / Blueprint */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Debate Stream ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              activeTab === 'split'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Split Stances View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              activeTab === 'blueprint'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Execution Blueprint {synthesizedPlan ? '✓' : ''}
          </button>
        </div>

        <span className="text-[10px] text-zinc-400 hidden sm:inline">
          Lead Director: You hold veto authority &amp; final plan synthesis.
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: LIVE DEBATE STREAM */}
        {activeTab === 'feed' && (
          <div className="max-w-4xl mx-auto space-y-3">
            {messages.map((msg) => {
              const isDirector = msg.role === 'director';
              const agentObj = AGENTS.find((a) => a.id === msg.agentId);

              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDirector
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-100 ml-6 sm:ml-12'
                      : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isDirector ? (
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-xs">
                          ★
                        </div>
                      ) : (
                        agentObj && (
                          <img
                            src={agentObj.avatar}
                            alt=""
                            className="w-6 h-6 rounded-lg object-cover border border-white/10"
                          />
                        )
                      )}
                      <span className="font-bold text-xs text-white">{msg.agentName}</span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 px-1.5 py-0.5 rounded-md bg-white/5">
                        {msg.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.voteScore && (
                        <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                          <ThumbsUp className="w-2.5 h-2.5" />
                          {msg.voteScore}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed pl-8">
                    {msg.content}
                  </p>

                  {msg.tags && msg.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pl-8">
                      {msg.tags.map((t) => (
                        <span key={t} className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* TAB 2: SPLIT STANCES VIEW */}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {AGENTS.map((agent) => {
              const agentMessages = messages.filter((m) => m.agentId === agent.id);
              return (
                <div
                  key={agent.id}
                  className="p-4 rounded-3xl bg-zinc-900 border border-white/10 flex flex-col space-y-3"
                >
                  <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                    <img
                      src={agent.avatar}
                      alt=""
                      className="w-10 h-10 rounded-2xl object-cover border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-white">{agent.name}</h3>
                      <p className="text-[11px] text-zinc-400">{agent.title}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                      {agent.badge}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 italic">
                    &quot;{agent.bias}&quot;
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-60">
                    {agentMessages.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-4 text-center">Standing by for next debate round...</p>
                    ) : (
                      agentMessages.map((m) => (
                        <div key={m.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200">
                          <p>{m.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: EXECUTION BLUEPRINT */}
        {activeTab === 'blueprint' && (
          <div className="max-w-4xl mx-auto bg-zinc-900 rounded-3xl border border-emerald-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Synthesized Execution Blueprint</h3>
                  <p className="text-xs text-zinc-400">Consensus generated across 4 specialized agents</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPlan}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPlan ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('simulation');
                    onShowToast?.('Blueprint exported to Simulation Sandbox.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Test in Sandbox</span>
                </button>
              </div>
            </div>

            {synthesizedPlan ? (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-200 whitespace-pre-line leading-relaxed font-sans">
                {synthesizedPlan}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-400 space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-amber-400 animate-pulse" />
                <p className="text-xs font-semibold">No plan synthesized yet.</p>
                <button
                  type="button"
                  onClick={handleSynthesizePlan}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
                >
                  Click to Synthesize Multi-Agent Consensus
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Director Prompt Input Bar */}
      <div className="p-3 bg-zinc-950 border-t border-white/10">
        <form onSubmit={handleDirectorSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Director Directive: Challenge Vesper on zero-trust latency, or propose fallback..."
            value={directorInput}
            onChange={(e) => setDirectorInput(e.target.value)}
            disabled={isDebating}
            className="flex-1 rounded-2xl bg-zinc-900 border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!directorInput.trim() || isDebating}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Direct</span>
          </button>
        </form>
      </div>
    </div>
  );
};
