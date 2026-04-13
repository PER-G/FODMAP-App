// Minimal pub/sub state store
const state = {
  currentView: 'dashboard',
  analysisResult: null,
  chatMessages: [],
  isLoading: false,
  error: null,
};

const subscribers = new Map();

export function getState() {
  return state;
}

export function setState(partial) {
  const changed = [];
  for (const [key, value] of Object.entries(partial)) {
    if (state[key] !== value) {
      state[key] = value;
      changed.push(key);
    }
  }
  for (const key of changed) {
    const fns = subscribers.get(key);
    if (fns) fns.forEach(fn => fn(state[key], state));
  }
}

export function subscribe(key, fn) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(fn);
  return () => subscribers.get(key).delete(fn);
}
