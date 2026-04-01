const STORAGE_PREFIX = 'eventra_profile_image_';
const LEGACY_KEY = 'userProfileImage';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId ?? 'guest'}`;
}

function dispatchChange(userId) {
  if (!isBrowser()) return;

  const event = new CustomEvent('eventra_profile_image_changed', {
    detail: { userId }
  });
  window.dispatchEvent(event);
}

export function loadProfileImage(userId) {
  if (!isBrowser()) return null;

  const key = getStorageKey(userId);
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;

  if (!userId) {
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    return legacy || null;
  }

  return null;
}

export function saveProfileImage(userId, imageDataUrl) {
  if (!isBrowser()) return;
  const key = getStorageKey(userId);

  if (imageDataUrl) {
    window.localStorage.setItem(key, imageDataUrl);
  } else {
    window.localStorage.removeItem(key);
  }

  dispatchChange(userId);
}

export function subscribeProfileImageChanges(userId, callback) {
  if (!isBrowser()) return () => {};

  const handler = (event) => {
    if (!event?.detail?.userId || event.detail.userId === userId) {
      callback(loadProfileImage(userId));
    }
  };

  window.addEventListener('eventra_profile_image_changed', handler);

  return () => {
    window.removeEventListener('eventra_profile_image_changed', handler);
  };
}
