import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, CheckSquare, FileText, FolderKanban, Calendar, ArrowRight, X } from 'lucide-react';
import { ViewTab } from '../types';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ViewTab) => void;
  onQuickTask?: (title: string) => void;
  onQuickAI?: (prompt: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onQuickTask,
  onQuickAI,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultSuggestions = [
    {
      id: 'task',
      label: 'Create a task',
      hint: 'e.g., Prepare presentation slides for tomorrow',
      icon: CheckSquare,
      color: '#34D399',
      action: (text: string) => {
        if (onQuickTask && text) {
          onQuickTask(text);
        } else {
          setActiveTab('tasks');
        }
      },
    },
    {
      id: 'search',
      label: 'Search the workspace',
      hint: 'Search notes, files, events & memories',
      icon: Search,
      color: '#22D3EE',
      action: () => setActiveTab('search'),
    },
    {
      id: 'ai',
      label: 'Ask AI Assistant',
      hint: 'e.g., What is blocking my active project?',
      icon: Sparkles,
      color: '#A78BFA',
      action: (text: string) => {
        if (onQuickAI && text) {
          onQuickAI(text);
        } else {
          setActiveTab('assistant');
        }
      },
    },
    {
      id: 'notes',
      label: 'Open Notes',
      hint: 'Capture working ideas and reflections',
      icon: FileText,
      color: '#F59E0B',
      action: () => setActiveTab('notes'),
    },
    {
      id: 'files',
      label: 'Manage Files',
      hint: 'Browse documents in Firebase Cloud Storage',
      icon: FolderKanban,
      color: '#60A5FA',
      action: () => setActiveTab('files'),
    },
    {
      id: 'calendar',
      label: 'View Calendar',
      hint: 'Schedule focused study time or events',
      icon: Calendar,
      color: '#F472B6',
      action: () => setActiveTab('calendar'),
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = defaultSuggestions.filter(
    (item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.hint.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (index: number) => {
    const item = filtered[index];
    if (item) {
      item.action(query);
      onClose();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        handleSelect(selectedIndex);
      } else if (query.trim()) {
        if (onQuickAI) onQuickAI(query);
        else setActiveTab('assistant');
        onClose();
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[var(--color-bg)]/80 p-4 sm:p-6 backdrop-blur-md transition-opacity pt-[12vh]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl transition-all"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.15)',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-primary)]">
              Universal Command
            </p>
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              What should we move forward?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input box */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--color-primary)]/70 bg-[var(--color-bg-secondary)] px-4 py-3 text-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30">
          <Search className="w-5 h-5 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command, task, or question for your workspace..."
            className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />
          <kbd className="hidden sm:inline-block rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
            Esc
          </kbd>
        </div>

        {/* Suggestions list */}
        <div className="mt-4 space-y-1.5 max-h-72 overflow-y-auto">
          {filtered.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(index)}
                className={`flex w-full items-center gap-3.5 rounded-xl p-2.5 text-left transition-all ${
                  isSelected
                    ? 'bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 text-[var(--color-text)]'
                    : 'border border-transparent text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                }`}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)]"
                  style={{ color: item.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-[var(--color-text)]">
                    {item.label}
                  </strong>
                  <small className="block text-[11px] text-[var(--color-muted)] truncate">
                    {query ? `Apply to "${query}"` : item.hint}
                  </small>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)] opacity-50" />
              </button>
            );
          })}
          {filtered.length === 0 && query && (
            <button
              type="button"
              onClick={() => {
                if (onQuickAI) onQuickAI(query);
                else setActiveTab('assistant');
                onClose();
              }}
              className="flex w-full items-center gap-3.5 rounded-xl border border-[var(--color-ai)]/40 bg-[var(--color-ai-soft)]/40 p-3 text-left"
            >
              <Sparkles className="w-4 h-4 text-[var(--color-ai)]" />
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-bold text-[var(--color-text)]">
                  Ask AI about "{query}"
                </strong>
                <small className="block text-[11px] text-[var(--color-muted)]">
                  Get assistance with workspace context
                </small>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--color-ai)]" />
            </button>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>Tip: Press <b>Enter</b> to run or <b>Esc</b> to dismiss</span>
          <span>Shortcut: <b>⌘K</b></span>
        </div>
      </div>
    </div>
  );
};
