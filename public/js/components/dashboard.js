// Dashboard component — main landing screen
import { t, getLang } from '../i18n.js';
import { el, clearEl } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getHistory } from '../storage.js';

const QUICK_ACTIONS = [
  { key: 'quickBreakfast', icon: '🌅', query: 'low fodmap Frühstück' },
  { key: 'quickLunch', icon: '🍽', query: 'low fodmap Mittagessen' },
  { key: 'quickDinner', icon: '🌙', query: 'low fodmap Abendessen' },
  { key: 'quickSnack', icon: '🥜', query: 'low fodmap Snacks' },
  { key: 'quickHighProtein', icon: '💪', query: 'high protein low fodmap' },
  { key: 'quickLowCal', icon: '🥗', query: 'kalorienarm low fodmap' },
  { key: 'quickVegetarian', icon: '🥕', query: 'vegetarisch low fodmap' },
  { key: 'quickVegan', icon: '🌱', query: 'vegan low fodmap' },
];

const POPULAR = [
  'Hafermilch', 'Skyr', 'Reis', 'Banane', 'Kartoffeln',
  'Laktosefreier Joghurt', 'Tofu', 'Haferflocken',
];

export function render(container) {
  clearEl(container);

  const wrapper = el('div', { className: 'dashboard-view' });

  // Search bar
  const searchBar = el('div', { className: 'search-bar mb-md' });
  searchBar.innerHTML = `<svg class="search-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

  const input = el('input', {
    type: 'text',
    placeholder: t('dashboardSearch'),
    style: 'padding-left:40px;',
  });
  searchBar.appendChild(input);

  const actions = el('div', { className: 'search-bar-actions' });

  const cameraBtn = el('button', { className: 'btn btn-secondary btn-sm' }, t('dashboardCamera'));
  cameraBtn.addEventListener('click', () => navigate('analyze'));
  actions.appendChild(cameraBtn);

  searchBar.appendChild(actions);
  wrapper.appendChild(searchBar);

  // Submit on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      navigate('analyze', { q: input.value.trim() });
    }
  });

  // Quick actions
  const quickHeader = el('div', { className: 'section-header' });
  quickHeader.appendChild(el('span', { className: 'section-title' }, t('popularQueries')));
  wrapper.appendChild(quickHeader);

  const quickGrid = el('div', { className: 'quick-actions' });
  for (const action of QUICK_ACTIONS) {
    const btn = el('a', {
      className: 'quick-action',
      href: `#/analyze?q=${encodeURIComponent(getLang() === 'en' ? action.query.replace('Frühstück', 'breakfast').replace('Mittagessen', 'lunch').replace('Abendessen', 'dinner').replace('Snacks', 'snacks').replace('kalorienarm', 'low calorie').replace('vegetarisch', 'vegetarian') : action.query)}`,
    });
    btn.appendChild(el('span', {}, action.icon));
    btn.appendChild(el('span', {}, t(action.key)));
    quickGrid.appendChild(btn);
  }
  wrapper.appendChild(quickGrid);

  // Popular queries
  const popHeader = el('div', { className: 'section-header' });
  popHeader.appendChild(el('span', { className: 'section-title' }, t('recommendedAlts')));
  wrapper.appendChild(popHeader);

  const chipsRow = el('div', { className: 'chips-row' });
  for (const item of POPULAR) {
    const chip = el('span', { className: 'chip' }, item);
    chip.addEventListener('click', () => navigate('analyze', { q: item }));
    chipsRow.appendChild(chip);
  }
  wrapper.appendChild(chipsRow);

  // Recent searches
  const history = getHistory().slice(0, 5);
  if (history.length > 0) {
    const histHeader = el('div', { className: 'section-header' });
    histHeader.appendChild(el('span', { className: 'section-title' }, t('recentSearches')));
    const histLink = el('a', { className: 'section-link', href: '#/history' }, t('navHistory') + ' →');
    histHeader.appendChild(histLink);
    wrapper.appendChild(histHeader);

    for (const entry of history) {
      const statusColor = entry.status === 'green' ? 'badge-dot-green' : entry.status === 'yellow' ? 'badge-dot-yellow' : entry.status === 'red' ? 'badge-dot-red' : '';
      const item = el('div', { className: 'history-item' });
      if (statusColor) {
        item.appendChild(el('span', { className: `badge-dot ${statusColor}`, style: 'flex-shrink:0;' }));
      }
      const contentDiv = el('div', { className: 'history-item-content' });
      contentDiv.appendChild(el('div', { className: 'history-item-title' }, entry.title || entry.query));
      const date = new Date(entry.timestamp);
      contentDiv.appendChild(el('div', { className: 'history-item-meta' }, date.toLocaleDateString('de-DE')));
      item.appendChild(contentDiv);
      item.addEventListener('click', () => navigate('analyze', { q: entry.query }));
      wrapper.appendChild(item);
    }
  } else {
    wrapper.appendChild(el('p', { className: 'text-sm text-muted text-center mt-lg' }, t('noRecentSearches')));
  }

  container.appendChild(wrapper);
}
