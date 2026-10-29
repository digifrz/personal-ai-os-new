import { EphemeralWorkspace, ViewTab } from '../types';

const WORKSPACES_STORAGE_KEY = 'paio_ephemeral_workspaces_v1';
const WORKSPACE_EVENT = 'paio:workspace-changed';

const DEFAULT_WORKSPACES: EphemeralWorkspace[] = [
  {
    id: 'ws-default',
    name: 'Personal Core OS',
    description: 'Main workspace with daily dashboard, tasks, notes, and ambient lo-fi audio.',
    icon: '⚡',
    color: 'from-purple-600 to-indigo-700',
    createdAt: new Date().toISOString(),
    activeModules: ['dashboard', 'tasks', 'notes', 'community', 'spotify'],
    tags: ['core', 'daily'],
    isTemporary: false,
  },
  {
    id: 'ws-security-audit',
    name: 'Zero-Trust Security Sandbox',
    description: 'Isolated micro-environment for OAuth 2.0 PKCE testing, threat modeling, and network topology analysis.',
    icon: '🛡️',
    color: 'from-rose-600 to-red-800',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    activeModules: ['simulation', 'warrooms', 'fabric'],
    tags: ['security', 'sandbox', 'zero-trust'],
    isTemporary: true,
  },
  {
    id: 'ws-mobile-launch',
    name: 'Mobile Launch War Room',
    description: 'Autonomous multi-agent strategy sprint for Android & iOS mobile release.',
    icon: '🚀',
    color: 'from-amber-500 to-orange-700',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    activeModules: ['warrooms', 'simulation', 'community'],
    tags: ['warroom', 'mobile', 'launch'],
    isTemporary: true,
  },
];

class EphemeralWorkspaceService {
  private workspaces: EphemeralWorkspace[] = [];
  private activeId: string = 'ws-default';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.workspaces = parsed;
          return;
        }
      }
    } catch {}
    this.workspaces = [...DEFAULT_WORKSPACES];
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(this.workspaces));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(WORKSPACE_EVENT, { detail: this.getActiveWorkspace() }));
    }
  }

  public getWorkspaces(): EphemeralWorkspace[] {
    return [...this.workspaces];
  }

  public getActiveWorkspace(): EphemeralWorkspace {
    return this.workspaces.find((w) => w.id === this.activeId) || this.workspaces[0] || DEFAULT_WORKSPACES[0];
  }

  public setActiveWorkspace(id: string) {
    if (this.workspaces.some((w) => w.id === id)) {
      this.activeId = id;
      this.save();
    }
  }

  public createWorkspace(name: string, description: string, modules: string[], isTemporary = true): EphemeralWorkspace {
    const newWs: EphemeralWorkspace = {
      id: `ws-${Date.now()}`,
      name: name.trim() || 'Custom Micro-Environment',
      description: description.trim() || 'Ephemeral project workspace with zero clutter.',
      icon: '✨',
      color: 'from-cyan-600 to-blue-800',
      createdAt: new Date().toISOString(),
      activeModules: modules.length > 0 ? modules : ['dashboard', 'simulation', 'warrooms'],
      tags: ['ephemeral', 'custom'],
      isTemporary,
    };
    this.workspaces.push(newWs);
    this.activeId = newWs.id;
    this.save();
    return newWs;
  }

  public dissolveWorkspace(id: string) {
    if (id === 'ws-default') return; // Cannot delete default core
    this.workspaces = this.workspaces.filter((w) => w.id !== id);
    if (this.activeId === id) {
      this.activeId = 'ws-default';
    }
    this.save();
  }
}

export const ephemeralWorkspaceService = new EphemeralWorkspaceService();
