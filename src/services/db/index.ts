export * from './tasks.repo';
export * from './notes.repo';
export * from './calendar.repo';
export * from './goals.repo';
export * from './projects.repo';
export * from './learning.repo';
export * from './files.repo';
export * from './community.repo';
export * from './aiMemory.repo';
export * from './profile.repo';

// Backward compatibility alias bindings
import { subscribeTasks } from './tasks.repo';
import { subscribeNotes } from './notes.repo';
import { subscribeFiles } from './files.repo';
import { subscribeCalendarEvents } from './calendar.repo';
import { subscribeGoals } from './goals.repo';
import { subscribeProjects } from './projects.repo';
import { subscribeFlashcards } from './learning.repo';
import { subscribeCommunityPosts } from './community.repo';
import { subscribeNotifications } from './profile.repo';

export const listenToTasks = subscribeTasks;
export const listenToNotes = subscribeNotes;
export const listenToFiles = subscribeFiles;
export const listenToCalendarEvents = subscribeCalendarEvents;
export const listenToGoals = subscribeGoals;
export const listenToProjects = subscribeProjects;
export const listenToFlashcards = subscribeFlashcards;
export const listenToCommunityPosts = subscribeCommunityPosts;
export const listenToNotifications = subscribeNotifications;
