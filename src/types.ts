export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  username?: string;
  interests?: string[];
  followersCount?: number;
  followingCount?: number;
  isOnline?: boolean;
  theme?: 'dark' | 'light' | 'system';
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
  createdAt: string;
  updatedAt: string;
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
  type: 'explicit' | 'preference' | 'learning' | 'project' | 'goal';
  title: string;
  content: string;
  source: string;
  importance: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
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
  type?: 'tasks' | 'events' | 'files' | 'ai' | 'messages' | 'system' | string;
  title: string;
  message: string;
  sourceId?: string | null;
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
  createdAt: string;
  expiresAt: string;
}

export interface AIChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityTitle: string;
  timestamp: string;
}

export type ViewTab =
  | 'dashboard'
  | 'search'
  | 'tasks'
  | 'notes'
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
  | 'settings'
  | 'favorites'
  | 'recent'
  | 'trash';
