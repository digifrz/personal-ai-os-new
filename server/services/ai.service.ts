import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    client = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return client;
}

export interface AssistantRequestOptions {
  mode?: 'chat' | 'code' | 'image' | 'summarize' | 'suggest_tasks' | 'study_quiz' | 'weekly_review';
  prompt: string;
  context?: any;
  projectId?: string | null;
}

export async function processAssistantRequest(req: AssistantRequestOptions): Promise<string> {
  const ai = getGeminiClient();
  const mode = req.mode || 'chat';

  let systemInstruction = `You are Personal AI OS, an intelligent, calm, and proactive operating system assistant.
You are directly integrated into the user's private digital workspace which contains tasks, notes, files, calendar events, goals, projects, learning materials (flashcards, subjects, quizzes), and AI memories.
When answering, use the provided workspace context seamlessly to give precise, actionable, and grounded responses.
Tone: helpful, composed, clear, professional, without generic filler or sycophancy.
When you identify a clear user preference or habit in their message (e.g. "I usually study best at 9 PM" or "I prefer keeping tasks short"), highlight it at the end with a special tag: [PREFERENCE: <summary>] so the system can offer to save it to their AI Memory.
If asked to generate tasks, format each actionable task as [TASK: Title | Priority(high/medium/low) | Category | DueDate(optional YYYY-MM-DD)].
`;

  if (mode === 'code') {
    systemInstruction += `\nMode: You are a senior software architect. Provide clean, production-ready code with concise explanations and appropriate syntax highlighting.`;
  } else if (mode === 'image') {
    systemInstruction += `\nMode: You are a creative visual art director. Provide vivid, detailed artistic image prompts, composition ideas, aspect ratios, color palettes, and lighting setups.`;
  }

  // Cap context to 40,000 characters to prevent excessive token utilization
  let contextString = '';
  if (req.context) {
    const raw = JSON.stringify(req.context, null, 2);
    const trimmed = raw.length > 40000 ? raw.substring(0, 40000) + '...[truncated]' : raw;
    contextString = `\n\n--- CURRENT WORKSPACE CONTEXT ---\n${trimmed}`;
  }

  const fullPrompt = `${req.prompt}${contextString}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
    config: {
      systemInstruction,
      temperature: mode === 'code' ? 0.2 : 0.7,
    },
  });

  return response.text || 'No response generated.';
}

export async function polishPostContent(rawContent: string): Promise<string> {
  if (!rawContent || !rawContent.trim()) return rawContent;
  const ai = getGeminiClient();

  const prompt = `Review and refine this community post to make it clear, punchy, well-structured, and engaging while preserving the author's original voice, meaning, and intent. Return ONLY the improved text:\n\n${rawContent}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.4,
    },
  });

  return response.text?.trim() || rawContent;
}

export async function extractContentTags(content: string): Promise<string[]> {
  if (!content || !content.trim()) return ['General'];
  const ai = getGeminiClient();

  const prompt = `Analyze this post and extract 2 to 4 concise, relevant hashtags without the '#' symbol, separated by commas. Return ONLY the comma-separated keywords:\n\n${content}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  const text = response.text || '';
  const tags = text
    .split(',')
    .map((t) => t.trim().replace(/^#/, ''))
    .filter((t) => t.length > 0 && t.length < 25)
    .slice(0, 5);

  return tags.length > 0 ? tags : ['Discussion'];
}
