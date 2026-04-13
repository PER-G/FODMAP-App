// Analyzer component — text/image FODMAP analysis
import { t, getLang } from '../i18n.js';
import { el, clearEl, renderSkeleton, showToast } from '../utils/dom.js';
import { api } from '../api-client.js';
import { renderAnalysisResult } from './result-card.js';
import { addHistory } from '../storage.js';
import { resizeAndCompressImage } from '../utils/image.js';

let currentAbort = null;

export function render(container, params = {}) {
  clearEl(container);

  const wrapper = el('div', { className: 'analyzer-view' });

  // Title
  wrapper.appendChild(el('h2', { className: 'section-title mb-md', style: 'text-transform:none;font-size:1.1rem;' }, t('analyzerTitle')));

  // Search bar
  const searchBar = el('div', { className: 'search-bar mb-md' });
  searchBar.innerHTML = `<svg class="search-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

  const input = el('input', {
    type: 'text',
    placeholder: t('analyzerPlaceholder'),
    id: 'analyze-input',
    style: 'padding-left:40px;',
  });
  if (params.q) input.value = params.q;
  searchBar.appendChild(input);

  const actions = el('div', { className: 'search-bar-actions' });

  // Camera button
  const cameraBtn = el('button', { className: 'btn-icon', title: t('dashboardCamera') });
  cameraBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  actions.appendChild(cameraBtn);

  // Submit button
  const submitBtn = el('button', { className: 'btn btn-primary', id: 'analyze-btn' }, t('analyzerSubmit'));
  actions.appendChild(submitBtn);

  searchBar.appendChild(actions);
  wrapper.appendChild(searchBar);

  // Image upload area (hidden)
  const fileInput = el('input', { type: 'file', accept: 'image/*', className: 'hidden', id: 'image-input' });
  wrapper.appendChild(fileInput);

  // Image preview
  const imagePreview = el('div', { className: 'image-preview-container hidden', id: 'image-preview' });
  wrapper.appendChild(imagePreview);

  // Hint
  wrapper.appendChild(el('p', { className: 'text-xs text-muted mb-md text-center' }, t('analyzerImageHint')));

  // Results area
  const resultsArea = el('div', { id: 'analysis-results' });
  wrapper.appendChild(resultsArea);

  container.appendChild(wrapper);

  // State
  let selectedImage = null;

  // Events
  submitBtn.addEventListener('click', () => doAnalysis(input.value.trim(), selectedImage, resultsArea));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doAnalysis(input.value.trim(), selectedImage, resultsArea);
  });

  cameraBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      selectedImage = await resizeAndCompressImage(file);
      showImagePreview(imagePreview, selectedImage, () => {
        selectedImage = null;
        imagePreview.classList.add('hidden');
        imagePreview.textContent = '';
      });
    } catch (err) {
      showToast(t('error'), 'error');
    }
  });

  // Auto-submit if params have a query
  if (params.q) {
    setTimeout(() => doAnalysis(params.q, null, resultsArea), 100);
  }
}

async function doAnalysis(query, image, resultsArea) {
  if (!query && !image) return;

  // Cancel previous request
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  clearEl(resultsArea);
  renderSkeleton(resultsArea, 2);

  try {
    let result;
    const lang = getLang();

    if (image) {
      result = await api('analyze-image', {
        method: 'POST',
        body: { image: image.base64, mediaType: image.mediaType, text: query, lang },
        signal: currentAbort.signal,
        timeout: 45000,
      });
    } else {
      result = await api('analyze', {
        method: 'POST',
        body: { text: query, lang },
        signal: currentAbort.signal,
        timeout: 30000,
      });
    }

    clearEl(resultsArea);
    renderAnalysisResult(resultsArea, result);

    // Save to history
    addHistory({
      query: query || '(Bild)',
      type: image ? 'image' : 'food',
      title: result.structured?.items?.[0]?.name || result.structured?.recognized_items?.[0] || query,
      status: result.structured?.overall_status || result.structured?.items?.[0]?.overall_status || 'unknown',
      result,
    });

  } catch (err) {
    clearEl(resultsArea);
    if (err.name === 'AbortError' || err.message === 'Request timeout') return;
    resultsArea.appendChild(el('div', { className: 'empty-state' },
      el('p', { className: 'empty-state-title' }, t('analyzeError')),
      el('button', { className: 'btn btn-secondary mt-md', onClick: () => doAnalysis(query, image, resultsArea) }, t('retry'))
    ));
  }
}

function showImagePreview(previewEl, image, onRemove) {
  previewEl.textContent = '';
  previewEl.classList.remove('hidden');

  const img = el('img', { src: image.dataUrl, alt: 'Preview' });
  const removeBtn = el('button', { className: 'image-preview-remove' });
  removeBtn.innerHTML = '✕';
  removeBtn.addEventListener('click', onRemove);

  previewEl.appendChild(img);
  previewEl.appendChild(removeBtn);
}
