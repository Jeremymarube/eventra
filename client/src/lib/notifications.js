const STORAGE_PREFIX = 'eventra_notifications_';
const MAX_NOTIFICATIONS = 50;

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId ?? 'guest'}`;
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function dispatchNotificationChange(key) {
  if (!isBrowser()) return;

  const event = new CustomEvent('eventra_notifications_changed', {
    detail: { key }
  });
  window.dispatchEvent(event);
}

export function loadNotifications(userId) {
  if (!isBrowser()) return [];

  const key = getStorageKey(userId);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((notification) => ({
      ...notification,
      timestamp: notification.timestamp ? new Date(notification.timestamp).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Unable to load notifications from localStorage:', error);
    return [];
  }
}

export function saveNotifications(userId, notifications) {
  if (!isBrowser()) return;

  const key = getStorageKey(userId);
  try {
    const normalized = (notifications || [])
      .slice(0, MAX_NOTIFICATIONS)
      .map((notification) => ({
        ...notification,
        timestamp: notification.timestamp ? new Date(notification.timestamp).toISOString() : new Date().toISOString(),
      }));
    window.localStorage.setItem(key, JSON.stringify(normalized));
    dispatchNotificationChange(key);
  } catch (error) {
    console.error('Unable to save notifications to localStorage:', error);
  }
}

export function addNotification(userId, notification) {
  if (!isBrowser()) return null;

  const now = new Date().toISOString();
  const id = notification.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const next = {
    id,
    title: notification.title || 'Notification',
    message: notification.message || '',
    type: notification.type || 'info',
    url: notification.url || null,
    read: notification.read || false,
    timestamp: notification.timestamp || now,
  };

  const current = loadNotifications(userId);
  const updated = [next, ...current].slice(0, MAX_NOTIFICATIONS);
  saveNotifications(userId, updated);
  return next;
}

export function markNotificationRead(userId, notificationId) {
  const current = loadNotifications(userId);
  const updated = current.map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  );
  saveNotifications(userId, updated);
  return updated;
}

export function markAllNotificationsRead(userId) {
  const current = loadNotifications(userId);
  const updated = current.map((notification) => ({ ...notification, read: true }));
  saveNotifications(userId, updated);
  return updated;
}

export function subscribeNotifications(userId, callback) {
  if (!isBrowser()) return () => {};

  const handleStorage = (event) => {
    if (!event.key || event.key === getStorageKey(userId)) {
      callback(loadNotifications(userId));
    }
  };

  const handleCustom = (event) => {
    if (!event?.detail?.key || event.detail.key === getStorageKey(userId)) {
      callback(loadNotifications(userId));
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('eventra_notifications_changed', handleCustom);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('eventra_notifications_changed', handleCustom);
  };
}
