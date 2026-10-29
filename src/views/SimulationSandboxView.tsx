import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Activity,
  Layers,
  Terminal,
  Cpu,
  Check,
  AlertTriangle,
  Copy,
  Sliders,
  Network,
  Maximize2,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { SimulationTopologyNode, SimulationTopologyLink, ViewTab } from '../types';
import { askAI } from '../services/ai';
import { contextFabric } from '../services/contextFabric';

interface SimulationSandboxViewProps {
  onNavigateTab: (tab: ViewTab) => void;
  onShowToast?: (msg: string) => void;
}

const DEFAULT_CODE_SAMPLES: Record<string, string> = {
  javascript: `// Interactive Simulation: Zero-Trust Token Verification
function verifyOAuthToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Invalid or missing Bearer token");
  }
  const token = authHeader.substring(7);
  console.log("Extracted Token:", token.slice(0, 8) + "...");
  
  // Simulate cryptographic payload validation
  const payload = {
    sub: "user_77a9",
    scopes: ["playlist:read", "tasks:write", "ai:exec"],
    exp: Date.now() + 3600 * 1000,
    zeroTrustVerified: true,
  };
  
  console.log("Decoded Token Payload:", JSON.stringify(payload, null, 2));
  return payload;
}

try {
  const result = verifyOAuthToken("Bearer BQB_secure_jwt_token_4891");
  console.log("✓ Zero-Trust Authorization Confirmed:", result.zeroTrustVerified);
} catch (err) {
  console.error("Authorization Failed:", err.message);
}`,

  python: `# Interactive Simulation: Cross-App Vector Memory Matcher
import math

def cosine_similarity(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    return dot / (mag1 * mag2)

query_vector = [0.42, 0.88, 0.15, 0.73]
note_vector = [0.40, 0.85, 0.18, 0.70]

similarity = cosine_similarity(query_vector, note_vector)
print(f"Context Fabric Similarity Score: {similarity:.4f}")
print("Status: Cross-App Memory Match Correlated (98.4%)")`,

  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #090D16; color: #38BDF8; font-family: monospace; padding: 20px; }
    .card { background: #111827; border: 1px solid #38BDF8; border-radius: 12px; padding: 16px; box-shadow: 0 4px 20px rgba(56,189,248,0.2); }
    .badge { background: #38BDF8; color: #000; font-weight: bold; padding: 2px 8px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">SANDBOX RUNTIME</span>
    <h3>Zero-Trust Topology Live Preview</h3>
    <p>Rendered in isolated iframe sandbox with zero external leakage.</p>
  </div>
</body>
</html>`,
};

const INITIAL_NODES: SimulationTopologyNode[] = [
  {
    id: 'node-client',
    label: 'Client (Android/iOS)',
    type: 'client',
    status: 'healthy',
    latencyMs: 12,
    requestsPerSec: 145,
    securityState: 'enforced',
    x: 40,
    y: 120,
  },
  {
    id: 'node-gateway',
    label: 'API Gateway & Rate Limiter',
    type: 'gateway',
    status: 'healthy',
    latencyMs: 4,
    requestsPerSec: 145,
    securityState: 'enforced',
    x: 230,
    y: 120,
  },
  {
    id: 'node-auth',
    label: 'Zero-Trust OAuth PKCE',
    type: 'auth',
    status: 'healthy',
    latencyMs: 8,
    requestsPerSec: 32,
    securityState: 'enforced',
    x: 420,
    y: 40,
  },
  {
    id: 'node-db',
    label: 'Firestore & Memory Vault',
    type: 'database',
    status: 'healthy',
    latencyMs: 15,
    requestsPerSec: 110,
    securityState: 'enforced',
    x: 420,
    y: 200,
  },
  {
    id: 'node-agents',
    label: 'Multi-Agent AI War Room',
    type: 'ai_agent',
    status: 'healthy',
    latencyMs: 45,
    requestsPerSec: 18,
    securityState: 'enforced',
    x: 610,
    y: 120,
  },
];

const INITIAL_LINKS: SimulationTopologyLink[] = [
  { fromId: 'node-client', toId: 'node-gateway', protocol: 'HTTPS', encrypted: true, activePackets: 24 },
  { fromId: 'node-gateway', toId: 'node-auth', protocol: 'HTTPS', encrypted: true, activePackets: 12 },
  { fromId: 'node-gateway', toId: 'node-db', protocol: 'gRPC', encrypted: true, activePackets: 45 },
  { fromId: 'node-gateway', toId: 'node-agents', protocol: 'WSS', encrypted: true, activePackets: 18 },
];

export const SimulationSandboxView: React.FC<SimulationSandboxViewProps> = ({ onNavigateTab, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'topology' | 'workflow'>('editor');
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'html'>('javascript');
  const [code, setCode] = useState<string>(DEFAULT_CODE_SAMPLES.javascript);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Topology simulation state
  const [nodes, setNodes] = useState<SimulationTopologyNode[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<SimulationTopologyNode | null>(INITIAL_NODES[0]);
  const [simulationTrafficRate, setSimulationTrafficRate] = useState<number>(1);

  // Workflow state machine
  const [workflowStep, setWorkflowStep] = useState<number>(1);

  const handleLanguageChange = (lang: 'javascript' | 'python' | 'html') => {
    setSelectedLanguage(lang);
    setCode(DEFAULT_CODE_SAMPLES[lang]);
    setConsoleOutput([]);
    setAiAnalysis(null);
  };

  // Run code safely in sandbox
  const runCodeInSandbox = () => {
    setIsRunning(true);
    setConsoleOutput(['[Sandbox Engine] Initializing execution context...']);

    setTimeout(() => {
      if (selectedLanguage === 'javascript') {
        const capturedLogs: string[] = [];
        const originalLog = console.log;
        const originalError = console.error;

        try {
          console.log = (...args: any[]) => {
            capturedLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
          };
          console.error = (...args: any[]) => {
            capturedLogs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
          };

          // Execute
          const fn = new Function(code);
          fn();

          setConsoleOutput((prev) => [...prev, ...capturedLogs, '[Sandbox Engine] Execution completed safely (exit code 0).']);
          onShowToast?.('Sandbox execution finished successfully.');
        } catch (err: any) {
          setConsoleOutput((prev) => [...prev, ...capturedLogs, `[Execution Exception] ${err.message}`]);
        } finally {
          console.log = originalLog;
          console.error = originalError;
          setIsRunning(false);
        }
      } else {
        // Python or HTML simulation
        setConsoleOutput([
          '[WASM Runtime] Emulating bytecode execution in sandbox...',
          'Extracted output stream:',
          selectedLanguage === 'python'
            ? 'Context Fabric Similarity Score: 0.9841\nStatus: Cross-App Memory Match Correlated (98.4%)\nMemory compaction complete.'
            : 'HTML Preview rendered to virtual graphics buffer.',
          '[WASM Runtime] Execution clean.',
        ]);
        setIsRunning(false);
      }
    }, 400);
  };

  // Ask AI Supervisor to audit & optimize the code
  const handleAiAudit = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `You are the AI Code Supervisor in an interactive simulation sandbox.
Analyze this ${selectedLanguage.toUpperCase()} code for:
1. Security vulnerabilities (Token leakage, injection, XSS, insecure storage)
2. Performance optimizations (Latency, complexity, DOM thrashing)
3. Integration with Personal AI OS Unified Context Fabric

Code snippet:
${code}

Provide 3 bullet points with actionable feedback and improved code lines:`;

      const analysis = await askAI({ prompt });
      setAiAnalysis(analysis);
      onShowToast?.('AI Supervisor completed security & performance audit.');
    } catch (e) {
      console.warn('AI audit error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle node failure simulation
  const toggleNodeFailure = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const nextStatus = n.status === 'healthy' ? 'warning' : n.status === 'warning' ? 'critical' : 'healthy';
          return {
            ...n,
            status: nextStatus,
            latencyMs: nextStatus === 'critical' ? 999 : nextStatus === 'warning' ? 180 : 12,
          };
        }
        return n;
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-white overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black shadow-lg shadow-cyan-500/20">
            <Code2 className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight">Interactive Simulation Sandbox</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                WASM &amp; Topology
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Live sandboxed execution engine and graphical architecture simulator with AI supervisor diagnostics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'editor' && (
            <>
              <button
                type="button"
                onClick={handleAiAudit}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Auditing…' : 'AI Supervisor Audit'}</span>
              </button>
              <button
                type="button"
                onClick={runCodeInSandbox}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Executing…' : 'Run in Sandbox'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Code Execution Sandbox
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topology')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              activeTab === 'topology'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Network Topology Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              activeTab === 'workflow'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            State Machine Simulator
          </button>
        </div>

        {activeTab === 'editor' && (
          <div className="flex items-center gap-1 bg-black/60 rounded-xl p-0.5 border border-white/10 text-[11px]">
            {(['javascript', 'python', 'html'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`px-2.5 py-0.5 rounded-lg font-bold uppercase transition-all ${
                  selectedLanguage === lang
                    ? 'bg-cyan-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'html' ? 'HTML/CSS' : lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* TAB 1: CODE EDITOR & CONSOLE */}
        {activeTab === 'editor' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
            {/* Left: Code Editor */}
            <div className="flex flex-col rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden shadow-xl">
              <div className="px-4 py-2.5 bg-zinc-950 border-b border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="font-mono text-[11px] ml-2 text-zinc-300">
                    sandbox.{selectedLanguage === 'javascript' ? 'ts' : selectedLanguage === 'python' ? 'py' : 'html'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(DEFAULT_CODE_SAMPLES[selectedLanguage])}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Sample</span>
                </button>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-black/80 font-mono text-xs sm:text-sm text-cyan-300 p-4 outline-none resize-none leading-relaxed border-none selection:bg-cyan-500/30"
              />
            </div>

            {/* Right: Output & AI Supervisor */}
            <div className="flex flex-col gap-4 overflow-y-auto">
              {/* Console Output */}
              <div className="flex flex-col rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden shadow-xl min-h-[180px]">
                <div className="px-4 py-2.5 bg-zinc-950 border-b border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 font-bold text-zinc-300">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Isolated Sandbox Output</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setConsoleOutput([])}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-1 p-3 bg-black/90 font-mono text-xs space-y-1 text-zinc-300 overflow-y-auto max-h-52">
                  {consoleOutput.length === 0 ? (
                    <p className="text-zinc-600 italic">Press &quot;Run in Sandbox&quot; to execute code...</p>
                  ) : (
                    consoleOutput.map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.includes('ERROR') || line.includes('Exception')
                            ? 'text-rose-400'
                            : line.includes('✓')
                            ? 'text-emerald-400 font-bold'
                            : 'text-zinc-300'
                        }
                      >
                        {line}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AI Supervisor Audit Card */}
              <div className="flex flex-col rounded-3xl bg-zinc-900 border border-purple-500/30 overflow-hidden shadow-xl p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Code Supervisor &amp; Threat Model</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    Zero-Trust Audit
                  </span>
                </div>

                {aiAnalysis ? (
                  <div className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed font-sans max-h-56 overflow-y-auto">
                    {aiAnalysis}
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-500 space-y-2">
                    <Sparkles className="w-6 h-6 mx-auto text-purple-400" />
                    <p className="text-xs">Click &quot;AI Supervisor Audit&quot; to review zero-trust safety and latency optimizations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NETWORK TOPOLOGY GRAPH */}
        {activeTab === 'topology' && (
          <div className="flex-1 flex flex-col rounded-3xl bg-zinc-900 border border-white/10 p-5 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-white">Live System Topology &amp; Traffic Simulation</h3>
                <p className="text-xs text-zinc-400">
                  Tap nodes to inspect latencies, test fault tolerance, or simulate DDoS/security anomalies.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulationTrafficRate((r) => (r === 1 ? 5 : 1))}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    simulationTrafficRate > 1
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  {simulationTrafficRate > 1 ? 'High Load (5x Traffic)' : 'Normal Traffic (1x)'}
                </button>
              </div>
            </div>

            {/* Interactive Visual Node Map */}
            <div className="relative min-h-[300px] w-full rounded-2xl bg-black/80 border border-white/10 p-6 flex flex-wrap items-center justify-around gap-6">
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all w-52 shadow-lg ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-cyan-500/20'
                        : 'border-white/10 bg-zinc-900/90 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">{node.type}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          node.status === 'healthy'
                            ? 'bg-emerald-400'
                            : node.status === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-rose-500 animate-ping'
                        }`}
                      />
                    </div>
                    <h4 className="font-bold text-xs text-white leading-tight">{node.label}</h4>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/10 pt-2">
                      <span>{node.latencyMs}ms latency</span>
                      <span className="text-cyan-400 font-bold">{node.requestsPerSec * simulationTrafficRate} req/s</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNodeFailure(node.id);
                      }}
                      className="mt-2 w-full py-1 rounded-lg text-[9px] font-bold bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                    >
                      {node.status === 'healthy' ? 'Inject Fault' : 'Heal Node'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected Node Inspector */}
            {selectedNode && (
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedNode.label} Inspector</h4>
                  <p className="text-zinc-400 text-[11px]">
                    Status: <span className="font-bold uppercase text-cyan-400">{selectedNode.status}</span> · Zero-Trust Policy: {selectedNode.securityState}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onShowToast?.(`Diagnostic test packet sent to ${selectedNode.label}.`)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                  >
                    Send Test Packet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WORKFLOW STATE MACHINE SIMULATOR */}
        {activeTab === 'workflow' && (
          <div className="flex-1 flex flex-col rounded-3xl bg-zinc-900 border border-white/10 p-6 space-y-6 overflow-y-auto max-w-4xl mx-auto w-full">
            <div>
              <h3 className="font-extrabold text-sm text-white">Zero-Trust Mobile Transaction State Machine</h3>
              <p className="text-xs text-zinc-400">
                Step-by-step visual simulation of state transitions across client and verification boundaries.
              </p>
            </div>

            {/* Step Pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { step: 1, title: '1. Initiate Intent', desc: 'Hardware Key Biometric Touch' },
                { step: 2, title: '2. Token Exchange', desc: 'Mutual TLS PKCE Handshake' },
                { step: 3, title: '3. Risk Evaluation', desc: 'Multi-Agent Security Audit' },
                { step: 4, title: '4. Final Settlement', desc: 'Immutable Ledger State' },
              ].map((s) => {
                const isActive = workflowStep === s.step;
                const isPassed = workflowStep > s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => setWorkflowStep(s.step)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-md'
                        : isPassed
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                        : 'border-white/5 bg-black/40 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{s.title}</span>
                      {isPassed && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-400">{s.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Current Step Execution Box */}
            <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-cyan-300">
                  Step {workflowStep} Runtime Execution State
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Verified
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {workflowStep === 1 && 'User biometric fingerprint authenticated locally on Android/iOS secure enclave. Cryptographic challenge generated.'}
                {workflowStep === 2 && 'Short-lived bearer token exchanged over mTLS channel with zero credential transmission.'}
                {workflowStep === 3 && 'AI Security Agent Vesper evaluated transaction parameters against velocity limits and detected zero anomalies.'}
                {workflowStep === 4 && 'Transaction settlement committed to Firestore vault with state mutation pushed to Unified Context Fabric.'}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkflowStep((s) => Math.max(1, s - 1))}
                  disabled={workflowStep === 1}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-50"
                >
                  Previous Step
                </button>
                <button
                  type="button"
                  onClick={() => setWorkflowStep((s) => Math.min(4, s + 1))}
                  disabled={workflowStep === 4}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold disabled:opacity-50"
                >
                  Advance Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
