import React, { useState, useEffect } from 'react';
import { ContextFabricItem, TaskItem, NoteItem, FileItem, CalendarEventItem } from '../types';

const FABRIC_STORAGE_KEY = 'paio_unified_context_fabric_v1';
const FABRIC_EVENT_NAME = 'paio:context-fabric-update';

// Initial preloaded context items illustrating cross-app state
const DEFAULT_FABRIC_ITEMS: ContextFabricItem[] = [
  {
    id: 'ctx-1',
    sourceModule: 'code',
    title: 'OAuth 2.0 PKCE Authorization Handshake',
    excerpt: 'Implemented /auth/spotify/callback with cross-origin postMessage token exchange and silent window closer.',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    tags: ['oauth', 'security', 'spotify', 'auth'],
    correlationScore: 0.94,
    metadata: { route: '/auth/spotify/callback', status: 'verified' },
  },
  {
    id: 'ctx-2',
    sourceModule: 'notes',
    title: 'Zero-Trust Architecture Spec',
    excerpt: 'Mutual TLS, short-lived bearer tokens, and hardware-backed biometric keys for mobile Android & iOS devices.',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    tags: ['security', 'zero-trust', 'mobile', 'architecture'],
    correlationScore: 0.88,
    metadata: { category: 'Engineering' },
  },
  {
    id: 'ctx-3',
    sourceModule: 'diary',
    title: 'Focus Reflections on High-Speed Execution',
    excerpt: 'Deep-work flow states achieved using continuous ambient lo-fi and zero-interruption window orchestration.',
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    tags: ['focus', 'spotify', 'productivity', 'habits'],
    correlationScore: 0.82,
  },
  {
    id: 'ctx-4',
    sourceModule: 'chat',
    title: 'Lounge Discussion: Vector Indexing & Memory',
    excerpt: 'Alex Chen: "Can we link cross-app notes directly into the AI assistant stream without copy-pasting?"',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    tags: ['lounge', 'ai-memory', 'collaboration'],
    correlationScore: 0.79,
  },
  {
    id: 'ctx-5',
    sourceModule: 'tasks',
    title: 'Deploy Sandboxed Execution Engine',
    excerpt: 'Spin up dynamic topology maps and in-browser JS/Python execution sandboxes with real-time AI supervision.',
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    tags: ['sandbox', 'simulation', 'tasks'],
    correlationScore: 0.86,
  },
];

class ContextFabricService {
  private items: ContextFabricItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(FABRIC_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.items = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse context fabric storage:', e);
    }
    this.items = [...DEFAULT_FABRIC_ITEMS];
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(FABRIC_STORAGE_KEY, JSON.stringify(this.items));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FABRIC_EVENT_NAME, { detail: this.items }));
    }
  }

  public getItems(): ContextFabricItem[] {
    return [...this.items];
  }

  public addItem(item: Omit<ContextFabricItem, 'id' | 'timestamp'>): ContextFabricItem {
    const newItem: ContextFabricItem = {
      ...item,
      id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      correlationScore: item.correlationScore || 0.85,
    };
    // Prepend and cap at 50 items
    this.items = [newItem, ...this.items.filter((i) => i.title !== newItem.title)].slice(0, 50);
    this.save();
    return newItem;
  }

  public removeItem(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.save();
  }

  public clearAll() {
    this.items = [];
    this.save();
  }

  public resetToDefaults() {
    this.items = [...DEFAULT_FABRIC_ITEMS];
    this.save();
  }

  /**
   * Find correlated items across apps by semantic keyword matching
   */
  public findCorrelated(queryOrTags: string | string[]): ContextFabricItem[] {
    const tokens = (Array.isArray(queryOrTags) ? queryOrTags.join(' ') : queryOrTags)
      .toLowerCase()
      .split(/[\s,._-]+/)
      .filter((t) => t.length > 2);

    if (tokens.length === 0) return this.items.slice(0, 6);

    return this.items
      .map((item) => {
        let score = 0;
        const text = `${item.title} ${item.excerpt} ${item.tags.join(' ')} ${item.sourceModule}`.toLowerCase();
        for (const token of tokens) {
          if (text.includes(token)) score += 1;
        }
        return { item, matchCount: score };
      })
      .filter((res) => res.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .map((res) => res.item);
  }

  /**
   * Auto-sync context snapshot from active workspace data
   */
  public syncWorkspaceSnapshot(data: {
    tasks?: TaskItem[];
    notes?: NoteItem[];
    files?: FileItem[];
    events?: CalendarEventItem[];
  }) {
    let hasNew = false;
    // Inspect recent notes
    if (data.notes && data.notes.length > 0) {
      const topNote = data.notes[0];
      const exists = this.items.some((i) => i.entityId === topNote.id);
      if (!exists && topNote.title) {
        this.addItem({
          sourceModule: 'notes',
          title: topNote.title,
          excerpt: topNote.body.slice(0, 140) || 'Active note in workspace',
          tags: topNote.tags || [topNote.category.toLowerCase(), 'note'],
          entityId: topNote.id,
          correlationScore: 0.92,
        });
        hasNew = true;
      }
    }

    // Inspect high priority active tasks
    if (data.tasks) {
      const urgentTask = data.tasks.find((t) => t.status === 'open' && t.priority === 'high');
      if (urgentTask) {
        const exists = this.items.some((i) => i.entityId === urgentTask.id);
        if (!exists) {
          this.addItem({
            sourceModule: 'tasks',
            title: `High Priority: ${urgentTask.title}`,
            excerpt: urgentTask.description || `Due: ${urgentTask.dueAt || 'Today'} · Category: ${urgentTask.category}`,
            tags: ['urgent', urgentTask.category.toLowerCase(), 'task'],
            entityId: urgentTask.id,
            correlationScore: 0.95,
          });
          hasNew = true;
        }
      }
    }

    return hasNew;
  }
}

export const contextFabric = new ContextFabricService();

/**
 * React Hook to subscribe to real-time Unified Context Fabric changes
 */
export function useContextFabricStream(): {
  items: ContextFabricItem[];
  addItem: (item: Omit<ContextFabricItem, 'id' | 'timestamp'>) => ContextFabricItem;
  removeItem: (id: string) => void;
  findCorrelated: (queryOrTags: string | string[]) => ContextFabricItem[];
  resetToDefaults: () => void;
  clearAll: () => void;
} {
  const [items, setItems] = React.useState<ContextFabricItem[]>(() => contextFabric.getItems());

  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<ContextFabricItem[]>;
      if (custom.detail) {
        setItems([...custom.detail]);
      } else {
        setItems(contextFabric.getItems());
      }
    };
    window.addEventListener(FABRIC_EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(FABRIC_EVENT_NAME, handleUpdate);
  }, []);

  return {
    items,
    addItem: (item) => contextFabric.addItem(item),
    removeItem: (id) => contextFabric.removeItem(id),
    findCorrelated: (q) => contextFabric.findCorrelated(q),
    resetToDefaults: () => contextFabric.resetToDefaults(),
    clearAll: () => contextFabric.clearAll(),
  };
}
