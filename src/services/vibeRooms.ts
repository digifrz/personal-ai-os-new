import { VibeRoom, VibeRoomMember, VibeRoomMessage, VibeRoomSharedTask, VibeRoomVideo } from '../types';
import { askAI } from './ai';

const VIBE_ROOMS_STORAGE_KEY = 'paio_shared_vibe_rooms_v1';
const ACTIVE_ROOM_ID_KEY = 'paio_active_vibe_room_id';

const DEFAULT_VIBE_ROOMS: VibeRoom[] = [
  {
    id: 'room-midnight-hackers',
    code: 'VIBE-9421',
    name: '🚀 Midnight Hackers & Coffee',
    tagline: 'Building next-gen AI OS architectures, sharing terminal logs, and deep synthwave flow.',
    icon: '🚀',
    theme: 'cyberpunk',
    isPublic: true,
    hostId: 'usr-vesper',
    hostName: 'Vesper Zero',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    members: [
      {
        id: 'usr-farzan',
        name: 'Farzan (You)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        status: 'hacking',
        currentTask: 'Wiring Shared Vibe Rooms & Spotify background loop',
        streakDays: 4,
      },
      {
        id: 'usr-lyra',
        name: 'Lyra Vance',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
        status: 'deep_focus',
        currentTask: 'Designing Gen-Z Spotify Wrapped story recap micro-cards',
        streakDays: 6,
      },
      {
        id: 'usr-kael',
        name: 'Kaelen Byte',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        status: 'watching',
        currentTask: 'Benchmarking WebSocket & audio latency under 40ms',
        streakDays: 3,
      },
      {
        id: 'usr-maya',
        name: 'Maya Lin',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
        status: 'hacking',
        currentTask: 'Building interactive study quiz cards from video snippets',
        streakDays: 5,
      },
    ],
    activeVideo: {
      url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
      title: 'Building a Fast Full-Stack App with Modern TypeScript & Neural APIs',
      channel: 'Fireship Dev Lounge',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80',
      durationSeconds: 620,
      currentSeconds: 245,
      isPlaying: true,
      aiTakeaways: [
        'Decouple background audio contexts to prevent off-screen tab suspension in modern browsers.',
        'Use zero-friction micro-drops for lightning capture rather than intimidating blank diary pages.',
        'Synchronize task completions with live celebratory micro-animations to boost group momentum.',
      ],
      timestamps: [
        { time: 64, note: 'Architecture diagram breakdown & live stream bus', author: 'Lyra Vance' },
        { time: 182, note: 'Low-latency haptic response trick', author: 'Farzan' },
        { time: 245, note: 'AI Group Vibe Synthesizer prompt chain', author: 'Kaelen Byte' },
      ],
    },
    sprint: {
      mode: 'pomodoro',
      targetMinutes: 25,
      secondsRemaining: 840,
      isActive: true,
      streakFlameCount: 14,
    },
    sharedTasks: [
      {
        id: 'task-vibe-1',
        title: 'Fix background audio persistence on player minimize',
        authorName: 'Farzan (You)',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        isCompleted: true,
        category: 'Core Dev',
        completedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        cheersCount: 7,
      },
      {
        id: 'task-vibe-2',
        title: 'Design 1-Click Daily Recap visual story card generator',
        authorName: 'Lyra Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
        isCompleted: true,
        category: 'UI/UX',
        completedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        cheersCount: 5,
      },
      {
        id: 'task-vibe-3',
        title: 'Stress-test synchronized reaction bursts (🔥, 🚀, 💡)',
        authorName: 'Kaelen Byte',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        isCompleted: false,
        category: 'QA & Perf',
        cheersCount: 3,
      },
      {
        id: 'task-vibe-4',
        title: 'Draft flashcard quiz questions for upcoming AI Architecture test',
        authorName: 'Maya Lin',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
        isCompleted: false,
        category: 'Study',
        cheersCount: 2,
      },
    ],
    chatMessages: [
      {
        id: 'msg-vibe-1',
        senderId: 'usr-vesper',
        senderName: 'Vesper Zero',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        text: 'Welcome to Midnight Hackers! Dropped the new TypeScript engine video on the shared canvas. 🚀',
        type: 'chat',
        reactions: { '🔥': 4, '⚡': 3 },
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-vibe-2',
        senderId: 'usr-farzan',
        senderName: 'Farzan (You)',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        text: '🎉 Cracked the task: "Fix background audio persistence on player minimize"! Group streak +1 🔥',
        type: 'task_celebration',
        reactions: { '🔥': 6, '❤️': 4, '👏': 5 },
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-vibe-3',
        senderId: 'usr-lyra',
        senderName: 'Lyra Vance',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
        text: 'Insane progress! Dropping a micro-note for our daily story recap at the end of sprint.',
        type: 'chat',
        reactions: { '✨': 3 },
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    aiGroupVibe: {
      lastSynthesizedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      vibeScore: 94,
      vibeLabel: '⚡ Unstoppable Flow State',
      weeklySummary: 'Midnight Hackers team completed 7 high-impact tasks, watched 2 architectural deep-dives, and maintained a 14-flame sprint streak with zero distractions.',
      studyQuiz: [
        {
          question: 'Why do browser background tabs pause iframe media when positioned at -9999px?',
          options: [
            'Chromium and WebKit garbage collect offscreen audio contexts to save memory',
            'Network disconnection kicks in automatically after 10 seconds',
            'Iframe cookies expire immediately outside the visible viewport',
            'CSS transforms always disable audio elements',
          ],
          answerIndex: 0,
          explanation: 'Browsers throttle off-screen rendering contexts. Keeping the frame at 1px inside viewport boundaries keeps audio streams uninterrupted.',
        },
        {
          question: 'What is the primary psychological benefit of Gen-Z Micro-Drops over standard journals?',
          options: [
            'Eliminates blank-page anxiety with 2-second low-friction captures',
            'Requires manual LaTeX formatting for every entry',
            'Limits users to only 1 entry per week',
            'Forces public exposure to external search engines',
          ],
          answerIndex: 0,
          explanation: 'Micro-dropping lowers friction to zero, turning intimidating journal obligations into fast private status updates.',
        },
      ],
      playfulRoast: '🔥 Farzan is hyper-shipping code while Kaelen is hypnotized by the modular synth breakdown at 245s. Overall group vibe is 94/100—pure espresso-fueled execution!',
    },
  },
  {
    id: 'room-neuro-study',
    code: 'VIBE-3382',
    name: '🧠 Neuro-Focus Study Pod',
    tagline: 'Deep study, medical & computer science exam prep with flashcard co-solving.',
    icon: '🧠',
    theme: 'emerald_matrix',
    isPublic: true,
    hostId: 'usr-maya',
    hostName: 'Maya Lin',
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    members: [
      {
        id: 'usr-maya',
        name: 'Maya Lin',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
        status: 'deep_focus',
        currentTask: 'Reviewing Distributed Systems consensus protocols',
        streakDays: 8,
      },
      {
        id: 'usr-farzan',
        name: 'Farzan (You)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        status: 'hacking',
        currentTask: 'Studying OAuth 2.0 PKCE flow diagrams',
        streakDays: 4,
      },
    ],
    activeVideo: {
      url: 'https://www.youtube.com/watch?v=aircAruvnKk',
      title: 'Neural Networks: Zero to Hero by Andrej Karpathy',
      channel: 'Andrej Karpathy',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
      durationSeconds: 1440,
      currentSeconds: 430,
      isPlaying: false,
      aiTakeaways: [
        'Backpropagation computes derivatives using the chain rule recursively backward from output loss.',
        'Micrograd builds the dynamic computational graph on the fly with minimal scalar primitives.',
      ],
      timestamps: [
        { time: 120, note: 'Derivative of polynomial function intuition', author: 'Maya Lin' },
        { time: 380, note: 'Neuron activation functions (ReLU, Tanh)', author: 'Farzan' },
      ],
    },
    sprint: {
      mode: 'deep_hack',
      targetMinutes: 50,
      secondsRemaining: 1820,
      isActive: true,
      streakFlameCount: 8,
    },
    sharedTasks: [
      {
        id: 'task-study-1',
        title: 'Complete 25 Flashcard reps on Neural Activations',
        authorName: 'Maya Lin',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
        isCompleted: true,
        category: 'AI Study',
        cheersCount: 4,
      },
    ],
    chatMessages: [
      {
        id: 'msg-study-1',
        senderId: 'usr-maya',
        senderName: 'Maya Lin',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
        text: 'Sprint started! 50 min deep study session is live. Let us conquer this lecture.',
        type: 'chat',
        reactions: { '🧠': 5, '🔥': 3 },
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
    aiGroupVibe: {
      vibeScore: 91,
      vibeLabel: '🌿 Deep Focus Sanctuary',
      weeklySummary: 'Pod maintained 91% laser focus on ML fundamentals with 25 flashcard reps completed.',
    },
  },
];

class VibeRoomService {
  private rooms: VibeRoom[] = [];
  private activeRoomId: string = 'room-midnight-hackers';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(VIBE_ROOMS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.rooms = parsed;
          const activeId = localStorage.getItem(ACTIVE_ROOM_ID_KEY);
          if (activeId && this.rooms.some((r) => r.id === activeId)) {
            this.activeRoomId = activeId;
          }
          return;
        }
      }
    } catch {}
    this.rooms = DEFAULT_VIBE_ROOMS;
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(VIBE_ROOMS_STORAGE_KEY, JSON.stringify(this.rooms));
      localStorage.setItem(ACTIVE_ROOM_ID_KEY, this.activeRoomId);
      window.dispatchEvent(new CustomEvent('paio:viberoom-updated', { detail: this.getActiveRoom() }));
    } catch {}
  }

  public getRooms(): VibeRoom[] {
    return this.rooms;
  }

  public getActiveRoom(): VibeRoom {
    const found = this.rooms.find((r) => r.id === this.activeRoomId);
    return found || this.rooms[0] || DEFAULT_VIBE_ROOMS[0];
  }

  public setActiveRoom(roomId: string): VibeRoom {
    this.activeRoomId = roomId;
    this.save();
    return this.getActiveRoom();
  }

  public createRoom(name: string, tagline: string, icon = '🔥', theme: VibeRoom['theme'] = 'cyberpunk'): VibeRoom {
    const code = 'VIBE-' + Math.floor(1000 + Math.random() * 9000);
    const newRoom: VibeRoom = {
      id: 'room-' + Date.now(),
      code,
      name: name.trim() || 'My Vibe Room',
      tagline: tagline.trim() || 'Study, hack, and watch media together in flow.',
      icon,
      theme,
      isPublic: true,
      hostId: 'current_user',
      hostName: 'You',
      createdAt: new Date().toISOString(),
      members: [
        {
          id: 'current_user',
          name: 'You',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          status: 'hacking',
          streakDays: 4,
        },
        {
          id: 'usr-lyra',
          name: 'Lyra Vance',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
          status: 'deep_focus',
          streakDays: 6,
        },
      ],
      activeVideo: {
        url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
        title: 'Building Modern Web Apps & Fast Frontend Architecture',
        channel: 'Tech Flow Lounge',
        durationSeconds: 480,
        currentSeconds: 0,
        isPlaying: false,
        aiTakeaways: ['High-tempo focus drives 3x sprint throughput.', 'Interactive micro-interactions turn chores into games.'],
        timestamps: [],
      },
      sprint: {
        mode: 'pomodoro',
        targetMinutes: 25,
        secondsRemaining: 1500,
        isActive: false,
        streakFlameCount: 1,
      },
      sharedTasks: [],
      chatMessages: [
        {
          id: 'msg-init-' + Date.now(),
          senderId: 'current_user',
          senderName: 'You',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          text: `Room created! Invite friends with code ${code} 🚀`,
          type: 'chat',
          reactions: { '🔥': 2 },
          timestamp: new Date().toISOString(),
        },
      ],
      aiGroupVibe: {
        vibeScore: 90,
        vibeLabel: '⚡ Fresh Momentum',
        weeklySummary: 'Welcome to your newly minted Shared Vibe Room.',
      },
    };

    this.rooms.unshift(newRoom);
    this.activeRoomId = newRoom.id;
    this.save();
    return newRoom;
  }

  // Drop YouTube / Video into active room
  public dropVideo(videoUrl: string, title?: string): VibeRoom {
    const room = this.getActiveRoom();
    const cleanTitle = title || 'Shared Community Stream / Video';
    room.activeVideo = {
      url: videoUrl,
      title: cleanTitle,
      channel: 'Shared Drop',
      durationSeconds: 600,
      currentSeconds: 0,
      isPlaying: true,
      aiTakeaways: [
        'Synchronized media watch session started.',
        'Use live reactions and tap timestamps to save key notes.',
      ],
      timestamps: [{ time: 0, note: 'Video dropped into room', author: 'You' }],
    };

    // Post celebration into chat
    room.chatMessages.push({
      id: 'msg-' + Date.now(),
      senderId: 'current_user',
      senderName: 'You',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      text: `🎬 Dropped a new synchronized video: "${cleanTitle}"`,
      type: 'video_drop',
      reactions: { '🍿': 3, '🔥': 2 },
      timestamp: new Date().toISOString(),
    });

    this.save();
    return room;
  }

  // Toggle video play / pause
  public toggleVideoPlay(): VibeRoom {
    const room = this.getActiveRoom();
    room.activeVideo.isPlaying = !room.activeVideo.isPlaying;
    this.save();
    return room;
  }

  public toggleVideoPlayback(): VibeRoom {
    return this.toggleVideoPlay();
  }

  public seekVideo(seconds: number): VibeRoom {
    const room = this.getActiveRoom();
    room.activeVideo.currentSeconds = Math.max(0, Math.min(room.activeVideo.durationSeconds, Math.floor(seconds)));
    this.save();
    return room;
  }

  // Add shared task
  public addSharedTask(title: string, category = 'Sprint'): VibeRoom {
    const room = this.getActiveRoom();
    const newTask: VibeRoomSharedTask = {
      id: 'task-' + Date.now(),
      title: title.trim(),
      authorName: 'You',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      isCompleted: false,
      category,
      cheersCount: 0,
    };
    room.sharedTasks.unshift(newTask);
    this.save();
    return room;
  }

  public addTask(title: string, category = 'Sprint'): VibeRoom {
    return this.addSharedTask(title, category);
  }

  public toggleTask(taskId: string): { room: VibeRoom; justCompleted: boolean; completedTitle: string } {
    return this.toggleCompleteTask(taskId);
  }

  // Complete task with flame streak & celebratory micro-interaction
  public toggleCompleteTask(taskId: string): { room: VibeRoom; justCompleted: boolean; completedTitle: string } {
    const room = this.getActiveRoom();
    const task = room.sharedTasks.find((t) => t.id === taskId);
    let justCompleted = false;
    let completedTitle = '';

    if (task) {
      task.isCompleted = !task.isCompleted;
      justCompleted = task.isCompleted;
      completedTitle = task.title;

      if (task.isCompleted) {
        task.completedAt = new Date().toISOString();
        task.cheersCount += 1;
        room.sprint.streakFlameCount += 1;

        // Post instant celebratory message in room chat
        room.chatMessages.push({
          id: 'msg-cheer-' + Date.now(),
          senderId: 'system',
          senderName: 'Vibe Streak Engine',
          senderAvatar: '🔥',
          text: `🎉 ${task.authorName} cracked: "${task.title}"! Group Streak +1 🔥 (Total: ${room.sprint.streakFlameCount})`,
          type: 'task_celebration',
          reactions: { '🔥': 5, '🚀': 4, '👏': 3 },
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.save();
    return { room, justCompleted, completedTitle };
  }

  // Cheer task
  public cheerTask(taskId: string): VibeRoom {
    const room = this.getActiveRoom();
    const task = room.sharedTasks.find((t) => t.id === taskId);
    if (task) {
      task.cheersCount += 1;
      this.save();
    }
    return room;
  }

  // Send room chat message
  public sendMessage(text: string): VibeRoom {
    const room = this.getActiveRoom();
    room.chatMessages.push({
      id: 'msg-' + Date.now(),
      senderId: 'current_user',
      senderName: 'You',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      text: text.trim(),
      type: 'chat',
      reactions: {},
      timestamp: new Date().toISOString(),
    });
    this.save();
    return room;
  }

  public sendChatMessage(text: string): VibeRoom {
    return this.sendMessage(text);
  }

  // Add emoji reaction to message
  public reactToMessage(messageId: string, emoji: string): VibeRoom {
    const room = this.getActiveRoom();
    const msg = room.chatMessages.find((m) => m.id === messageId);
    if (msg) {
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      this.save();
    }
    return room;
  }

  // Add timestamp anchor to current video
  public addVideoTimestamp(seconds: number, note: string): VibeRoom {
    const room = this.getActiveRoom();
    room.activeVideo.timestamps.push({
      time: Math.floor(seconds),
      note: note.trim() || 'Key timestamp takeaway',
      author: 'You',
    });
    room.activeVideo.timestamps.sort((a, b) => a.time - b.time);
    this.save();
    return room;
  }

  // AI Group Vibe Synthesizer: Analyzes collective notes, tasks & chat
  public async synthesizeGroupVibe(
    mode: 'summary' | 'quiz' | 'roast' = 'summary'
  ): Promise<{ summary?: string; quiz?: any[]; roast?: string }> {
    const room = this.getActiveRoom();
    const completedTasks = room.sharedTasks.filter((t) => t.isCompleted).map((t) => `${t.title} (by ${t.authorName})`);
    const pendingTasks = room.sharedTasks.filter((t) => !t.isCompleted).map((t) => `${t.title} (by ${t.authorName})`);
    const recentChat = room.chatMessages.slice(-6).map((m) => `${m.senderName}: ${m.text}`);
    const videoTitle = room.activeVideo.title;

    const groupContext = `
Room: ${room.name} (${room.tagline})
Members: ${room.members.map((m) => `${m.name} [${m.status}]`).join(', ')}
Video Consumed: "${videoTitle}"
Completed Sprint Tasks: ${completedTasks.length > 0 ? completedTasks.join('; ') : 'Just started sprint'}
Pending Tasks: ${pendingTasks.length > 0 ? pendingTasks.join('; ') : 'All clear!'}
Recent Group Chat: ${recentChat.join(' | ')}
Group Streak Flame: ${room.sprint.streakFlameCount} 🔥
    `.trim();

    try {
      if (mode === 'summary') {
        const reply = await askAI({
          prompt: `You are the AI Group Vibe Synthesizer for a Gen-Z co-working and study pod. Analyze this group's sprint context and create a punchy, ultra-motivating 3-bullet sprint summary + vibe assessment (0-100 score with a hype label):\n\n${groupContext}`,
          mode: 'chat',
        });
        room.aiGroupVibe.weeklySummary = reply;
        room.aiGroupVibe.vibeScore = Math.min(99, Math.max(75, 80 + completedTasks.length * 4));
        room.aiGroupVibe.vibeLabel = '⚡ Flow State Amplified';
        room.aiGroupVibe.lastSynthesizedAt = new Date().toISOString();
        this.save();
        return { summary: reply };
      } else if (mode === 'quiz') {
        const prompt = `Based on the video "${videoTitle}" and the topics the group is hacking on (${completedTasks.join(', ') || 'modern software and learning'}), generate an interactive 3-question study quiz. Return pure JSON array of objects with keys: "question", "options" (array of 4 short strings), "answerIndex" (0-3), and "explanation". Do not include markdown code blocks if possible.`;
        const reply = await askAI({ prompt, mode: 'chat' });
        try {
          const clean = reply.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);
          if (Array.isArray(parsed) && parsed.length > 0) {
            room.aiGroupVibe.studyQuiz = parsed;
            this.save();
            return { quiz: parsed };
          }
        } catch {}
        return { quiz: room.aiGroupVibe.studyQuiz };
      } else if (mode === 'roast') {
        const roast = await askAI({
          prompt: `You are a witty, Gen-Z tech mentor in a shared vibe room. Give this study/hack pod a playful, high-energy, humorous roast and hype-check based on their active tasks and habits:\n\n${groupContext}\nKeep it punchy, funny, and deeply encouraging.`,
          mode: 'chat',
        });
        room.aiGroupVibe.playfulRoast = roast;
        this.save();
        return { roast };
      }
    } catch (e) {
      console.warn('AI group vibe synthesis fallback:', e);
    }

    return {
      summary: room.aiGroupVibe.weeklySummary,
      quiz: room.aiGroupVibe.studyQuiz,
      roast: room.aiGroupVibe.playfulRoast,
    };
  }
}

export const vibeRoomService = new VibeRoomService();
