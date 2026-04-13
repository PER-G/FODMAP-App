// Client-side storage abstraction (localStorage)
const KEYS = {
  history: 'fodmap-history',
  favorites: 'fodmap-favorites',
  settings: 'fodmap-settings',
  disclaimer: 'fodmap-disclaimer',
};

const MAX_HISTORY = 100;
const MAX_FAVORITES = 200;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || null;
  } catch { return null; }
}

function write(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

// --- History ---
export function getHistory() {
  return read(KEYS.history) || [];
}

export function addHistory(entry) {
  const list = getHistory();
  list.unshift({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...entry,
  });
  if (list.length > MAX_HISTORY) list.length = MAX_HISTORY;
  write(KEYS.history, list);
  return list;
}

export function removeHistory(id) {
  const list = getHistory().filter(e => e.id !== id);
  write(KEYS.history, list);
  return list;
}

export function clearHistory() {
  write(KEYS.history, []);
}

export function searchHistory(query) {
  const q = query.toLowerCase();
  return getHistory().filter(e =>
    (e.query || '').toLowerCase().includes(q) ||
    (e.title || '').toLowerCase().includes(q)
  );
}

// --- Favorites ---
export function getFavorites() {
  return read(KEYS.favorites) || [];
}

export function addFavorite(entry) {
  const list = getFavorites();
  if (list.some(e => e.id === entry.id)) return list;
  list.unshift({ ...entry, favoritedAt: Date.now() });
  if (list.length > MAX_FAVORITES) list.length = MAX_FAVORITES;
  write(KEYS.favorites, list);
  return list;
}

export function removeFavorite(id) {
  const list = getFavorites().filter(e => e.id !== id);
  write(KEYS.favorites, list);
  return list;
}

export function isFavorite(id) {
  return getFavorites().some(e => e.id === id);
}

// --- Settings ---
export function getSettings() {
  return read(KEYS.settings) || { theme: 'dark', lang: 'de' };
}

export function updateSettings(partial) {
  const current = getSettings();
  write(KEYS.settings, { ...current, ...partial });
}

// --- Disclaimer ---
export function hasAcceptedDisclaimer() {
  return read(KEYS.disclaimer) === true;
}

export function acceptDisclaimer() {
  write(KEYS.disclaimer, true);
}

// --- Export ---
export function exportHistoryAsJSON() {
  const data = JSON.stringify(getHistory(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fodmap-verlauf-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
