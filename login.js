/**
 * ============================================================
 *  Property Management System — Google Authentication Controller
 * ============================================================
 */

'use strict';

function el(id) { return document.getElementById(id); }

function toast(msg, type = 'info', duration = 3500) {
  const icons = {
    success: '<i class="fa-solid fa-circle-check" style="color:var(--green)"></i>',
    error: '<i class="fa-solid fa-circle-xmark" style="color:var(--red)"></i>',
    warn: '<i class="fa-solid fa-triangle-exclamation" style="color:var(--amber)"></i>',
    info: '<i class="fa-solid fa-circle-info" style="color:var(--cyan)"></i>'
  };
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  div.innerHTML = `<span>${icons[type] || icons.info}</span><span>${msg}</span>`;
  const container = el('toast-container');
  if (container) {
    container.appendChild(div);
    setTimeout(() => {
      div.classList.add('out');
      setTimeout(() => div.remove(), 350);
    }, duration);
  }
}

function formatAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/operation-not-allowed') {
    return 'Firebase Console-এ Google Sign-in সক্রিয় (Enable) করা নেই। Console > Authentication > Sign-in method-এ গিয়ে Google সক্রিয় করুন।';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'ডোমেন অনুমোদিত নয়। Firebase Console > Authentication > Settings > Authorized domains-এ "127.0.0.1" যোগ করুন অথবা ব্রাউজারে http://localhost:5500/login.html ব্যবহার করুন।';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'গুগল সাইন-ইন পপ-আপ উইন্ডো বন্ধ করা হয়েছে। আবার চেষ্টা করুন।';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'পূর্ববর্তী অনুরোধ বাতিল করা হয়েছে।';
  }
  return err?.message || 'লগইন করতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
}

// ── Google Sign-In Action ────────────────────────────────────
el('btn-google-signin')?.addEventListener('click', async () => {
  const googleError = el('google-error');
  if (googleError) googleError.textContent = '';

  const btn = el('btn-google-signin');
  btn.disabled = true;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin-right:8px"></span> <span>গুগল অ্যাকাউন্টে সংযোগ হচ্ছে...</span>';

  try {
    if (!window.PMS_FB) {
      throw new Error('Firebase কনফিগারেশন লোড হয়নি।');
    }

    const result = await window.PMS_FB.signInWithGoogle();
    if (!result || !result.user) {
      throw new Error('গুগল লগইন সম্পন্ন করা যায়নি।');
    }

    const authUser = {
      uid: result.user.uid,
      displayName: result.user.displayName || 'Google Landlord',
      email: result.user.email || '',
      photoURL: result.user.photoURL || '',
      provider: 'google'
    };

    onLoginSuccess(authUser);
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    if (googleError) googleError.textContent = formatAuthError(err);
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

// ── Theme Switcher ───────────────────────────────────────────
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
initThemeToggle();

// ── Auth Success Handler ─────────────────────────────────────
function onLoginSuccess(user) {
  // Store authenticated session in localStorage for app.js
  localStorage.setItem('pms_user', JSON.stringify(user));

  toast(`লগইন সফল হয়েছে! স্বাগতম, ${user.displayName || user.email}`, 'success');

  // Smooth redirect to main dashboard
  setTimeout(() => {
    window.location.replace('index.html');
  }, 600);
}
