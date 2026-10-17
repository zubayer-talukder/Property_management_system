/**
 * ============================================================
 *  Property Management System — Google Authentication Controller
 * ============================================================
 */

'use strict';

function el(id) { return document.getElementById(id); }

function toast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  div.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
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

// ── Auth Success Handler ─────────────────────────────────────
function onLoginSuccess(user) {
  // Store authenticated session in localStorage for app.js
  localStorage.setItem('pms_user', JSON.stringify(user));

  toast(`লগইন সফল হয়েছে! স্বাগতম, ${user.displayName || user.email} 🎉`, 'success');

  // Smooth redirect to main dashboard
  setTimeout(() => {
    window.location.replace('index.html');
  }, 600);
}
