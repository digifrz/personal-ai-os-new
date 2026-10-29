export type ThemeSkin = 'deep_space' | 'cyberpunk' | 'terminal_green' | 'midnight_synth';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  username?: string;
  interests?: string[];
  website?: string;
  followersCount?: number;
  followingCount?: number;
  isOnline?: boolean;
  theme?: 'dark' | 'light' | 'system';
  themeSkin?: 'deep_space' | 'cyberpunk' | 'terminal_green' | 'midnight_synth';
  accentColor?: string;
  compactMode?: boolean;
  aiModel?: string;
  aiBehavior?: string;
  aiMemoryEnabled?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  taskReminders?: boolean;
  calendarReminders?: boolean;
  timezone?: string;
  accountType?: 'personal' | 'business';
  businessCategory?: string;
  businessCta?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessWebsite?: string;
  accountVerified?: boolean;
  membershipTier?: 'free' | 'pro' | 'executive';
  updatedAt?: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'done' | 'trashed';
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueAt?: string | null;
  projectId?: string | null;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  tags?: string[];
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: string;
  color: 'Blue' | 'Amber' | 'Green' | 'Purple';
  tags?: string[];
  attachments?: Array<{ name: string; url?: string; type?: string; size?: number }>;
  targetAt?: string | null;
  isPinned?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  userId: string;
  name: string;
  itemType: 'file' | 'folder';
  storagePath?: string;
  downloadUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  folderId?: string | null;
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  startsAt: string;
  endsAt?: string | null;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  reminderMinutes?: number | null;
  recurrenceRule?: string | null;
  googleCalendarEventId?: string | null;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tracksCount?: number;
  ownerName?: string;
  externalUrl?: string;
  isPersonal?: boolean;
}

export interface GoalItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  deadline?: string | null;
  targetDate?: string | null;
  progress: number;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneItem {
  id: string;
  userId: string;
  goalId?: string | null;
  projectId?: string | null;
  title: string;
  completed: boolean;
  position: number;
}

export interface ProjectItem {
  id: string;
  userId: string;
  name?: string;
  title?: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'trashed' | 'planning' | 'on_hold';
  progress: number;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningSubjectItem {
  id: string;
  userId: string;
  name: string;
  description?: string;
  progress: number;
  color?: string;
  updatedAt: string;
}

export interface FlashcardItem {
  id: string;
  userId: string;
  subjectId?: string | null;
  front: string;
  back: string;
  dueAt?: string;
  isMastered?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StudySessionItem {
  id: string;
  userId: string;
  subjectId?: string | null;
  minutes: number;
  sessionType: 'pomodoro' | 'review' | 'quiz' | 'freeform';
  startedAt: string;
  endedAt?: string;
}

export interface AIMemoryItem {
  id: string;
  userId: string;
  type:
    | 'personal'
    | 'goal'
    | 'project'
    | 'learning'
    | 'preference'
    | 'conversation'
    | 'temporary'
    | 'explicit'
    | 'derived'
    | string;
  title: string;
  content: string;
  source: string;
  importance: number;
  isVisible: boolean;
  is_visible?: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface AIConversationItem {
  id: string;
  userId: string;
  title: string;
  mode: 'chat' | 'code' | 'image';
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
  }>;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type?: 'tasks' | 'events' | 'files' | 'ai' | 'messages' | 'system' | 'community' | 'storage' | string;
  title: string;
  message: string;
  sourceId?: string | null;
  linkTab?: ViewTab;
  linkAction?: string;
  priority?: 'normal' | 'high' | 'urgent';
  actorName?: string;
  actorAvatar?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface CommunityPostItem {
  id: string;
  userId: string;
  authorId?: string;
  title?: string;
  authorName: string;
  authorAvatar?: string;
  authorUsername?: string;
  content: string;
  tags?: string[];
  attachments?: Array<{ name: string; url: string; type: string }>;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video';
  fileName?: string;
  fileUrl?: string;
  visibility?: 'public' | 'followers';
  likesCount: number;
  upvotes?: number;
  likedBy?: string[];
  commentsCount: number;
  savedBy?: string[];
  createdAt: string;
}

export interface CommunityCommentItem {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  authorUsername?: string;
  content: string;
  createdAt: string;
}

export interface CommunityChannelItem {
  id: string;
  name: string;
  slug?: string;
  description: string;
  icon: string;
  isActive?: boolean;
  order: number;
}

export interface CommunityMessageItem {
  id: string;
  channelId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface DirectThreadItem {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt: string;
  unreadBy?: string[];
}

export interface DirectMessageItem {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  createdAt: string;
}

export interface StoryItem {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: string;
  expiresAt: string;
}

export interface AIChatMessage {
  id: string;
  userId?: string;
  sessionId?: string;
  role: 'user' | 'model';
  provider?: 'gemini' | 'chatgpt' | 'openai' | 'hybrid';
  text: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood?: 'happy' | 'productive' | 'calm' | 'reflective' | 'stressed' | 'neutral';
  tags: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
  syncedToGoogleDocs?: boolean;
  googleDocUrl?: string;
  calendarLinked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityTitle: string;
  timestamp: string;
  details?: string;
  source?: string;
  actor?: 'user' | 'assistant' | 'system';
  status?: 'success' | 'warning' | 'info';
}

export interface HabitItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'health' | 'mind' | 'productivity' | 'fitness' | 'learning';
  frequency: 'daily' | 'weekly';
  streakCount: number;
  bestStreak: number;
  completedDates: string[]; // YYYY-MM-DD
  targetPerWeek?: number;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransactionItem {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: 'housing' | 'food' | 'transport' | 'tech' | 'entertainment' | 'health' | 'savings' | 'income' | 'other';
  date: string; // YYYY-MM-DD
  note: string;
  recurring?: boolean;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisionBoardItem {
  id: string;
  userId: string;
  title: string;
  caption?: string;
  category: 'career' | 'travel' | 'wellness' | 'wealth' | 'learning' | 'lifestyle';
  imageUrl: string;
  targetYear?: string;
  isPinned?: boolean;
  affirmation?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ViewTab =
  | 'dashboard'
  | 'search'
  | 'tasks'
  | 'notes'
  | 'habits'
  | 'finance'
  | 'vision'
  | 'diary'
  | 'files'
  | 'calendar'
  | 'assistant'
  | 'memory'
  | 'learning'
  | 'goals'
  | 'projects'
  | 'analytics'
  | 'activity'
  | 'community'
  | 'chats'
  | 'notifications'
  | 'integrations'
  | 'settings'
  | 'favorites'
  | 'recent'
  | 'trash'
  | 'warrooms'
  | 'simulation'
  | 'fabric'
  | 'viberooms'
  | 'microdrops';

// Next-Gen Unified Context Fabric Item
export interface ContextFabricItem {
  id: string;
  sourceModule: 'notes' | 'tasks' | 'code' | 'diary' | 'chat' | 'files' | 'spotify' | 'calendar' | 'security';
  title: string;
  excerpt: string;
  timestamp: string;
  tags: string[];
  entityId?: string;
  correlationScore?: number;
  metadata?: Record<string, any>;
}

// Next-Gen Multi-Agent War Room
export interface WarRoomAgent {
  id: string;
  name: string;
  role: 'architect' | 'security' | 'creative' | 'performance';
  title: string;
  avatar: string;
  badge: string;
  color: string;
  specialty: string;
  bias: string;
}

export interface WarRoomMessage {
  id: string;
  agentId: string;
  agentName: string;
  role: 'architect' | 'security' | 'creative' | 'performance' | 'director';
  content: string;
  timestamp: string;
  critiqueOfAgentId?: string;
  voteScore?: number;
  tags?: string[];
  proposedCode?: string;
  actionItems?: string[];
}

export interface WarRoomMission {
  id: string;
  title: string;
  objective: string;
  status: 'active' | 'debating' | 'consensus' | 'executed';
  activeAgents: string[];
  messages: WarRoomMessage[];
  synthesizedPlan?: string;
  createdAt: string;
  updatedAt: string;
}

// Next-Gen Simulation & Sandbox Models
export interface SimulationTopologyNode {
  id: string;
  label: string;
  type: 'client' | 'gateway' | 'service' | 'auth' | 'database' | 'ai_agent';
  status: 'healthy' | 'warning' | 'critical' | 'standby';
  latencyMs: number;
  requestsPerSec: number;
  securityState: 'enforced' | 'audit_pending' | 'vulnerable';
  x: number;
  y: number;
}

export interface SimulationTopologyLink {
  fromId: string;
  toId: string;
  protocol: 'HTTPS' | 'gRPC' | 'WSS' | 'TCP';
  encrypted: boolean;
  activePackets: number;
}

// Next-Gen Ephemeral Workspace
export interface EphemeralWorkspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  activeModules: string[];
  tags: string[];
  isTemporary: boolean;
}

// ============================================================
// 🔥 The Killer Feature: Shared Vibe Rooms (Micro-Social Productivity & Media Fusion)
// ============================================================
export interface VibeRoomMember {
  id: string;
  name: string;
  avatar: string;
  status: 'hacking' | 'deep_focus' | 'watching' | 'on_break';
  currentTask?: string;
  streakDays: number;
  isMuted?: boolean;
}

export interface VibeRoomSharedTask {
  id: string;
  title: string;
  authorName: string;
  authorAvatar: string;
  isCompleted: boolean;
  category: string;
  completedAt?: string;
  cheersCount: number;
}

export interface VibeRoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: 'chat' | 'task_celebration' | 'video_drop' | 'ai_synthesis' | 'micro_snippet';
  reactions: Record<string, number>;
  timestamp: string;
  attachmentUrl?: string;
}

export interface VibeRoomVideo {
  url: string;
  title: string;
  channel: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  currentSeconds: number;
  isPlaying: boolean;
  aiTakeaways: string[];
  timestamps: Array<{ time: number; note: string; author: string }>;
}

export interface VibeRoomSprint {
  mode: 'pomodoro' | 'deep_hack' | 'chill_study';
  targetMinutes: number;
  secondsRemaining: number;
  isActive: boolean;
  streakFlameCount: number;
}

export interface VibeRoom {
  id: string;
  code: string; // e.g. "VIBE-9421"
  name: string;
  tagline: string;
  icon: string;
  theme: 'cyberpunk' | 'neon_sunset' | 'emerald_matrix' | 'lofi_purple' | 'oled_minimal';
  isPublic: boolean;
  hostId: string;
  hostName: string;
  createdAt: string;
  members: VibeRoomMember[];
  activeVideo: VibeRoomVideo;
  sprint: VibeRoomSprint;
  sharedTasks: VibeRoomSharedTask[];
  chatMessages: VibeRoomMessage[];
  aiGroupVibe: {
    lastSynthesizedAt?: string;
    vibeScore: number;
    vibeLabel: string;
    weeklySummary?: string;
    studyQuiz?: Array<{ question: string; options: string[]; answerIndex: number; explanation: string }>;
    playfulRoast?: string;
  };
}

// ============================================================
// 🔥 The Feature: Micro-Drop Artifacts & Auto-Generated Daily Recaps
// ============================================================
export interface MicroDropArtifact {
  id: string;
  userId: string;
  type: 'diary_voice' | 'diary_text' | 'task_hack' | 'video_timestamp' | 'ai_prompt' | 'quick_vibe';
  title: string;
  content: string;
  metadata?: {
    audioSeconds?: number;
    codeLanguage?: string;
    videoTitle?: string;
    videoTimestamp?: string;
    vibeEmoji?: string;
    tags?: string[];
  };
  createdAt: string;
  includedInRecap?: boolean;
}

export interface CreationBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
  category: 'streak' | 'coding' | 'video' | 'reflection' | 'social';
}

export interface DailyRecapStory {
  id: string;
  date: string; // YYYY-MM-DD
  theme: 'cyberpunk_oled' | 'sunset_aura' | 'emerald_matrix' | 'vaporwave' | 'minimalist_noir';
  totalMicroDrops: number;
  creationStreak: number;
  vibeScore: number; // 0 - 100
  vibeTitle: string; // e.g. "Level 9 Neural Architect"
  vibeEmoji: string; // e.g. "⚡"
  moodAura: string; // e.g. "Relentless Flow & Cosmic Clarity"
  tasksHacksCracked: Array<{ title: string; tag: string }>;
  topMediaWatched?: { title: string; takeaway: string; platform: string; timestamp?: string };
  topAiInsight?: string;
  audioDropsCount: number;
  unlockedBadge?: CreationBadge;
  shareableSummaryText: string;
  generatedAt: string;
}


