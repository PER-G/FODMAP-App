// Meal Generator component
import { t, getLang } from '../i18n.js';
import { el, clearEl, renderSkeleton } from '../utils/dom.js';
import { api } from '../api-client.js';
import { renderAnalysisResult } from './result-card.js';

const MEAL_TYPES = [
  { key: 'breakfast', value: 'breakfast' },
  { key: 'lunch', value: 'lunch' },
  { key: 'dinner', value: 'dinner' },
  { key: 'snack', value: 'snack' },
];

const FILTERS = [
  { key: 'highProtein', value: 'highProtein' },
  { key: 'lowCalorie', value: 'lowCalorie' },
  { key: 'vegetarian', value: 'vegetarian' },
  { key: 'vegan', value: 'vegan' },
  { key: 'budget', value: 'budget' },
  { key: 'fewIngredients', value: 'fewIngredients' },
  { key: 'quick', value: 'quick' },
  { key: 'mealPrep', value: 'mealPrep' },
];

export function render(container) {
  clearEl(container);
  const wrapper = el('div');

  wrapper.appendChild(el('h2', { className: 'section-title mb-sm', style: 'text-transform:none;font-size:1.1rem;' }, t('mealGenTitle')));
  wrapper.appendChild(el('p', { className: 'text-sm text-muted mb-md' }, t('mealGenDescription')));

  // Meal type selection
  wrapper.appendChild(el('div', { className: 'section-title mb-sm' }, t('mealType')));
  const typeRow = el('div', { className: 'chips-row mb-md' });
  let selectedType = 'lunch';

  for (const mt of MEAL_TYPES) {
    const chip = el('span', { className: `chip ${mt.value === selectedType ? 'active' : ''}`, dataset: { value: mt.value } }, t(mt.key));
    chip.addEventListener('click', () => {
      selectedType = mt.value;
      typeRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
    typeRow.appendChild(chip);
  }
  wrapper.appendChild(typeRow);

  // Filters
  wrapper.appendChild(el('div', { className: 'section-title mb-sm' }, t('mealFilters')));
  const filterGrid = el('div', { className: 'filter-grid mb-lg' });
  const selectedFilters = new Set();

  for (const f of FILTERS) {
    const chip = el('span', { className: 'chip', dataset: { value: f.value } }, t(f.key));
    chip.addEventListener('click', () => {
      if (selectedFilters.has(f.value)) {
        selectedFilters.delete(f.value);
        chip.classList.remove('active');
      } else {
        selectedFilters.add(f.value);
        chip.classList.add('active');
      }
    });
    filterGrid.appendChild(chip);
  }
  wrapper.appendChild(filterGrid);

  // Generate button
  const btn = el('button', { className: 'btn btn-primary btn-full' }, t('generateMeal'));
  wrapper.appendChild(btn);

  // Results
  const results = el('div', { className: 'mt-lg', id: 'meal-results' });
  wrapper.appendChild(results);

  container.appendChild(wrapper);

  btn.addEventListener('click', async () => {
    clearEl(results);
    renderSkeleton(results, 2);
    btn.disabled = true;

    try {
      const result = await api('suggest-meal', {
        method: 'POST',
        body: { mealType: selectedType, filters: [...selectedFilters], lang: getLang() },
        timeout: 30000,
      });
      clearEl(results);
      renderAnalysisResult(results, result);
    } catch (err) {
      clearEl(results);
      results.appendChild(el('p', { className: 'text-sm', style: 'color:var(--error);' }, t('analyzeError')));
    } finally {
      btn.disabled = false;
    }
  });
}
