/* ── Theme Switcher ─────────────────────────────────────────── */
window.applyTheme = function(theme) {
  if (!theme) return;
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('pms_theme', theme); } catch (_) {}
  const btn = el('btn-theme-toggle');
  if (btn) {
    if (theme === 'bluish') {
      btn.innerHTML = '<i class="fa-solid fa-sun" style="color:#f59e0b"></i>';
      btn.title = 'লাইট থিম চালু করুন (Light Theme)';
    } else {
      btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      btn.title = 'ব্লুইশ থিম চালু করুন (Bluish Neon Theme)';
    }
  }
};

function initThemeToggle() {
  const btn = el('btn-theme-toggle');
  const getTheme = () => document.documentElement.getAttribute('data-theme') || localStorage.getItem('pms_theme') || 'bluish';

  const currentTheme = getTheme();
  window.applyTheme(currentTheme);

  btn?.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme') || 'bluish';
    const next = active === 'bluish' ? 'light' : 'bluish';
    window.applyTheme(next);
    toast(next === 'bluish' ? 'ব্লুইশ নিয়ন থিম চালু হয়েছে' : 'লাইট থিম চালু হয়েছে', 'info', 2000);
    // Push theme update to cloud
    if (typeof scheduleCloudSync === 'function') scheduleCloudSync();
  });
}
