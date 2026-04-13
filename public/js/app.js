// FODMAP App — Entry Point
import { initRouter } from './router.js';
import { t, toggleLang, setLang, getLang, onLangChange } from './i18n.js';
import { isAuthenticated, login, clearAuthToken } from './api-client.js';
import { hasAcceptedDisclaimer, acceptDisclaimer } from './storage.js';

document.addEventListener('DOMContentLoaded', init);

function init() {
  // Set initial language
  setLang(getLang());

  if (isAuthenticated()) {
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  loginScreen.hidden = false;
  app.hidden = true;

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.querySelector('span').textContent = '...';

    try {
      await login(user, pass);
      showApp();
    } catch (err) {
      errorEl.textContent = t(err.status === 401 ? 'loginError' : 'loginErrorNetwork');
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = t('loginButton');
    }
  });
}

function showApp() {
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  loginScreen.hidden = true;
  app.hidden = false;

  // Check disclaimer
  if (!hasAcceptedDisclaimer()) {
    showDisclaimer();
  }

  // Init router
  initRouter();

  // Language toggle
  document.getElementById('lang-toggle').addEventListener('click', toggleLang);

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    clearAuthToken();
    window.location.reload();
  });

  // Update i18n on language change
  onLangChange(() => {
    // Re-render current view
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function showDisclaimer() {
  const modal = document.getElementById('disclaimer-modal');
  modal.hidden = false;

  document.getElementById('disclaimer-accept').addEventListener('click', () => {
    acceptDisclaimer();
    modal.hidden = true;
  });
}
