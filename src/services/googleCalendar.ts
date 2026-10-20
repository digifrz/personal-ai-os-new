import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { CalendarEventItem } from '../types';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './db/calendar.repo';

// In-memory token cache as mandated by workspace-integration guidelines
let inMemoryCalendarAccessToken: string | null = null;

export function getCachedCalendarAccessToken(): string | null {
  return inMemoryCalendarAccessToken;
}

export function setCachedCalendarAccessToken(token: string | null) {
  inMemoryCalendarAccessToken = token;
}

// Request or renew Google Calendar access token via Firebase Auth popup
export async function authenticateGoogleCalendar(): Promise<string | null> {
  try {
    // Add Google Calendar OAuth scopes to provider
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    googleProvider.addScope('https://www.googleapis.com/auth/calendar');

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      inMemoryCalendarAccessToken = credential.accessToken;
      return credential.accessToken;
    }
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Google sign-in popup closed by user.');
      return null;
    }
    console.error('Failed to authenticate Google Calendar:', err);
    throw err;
  }
  return inMemoryCalendarAccessToken;
}

export interface GoogleCalendarEventPayload {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

// Fetch remote events from Google Calendar API
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<GoogleCalendarEventPayload[]> {
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    oneMonthAgo
  )}&singleEvents=true&orderBy=startTime&maxResults=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Calendar API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (data.items || []) as GoogleCalendarEventPayload[];
}

// Create an event on Google Calendar
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    location?: string;
    startsAt: string;
    endsAt?: string;
  }
): Promise<GoogleCalendarEventPayload> {
  const startDateTime = new Date(event.startsAt).toISOString();
  const endDateTime = event.endsAt
    ? new Date(event.endsAt).toISOString()
    : new Date(new Date(event.startsAt).getTime() + 60 * 60 * 1000).toISOString();

  const body: GoogleCalendarEventPayload = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: startDateTime,
    },
    end: {
      dateTime: endDateTime,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to push event to Google Calendar (${response.status}): ${errText}`);
  }

  return (await response.json()) as GoogleCalendarEventPayload;
}

// Delete an event on Google Calendar (requires explicit confirmation)
export async function deleteRemoteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.ok;
}

export interface SyncReport {
  pushed: number;
  pulled: number;
  matched: number;
  errors: string[];
  syncedAt: string;
}

// Bi-directional synchronization between local events and personal Google Calendar
export async function syncGoogleCalendarBiDirectionally(
  accessToken: string,
  localEvents: CalendarEventItem[],
  userId: string
): Promise<SyncReport> {
  const report: SyncReport = {
    pushed: 0,
    pulled: 0,
    matched: 0,
    errors: [],
    syncedAt: new Date().toISOString(),
  };

  try {
    // 1. Fetch all remote events from user's Google Calendar account
    const remoteEvents = await fetchGoogleCalendarEvents(accessToken);
    const remoteMap = new Map<string, GoogleCalendarEventPayload>();
    remoteEvents.forEach((evt) => {
      if (evt.id) remoteMap.set(evt.id, evt);
    });

    // 2. Identify local events that need to be pushed to Google Calendar
    for (const local of localEvents) {
      if (local.googleCalendarEventId && remoteMap.has(local.googleCalendarEventId)) {
        // Already paired with Google Calendar
        report.matched++;
      } else {
        // Push local event to Google Calendar
        try {
          const createdRemote = await createGoogleCalendarEvent(accessToken, {
            title: local.title,
            description: local.description,
            location: local.location,
            startsAt: local.startsAt,
            endsAt: local.endsAt || undefined,
          });

          if (createdRemote.id) {
            await updateCalendarEvent(local.id, {
              googleCalendarEventId: createdRemote.id,
              syncedAt: report.syncedAt,
            });
            report.pushed++;
          }
        } catch (pushErr: any) {
          report.errors.push(`Could not push "${local.title}": ${pushErr.message}`);
        }
      }
    }

    // 3. Identify remote Google Calendar events that don't exist locally and pull them
    const localGoogleIds = new Set(
      localEvents.map((l) => l.googleCalendarEventId).filter(Boolean) as string[]
    );

    for (const remote of remoteEvents) {
      if (remote.id && !localGoogleIds.has(remote.id)) {
        try {
          const startStr = remote.start?.dateTime || remote.start?.date || new Date().toISOString();
          const endStr = remote.end?.dateTime || remote.end?.date || null;

          await createCalendarEvent({
            userId,
            title: remote.summary || 'Google Calendar Event',
            description: remote.description || '',
            category: 'Google Calendar',
            startsAt: startStr,
            endsAt: endStr,
            location: remote.location || '',
            googleCalendarEventId: remote.id,
            syncedAt: report.syncedAt,
          });
          report.pulled++;
        } catch (pullErr: any) {
          report.errors.push(`Could not import "${remote.summary}": ${pullErr.message}`);
        }
      }
    }
  } catch (err: any) {
    report.errors.push(err.message || 'General sync failure');
    throw err;
  }

  return report;
}
