/**
 * Native Browser Web Notifications Service
 * Dispatches OS desktop / web notifications when tasks are ready, reminders trigger, or messages arrive.
 */

export async function requestWebNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  return false;
}

export function isWebNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getWebNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isWebNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function sendWebNotification(title: string, options?: { body?: string; icon?: string; tag?: string }) {
  if (!isWebNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body: options?.body,
        icon: options?.icon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128',
        tag: options?.tag,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn('Native notification dispatch notice:', err);
    }
  }
}

/**
 * Specifically notifies the user on the web / OS desktop when a task is completed or ready.
 */
export function notifyTaskReady(taskTitle: string, extraNote?: string) {
  const body = extraNote ? `${extraNote}` : 'Task has been completed and synced across your workspace.';
  sendWebNotification(`⚡ Task Ready: ${taskTitle}`, {
    body,
    tag: `task-ready-${Date.now()}`,
  });
}
