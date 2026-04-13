// Favorites component
import { t } from '../i18n.js';
import { el, clearEl } from '../utils/dom.js';
import { getFavorites } from '../storage.js';
import { renderResultCard } from './result-card.js';

export function render(container) {
  clearEl(container);
  const wrapper = el('div');

  wrapper.appendChild(el('h2', { className: 'section-title mb-md', style: 'text-transform:none;font-size:1.1rem;' }, t('favoritesTitle')));

  const favorites = getFavorites();

  if (favorites.length === 0) {
    wrapper.appendChild(el('div', { className: 'empty-state' },
      el('p', { className: 'empty-state-title' }, t('favoritesEmpty')),
      el('p', { className: 'empty-state-text' }, t('favoritesEmptyText'))
    ));
  } else {
    for (const fav of favorites) {
      renderResultCard(wrapper, fav);
    }
  }

  container.appendChild(wrapper);
}
