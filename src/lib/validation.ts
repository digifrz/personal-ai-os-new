import { AppError } from './errors';

export function validateTaskInput(title: string, priority?: string): void {
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Task title cannot be empty.', 'VALIDATION_FAILED');
  }
  if (title.trim().length > 200) {
    throw new AppError('Task title cannot exceed 200 characters.', 'VALIDATION_FAILED');
  }
  if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
    throw new AppError('Invalid task priority value.', 'VALIDATION_FAILED');
  }
}

export function validateNoteInput(title: string, content: string): void {
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Note title cannot be empty.', 'VALIDATION_FAILED');
  }
  if (title.trim().length > 200) {
    throw new AppError('Note title cannot exceed 200 characters.', 'VALIDATION_FAILED');
  }
  if (content && content.length > 50000) {
    throw new AppError('Note content exceeds maximum capacity (50,000 chars).', 'VALIDATION_FAILED');
  }
}

export function validatePostInput(title: string, content: string): void {
  if (!title && !content) {
    throw new AppError('Post must include either a title or content.', 'VALIDATION_FAILED');
  }
  if (title && title.length > 150) {
    throw new AppError('Post title cannot exceed 150 characters.', 'VALIDATION_FAILED');
  }
  if (content && content.length > 3000) {
    throw new AppError('Post content cannot exceed 3,000 characters.', 'VALIDATION_FAILED');
  }
}

export function validateCommentInput(content: string): void {
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new AppError('Comment content cannot be empty.', 'VALIDATION_FAILED');
  }
  if (content.trim().length > 600) {
    throw new AppError('Comment cannot exceed 600 characters.', 'VALIDATION_FAILED');
  }
}

export function validateMessageInput(content: string): void {
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new AppError('Message cannot be empty.', 'VALIDATION_FAILED');
  }
  if (content.trim().length > 2000) {
    throw new AppError('Message cannot exceed 2,000 characters.', 'VALIDATION_FAILED');
  }
}

export function validateProfileInput(data: { name?: string; username?: string; bio?: string }): void {
  if (data.name !== undefined) {
    if (!data.name.trim()) throw new AppError('Display name cannot be empty.', 'VALIDATION_FAILED');
    if (data.name.trim().length > 80) throw new AppError('Name cannot exceed 80 characters.', 'VALIDATION_FAILED');
  }
  if (data.username !== undefined && data.username.trim()) {
    const cleaned = data.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(cleaned)) {
      throw new AppError('Username must be 3-30 characters using only lowercase letters, numbers, and underscores.', 'VALIDATION_FAILED');
    }
  }
  if (data.bio !== undefined && data.bio.length > 300) {
    throw new AppError('Bio cannot exceed 300 characters.', 'VALIDATION_FAILED');
  }
}

export function validateFileSize(file: File, maxMb = 25): void {
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new AppError(`File size exceeds the ${maxMb}MB limit.`, 'VALIDATION_FAILED');
  }
}
