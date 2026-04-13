// Hash-based SPA router with dynamic imports
import { setState } from './state.js';

const routes = {
  dashboard:  () => import('./components/dashboard.js'),
  analyze:    () => import('./components/analyzer.js'),
  chat:       () => import('./components/chat.js'),
  recipes:    () => import('./components/recipes.js'),
  history:    () => import('./components/history.js'),
  favorites:  () => import('./components/favorites.js'),
  foods:      () => import('./components/food-browser.js'),
  mealgen:    () => import('./components/meal-generator.js'),
  more:       () => import('./components/more.js'),
  settings:   () => import('./components/settings.js'),
};

let currentDestroy = null;

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function navigate(view, params = {}) {
  const paramStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  window.location.hash = `#/${view}${paramStr ? '?' + paramStr : ''}`;
}

async function handleRoute() {
  const hash = window.location.hash || '#/dashboard';
  const [path, queryStr] = hash.replace('#/', '').split('?');
  const view = path || 'dashboard';
  const params = Object.fromEntries(new URLSearchParams(queryStr || ''));

  setState({ currentView: view });
  updateNav(view);

  const content = document.getElementById('content');
  if (!content) return;

  // Destroy previous view
  if (currentDestroy) {
    currentDestroy();
    currentDestroy = null;
  }

  const loader = routes[view];
  if (!loader) {
    content.innerHTML = `<div class="empty-state"><p class="empty-state-title">404</p></div>`;
    return;
  }

  try {
    const module = await loader();
    if (module.render) {
      module.render(content, params);
    }
    if (module.destroy) {
      currentDestroy = module.destroy;
    }
  } catch (err) {
    console.error('Route load error:', err);
    content.innerHTML = `<div class="empty-state"><p class="empty-state-title">Fehler beim Laden</p></div>`;
  }
}

function updateNav(view) {
  document.querySelectorAll('.nav-item').forEach(item => {
    const itemView = item.getAttribute('data-view');
    item.classList.toggle('active', itemView === view);
  });
}
