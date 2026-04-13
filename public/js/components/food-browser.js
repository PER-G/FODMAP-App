// Food Browser component — browse seed database
import { t, getLang } from '../i18n.js';
import { el, clearEl, debounce, renderSkeleton } from '../utils/dom.js';
import { api } from '../api-client.js';
import { navigate } from '../router.js';

const CATEGORIES = [
  { key: 'foodsAll', value: '' },
  { key: 'foodsCategoryFruit', value: 'fruit' },
  { key: 'foodsCategoryVeg', value: 'vegetable' },
  { key: 'foodsCategoryGrain', value: 'grain' },
  { key: 'foodsCategoryDairy', value: 'dairy' },
  { key: 'foodsCategoryProtein', value: 'protein' },
  { key: 'foodsCategoryOther', value: 'other' },
];

export function render(container) {
  clearEl(container);
  const wrapper = el('div');

  wrapper.appendChild(el('h2', { className: 'section-title mb-md', style: 'text-transform:none;font-size:1.1rem;' }, t('foodsTitle')));

  // Search
  const searchInput = el('input', { type: 'search', placeholder: t('foodsSearch'), className: 'mb-md' });
  wrapper.appendChild(searchInput);

  // Category tabs
  const tabs = el('div', { className: 'chips-row mb-md' });
  let activeCategory = '';

  for (const cat of CATEGORIES) {
    const chip = el('span', { className: `chip ${cat.value === '' ? 'active' : ''}` }, t(cat.key));
    chip.addEventListener('click', () => {
      activeCategory = cat.value;
      tabs.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadFoods();
    });
    tabs.appendChild(chip);
  }
  wrapper.appendChild(tabs);

  // List
  const listEl = el('div', { id: 'foods-list' });
  wrapper.appendChild(listEl);

  container.appendChild(wrapper);

  async function loadFoods() {
    clearEl(listEl);
    renderSkeleton(listEl, 5);

    try {
      const params = new URLSearchParams();
      if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
      if (activeCategory) params.set('category', activeCategory);
      params.set('limit', '50');

      const result = await api(`foods?${params.toString()}`);
      clearEl(listEl);

      if (result.items?.length === 0) {
        listEl.appendChild(el('p', { className: 'text-sm text-muted text-center mt-lg' }, t('noResults')));
        return;
      }

      for (const food of result.items || []) {
        const statusClass = food.fodmapRating === 'green' ? 'badge-dot-green' : food.fodmapRating === 'yellow' ? 'badge-dot-yellow' : food.fodmapRating === 'red' ? 'badge-dot-red' : '';
        const item = el('div', { className: 'history-item' });
        if (statusClass) item.appendChild(el('span', { className: `badge-dot ${statusClass}`, style: 'flex-shrink:0;' }));

        const content = el('div', { className: 'history-item-content' });
        content.appendChild(el('div', { className: 'history-item-title' }, food.name));
        const meta = [food.category, food.portionNote].filter(Boolean).join(' · ');
        if (meta) content.appendChild(el('div', { className: 'history-item-meta' }, meta));
        item.appendChild(content);

        const badge = food.fodmapRating === 'green' ? 'badge-green' : food.fodmapRating === 'yellow' ? 'badge-yellow' : food.fodmapRating === 'red' ? 'badge-red' : 'badge-unknown';
        const statusLabel = food.fodmapRating === 'green' ? t('fodmapGreen') : food.fodmapRating === 'yellow' ? t('fodmapYellow') : food.fodmapRating === 'red' ? t('fodmapRed') : '';
        if (statusLabel) {
          item.appendChild(el('span', { className: `badge ${badge}`, style: 'font-size:0.6rem;' }, statusLabel));
        }

        item.addEventListener('click', () => navigate('analyze', { q: food.name }));
        listEl.appendChild(item);
      }
    } catch {
      clearEl(listEl);
      listEl.appendChild(el('p', { className: 'text-sm', style: 'color:var(--error);' }, t('error')));
    }
  }

  searchInput.addEventListener('input', debounce(loadFoods, 300));
  loadFoods();
}
