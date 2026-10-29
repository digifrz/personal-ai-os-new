import { Router, Request, Response } from 'express';
import {
  processAssistantRequest,
  polishPostContent,
  extractContentTags,
  generateVisionImage,
} from '../services/ai.service';
import { createRateLimiter } from '../middleware/rateLimiter';

export const assistantRouter = Router();

// Throttle AI requests to 60 requests per minute per client
const aiLimiter = createRateLimiter({ maxRequests: 60, windowMs: 60 * 1000 });

assistantRouter.use(aiLimiter);

assistantRouter.get('/health', async (_req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: hasKey ? 'operational' : 'missing_api_key',
    geminiConfigured: hasKey,
    defaultModel: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

assistantRouter.post('/', async (req: Request, res: Response, next) => {
  try {
    const { prompt, mode, context, projectId, media, provider, openaiApiKey } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt string is required' });
    }

    const answer = await processAssistantRequest({ prompt, mode, context, projectId, media, provider, openaiApiKey });
    res.json({ answer, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

assistantRouter.post('/polish', async (req: Request, res: Response, next) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content string is required' });
    }

    const polished = await polishPostContent(content);
    res.json({ polished, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

assistantRouter.post('/tags', async (req: Request, res: Response, next) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content string is required' });
    }

    const tags = await extractContentTags(content);
    res.json({ tags, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

assistantRouter.post('/generate-image', async (req: Request, res: Response, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt string is required' });
    }

    const imageUrl = await generateVisionImage(prompt);
    res.json({ imageUrl, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

