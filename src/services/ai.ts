import { AppError } from '../lib/errors';

export interface AskAIOptions {
  prompt: string;
  mode?: 'chat' | 'code' | 'image' | 'summarize' | 'suggest_tasks' | 'study_quiz' | 'weekly_review';
  context?: any;
  projectId?: string | null;
}

export async function askAI(options: AskAIOptions): Promise<string> {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new AppError(
        errData.error || `AI Assistant failed with status ${response.status}`,
        response.status === 429 ? 'RATE_LIMITED' : 'INTERNAL'
      );
    }

    const data = await response.json();
    return data.answer || 'No response generated.';
  } catch (err) {
    throw AppError.from(err, 'NETWORK_ERROR');
  }
}

export async function polishContentAI(content: string): Promise<string> {
  try {
    const response = await fetch('/api/assistant/polish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      return content;
    }

    const data = await response.json();
    return data.polished || content;
  } catch (e) {
    console.warn('AI polishing fallback to original content:', e);
    return content;
  }
}

export async function suggestTagsAI(content: string): Promise<string[]> {
  try {
    const response = await fetch('/api/assistant/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      return ['General'];
    }

    const data = await response.json();
    return Array.isArray(data.tags) ? data.tags : ['General'];
  } catch (e) {
    console.warn('AI tag suggestions fallback:', e);
    return ['General'];
  }
}
