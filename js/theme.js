/* ── Theme Switcher ─────────────────────────────────────────── */
function initThemeToggle() {
  const btn = el('btn-theme-toggle');
  const getTheme = () => document.documentElement.getAttribute('data-theme') || localStorage.getItem('pms_theme') || 'light';
  const updateIcon = (theme) => {
    if (!btn) return;
    if (theme === 'bluish') {
      btn.innerHTML = '<i class="fa-solid fa-sun" style="color:#f59e0b"></i>';
      btn.title = 'লাইট থিম চালু করুন (Light Theme)';
    } else {
      btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      btn.title = 'ব্লুইশ থিম চালু করুন (Bluish Neon Theme)';
    }
  };

  const currentTheme = getTheme();
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateIcon(currentTheme);

  btn?.addEventListener('click', () => {
    const active = getTheme();
    const next = active === 'bluish' ? 'light' : 'bluish';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('pms_theme', next);
    } catch (_) {}
    updateIcon(next);
    toast(next === 'bluish' ? 'ব্লুইশ নিয়ন থিম চালু হয়েছে' : 'লাইট থিম চালু হয়েছে', 'info', 2000);
  });
}
