import React, { useState } from 'react';
import {
  Brain,
  Layers,
  Sparkles,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  Code2,
  FileText,
  CheckSquare,
  MessageSquare,
  Book,
  Radio,
  Shield,
  Zap,
  Trash2,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { useContextFabricStream } from '../../services/contextFabric';
import { ContextFabricItem, ViewTab } from '../../types';

interface ContextFabricHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ViewTab) => void;
  onInjectIntoAI?: (contextText: string) => void;
}

export const ContextFabricHUD: React.FC<ContextFabricHUDProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onInjectIntoAI,
}) => {
  const { items, addItem, removeItem, resetToDefaults, clearAll } = useContextFabricStream();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newModule, setNewModule] = useState<ContextFabricItem['sourceModule']>('code');
  const [newTags, setNewTags] = useState('security, architecture');

  if (!isOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).slice(0, 12);

  const filteredItems = selectedTag
    ? items.filter((i) => i.tags.includes(selectedTag))
    : items;

  const getModuleIcon = (mod: ContextFabricItem['sourceModule']) => {
    switch (mod) {
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'notes':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'tasks':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'diary':
        return <Book className="w-3.5 h-3.5 text-purple-400" />;
      case 'chat':
        return <MessageSquare className="w-3.5 h-3.5 text-pink-400" />;
      case 'spotify':
        return <Radio className="w-3.5 h-3.5 text-green-400" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addItem({
      sourceModule: newModule,
      title: newTitle.trim(),
      excerpt: newExcerpt.trim() || 'Custom context stream item linked across OS modules.',
      tags: newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      correlationScore: 0.95,
    });
    setNewTitle('');
    setNewExcerpt('');
    setIsAdding(false);
  };

  const handleInjectAll = () => {
    const contextPrompt = items
      .map(
        (i, idx) =>
          `[Context ${idx + 1} from ${i.sourceModule.toUpperCase()}: "${i.title}"]\n${i.excerpt}`
      )
      .join('\n\n');
    if (onInjectIntoAI) {
      onInjectIntoAI(contextPrompt);
      onNavigateTab('assistant');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full sm:w-[480px] h-full bg-zinc-950/95 border-l border-cyan-500/30 flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/70 via-zinc-900 to-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white">Unified Context Fabric</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Real-time
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Cross-app memory &amp; state correlation engine</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInjectAll}
              title="Feed all active context to AI Assistant"
              className="p-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="px-4 py-2 bg-cyan-950/30 border-b border-white/5 flex items-center justify-between text-xs">
          <span className="text-[11px] text-zinc-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{items.length} active context streams correlated in background</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
            <button
              type="button"
              onClick={resetToDefaults}
              title="Reset context fabric"
              className="text-[10px] text-zinc-400 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Add Context Form */}
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="p-3 bg-zinc-900 border-b border-white/10 space-y-2 animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200">Inject Context Item</span>
              <select
                value={newModule}
                onChange={(e) => setNewModule(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded-lg px-2 py-0.5 text-xs text-cyan-400"
              >
                <option value="code">Code / Sandbox</option>
                <option value="notes">Notes</option>
                <option value="tasks">Tasks</option>
                <option value="diary">Diary</option>
                <option value="chat">Chat / Lounge</option>
                <option value="security">Security Audit</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Title or Topic (e.g. Zero-Trust API Key Rotation)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
              required
            />
            <textarea
              placeholder="Excerpt or background details..."
              value={newExcerpt}
              onChange={(e) => setNewExcerpt(e.target.value)}
              rows={2}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 resize-none"
            />
            <input
              type="text"
              placeholder="Tags comma-separated: oauth, security, architecture"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1 text-xs text-white outline-none focus:border-cyan-400"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
              >
                Save to Fabric
              </button>
            </div>
          </form>
        )}

        {/* Semantic Tags Filter */}
        <div className="p-3 border-b border-white/10 bg-zinc-950/70 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
              selectedTag === null
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300'
            }`}
          >
            All Correlated ({items.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all shrink-0 ${
                selectedTag === tag
                  ? 'bg-cyan-500 text-black font-bold shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Context Stream List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 space-y-2">
              <Brain className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs">No active context items matching tag</p>
              <button
                type="button"
                onClick={resetToDefaults}
                className="text-xs text-cyan-400 hover:underline"
              >
                Restore sample fabric stream
              </button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-black/40 border border-white/5">
                      {getModuleIcon(item.sourceModule)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      {item.sourceModule}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {Math.round((item.correlationScore || 0.8) * 100)}% match
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                      title="Remove from fabric"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{item.title}</h4>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">{item.excerpt}</p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      onClick={() => setSelectedTag(t)}
                      className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 cursor-pointer transition-colors"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onInjectIntoAI) {
                          onInjectIntoAI(`[Correlated Context: ${item.title}]\n${item.excerpt}`);
                          onNavigateTab('assistant');
                          onClose();
                        }
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Correlate in AI</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Quick Directives */}
        <div className="p-3 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <button
            type="button"
            onClick={() => {
              onNavigateTab('simulation');
              onClose();
            }}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Sandbox</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateTab('warrooms');
              onClose();
            }}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Agent War Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};
