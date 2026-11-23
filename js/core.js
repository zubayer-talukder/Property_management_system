/* ============================================================
   Property Management System — Core Application (app.js)
   ============================================================ */

'use strict';

/* ── State ──────────────────────────────────────────────────── */
const STATE = {
  currentUser: null,      // { uid, phone }
  properties: [],         // Array<Property>
  activePropertyId: null,
  activeMonth: yyyymm(new Date())
};

/* ── Helpers ────────────────────────────────────────────────── */
function yyyymm(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  const lang = window.currentLang || (localStorage.getItem('pms_lang') || 'bn');
  if (lang === 'bn') {
    const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    const yStr = String(y).split('').map(d => bnDigits[d] || d).join('');
    return `${bnMonths[m - 1]} ${yStr}`;
  }
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return yyyymm(d);
}
function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return yyyymm(d);
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function tk(n) { return Number(n) || 0; }
function fmt(n) { return '৳' + tk(n).toLocaleString('en-IN'); }
function el(id) { return document.getElementById(id); }

/* ── Toast ──────────────────────────────────────────────────── */
function toast(msg, type = 'info', duration = 3500) {
  const icons = {
    success: '<i class="fa-solid fa-circle-check" style="color:var(--green)"></i>',
    error:   '<i class="fa-solid fa-circle-xmark" style="color:var(--red)"></i>',
    warn:    '<i class="fa-solid fa-triangle-exclamation" style="color:var(--amber)"></i>',
    info:    '<i class="fa-solid fa-circle-info" style="color:var(--cyan)"></i>'
  };
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  div.innerHTML = `<span>${icons[type] || icons.info}</span><span>${msg}</span>`;
  el('toast-container').appendChild(div);
  setTimeout(() => {
    div.classList.add('out');
    setTimeout(() => div.remove(), 350);
  }, duration);
}

/* ── Persist ────────────────────────────────────────────────── */
window._pmsClientId = 'client_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

function save() {
  if (!STATE.currentUser || !STATE.currentUser.uid) return;
  const userKey = 'pms_v2_' + STATE.currentUser.uid;
  const now = new Date().toISOString();
  localStorage.setItem(userKey, JSON.stringify({ properties: STATE.properties }));
  // Strictly user-scoped storage: never write to legacy shared 'pms_v2'
  localStorage.removeItem('pms_v2');
  localStorage.setItem('pms_updated_at_' + STATE.currentUser.uid, now);
  scheduleCloudSync();
}
function load() {
  try {
    const rawUser = localStorage.getItem('pms_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed && parsed.uid && parsed.uid !== 'owner-demo-1' && parsed.uid !== 'demo-google-landlord') {
        STATE.currentUser = parsed;
      } else {
        STATE.currentUser = null;
        localStorage.removeItem('pms_user');
      }
    } else {
      STATE.currentUser = null;
    }
  } catch (_) {
    STATE.currentUser = null;
  }

  if (!STATE.currentUser) {
    window.location.replace('login.html');
    return;
  }

  // Purge legacy shared key so another user's data cannot contaminate this session
  try { localStorage.removeItem('pms_v2'); } catch (_) {}

  try {
    const userKey = 'pms_v2_' + STATE.currentUser.uid;
    const raw = localStorage.getItem(userKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      STATE.properties = parsed.properties || [];
    } else {
      STATE.properties = [];
    }
  } catch (_) {
    STATE.properties = [];
  }
}

/* Cloud auto-sync (debounced, 500ms) — Real-time automatic saving to Firebase */
let _syncTimer = null;
function scheduleCloudSync(immediate = false) {
  if (!window.PMS_FB?.isEnabled || !STATE.currentUser) return;
  clearTimeout(_syncTimer);

  const setSyncingState = () => {
    const indicator = el('btn-backup');
    const textEl = el('btn-backup-text');
    if (indicator) indicator.classList.add('syncing');
    if (textEl) textEl.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> সেভ হচ্ছে...';
    if (el('backup-status-txt')) {
      el('backup-status-txt').innerHTML = '<span style="color:var(--amber)"><i class="fa-solid fa-rotate fa-spin"></i> সকল পরিবর্তন স্বয়ংক্রিয়ভাবে ক্লাউডে সেভ হচ্ছে...</span>';
    }
  };

  const executeSync = async () => {
    try {
      const ok = await window.PMS_FB.backupToCloud(STATE.currentUser.uid, { properties: STATE.properties });
      const indicator = el('btn-backup');
      const textEl = el('btn-backup-text');
      if (indicator) indicator.classList.remove('syncing');
      if (ok) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (textEl) textEl.innerHTML = '<i class="fa-solid fa-check"></i> সেভ সম্পন্ন';
        setTimeout(() => {
          if (textEl && !indicator?.classList.contains('syncing')) {
            textEl.innerHTML = '<i class="fa-solid fa-cloud"></i> অটো-সেভ সক্রিয়';
          }
        }, 1800);
        if (el('backup-status-txt')) {
          el('backup-status-txt').innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--green)"></i> <strong>স্বয়ংক্রিয় ক্লাউড সিঙ্ক:</strong> সকল তথ্য Firebase-এ সংরক্ষিত (${timeStr}) — কোনো বাটন চাপার প্রয়োজন নেই।`;
        }
      }
    } catch (e) {
      console.error('Cloud auto-sync failed:', e);
      const indicator = el('btn-backup');
      const textEl = el('btn-backup-text');
      if (indicator) indicator.classList.remove('syncing');
      if (textEl) textEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> সিঙ্ক ব্যর্থ';
      if (el('backup-status-txt')) {
        el('backup-status-txt').innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i> ক্লাউড সিঙ্ক ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
      }
    }
  };

  setSyncingState();
  if (immediate) {
    executeSync();
  } else {
    _syncTimer = setTimeout(executeSync, 500);
  }
}

// Ensure unsaved changes are flushed on tab close or navigation
window.addEventListener('beforeunload', () => {
  if (window.PMS_FB?.isEnabled && STATE.currentUser?.uid) {
    scheduleCloudSync(true);
  }
});

/* ── Auth ───────────────────────────────────────────────────── */
function isLoggedIn() { return !!STATE.currentUser; }

function setAuthUI(user) {
  STATE.currentUser = user;
  if (user) {
    try { localStorage.setItem('pms_user', JSON.stringify(user)); } catch (_) {}
    el('btn-login')?.classList.add('hidden');
    el('auth-badge')?.classList.remove('hidden');

    const displayTxt = user.displayName || user.email || user.phone || 'Owner';
    if (el('auth-phone-display')) el('auth-phone-display').textContent = displayTxt;

    const avatarEl = el('auth-user-avatar');
    if (avatarEl) {
      if (user.photoURL) {
        avatarEl.src = user.photoURL;
        avatarEl.classList.remove('hidden');
      } else {
        avatarEl.classList.add('hidden');
      }
    }

    el('btn-backup')?.classList.remove('hidden');
    el('btn-restore')?.classList.remove('hidden');
    renderPropertiesPage();
  } else {
    try { localStorage.removeItem('pms_user'); } catch (_) {}
    el('btn-login')?.classList.remove('hidden');
    el('auth-badge')?.classList.add('hidden');
    el('btn-backup')?.classList.add('hidden');
    el('btn-restore')?.classList.add('hidden');
  }
}

/* ── Direct Google Sign-In ─────────────────────────────────── */
window.triggerGoogleLogin = async function() {
  const btn = el('btn-login');
  const originalHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:5px"></span> <span>গুগলে লগইন হচ্ছে...</span>';
  }
  try {
    if (!window.PMS_FB) {
      window.location.href = 'login.html';
      return;
    }
    const result = await window.PMS_FB.signInWithGoogle();
    if (result?.user) {
      const authUser = {
        uid: result.user.uid,
        displayName: result.user.displayName || 'Google Owner',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
        provider: 'google'
      };
      setAuthUI(authUser);
      toast(`স্বাগতম, ${authUser.displayName || authUser.email}!`, 'success');
      load();
      renderPropertiesPage();
    }
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    if (err?.code !== 'auth/popup-closed-by-user') {
      toast('গুগল লগইন সম্পন্ন করা যায়নি। login.html থেকে চেষ্টা করুন।', 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }
};

el('btn-logout')?.addEventListener('click', async () => {
  if (!confirm('আপনি কি ওনার অ্যাকাউন্ট থেকে লগআউট করতে চান?')) return;
  try { if (window.PMS_FB?.logOut) await window.PMS_FB.logOut(); } catch (_) {}
  localStorage.removeItem('pms_user');
  localStorage.removeItem('pms_v2');
  STATE.currentUser = null;
  STATE.activePropertyId = null;
  STATE.properties = [];
  toast('লগআউট সম্পন্ন হয়েছে। লগইন পেজে নিয়ে যাওয়া হচ্ছে...', 'info');
  setTimeout(() => {
    window.location.replace('login.html');
  }, 400);
});

/* ── Modal Helpers ──────────────────────────────────────────── */
function openModal(id) { el(id).classList.add('open'); }
function closeModal(id) { el(id).classList.remove('open'); }

document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.closeModal || btn.closest('.modal-backdrop')?.id;
    if (target) closeModal(target);
  });
});
document.querySelectorAll('.modal-backdrop').forEach(bd => {
  bd.addEventListener('click', e => { if (e.target === bd) closeModal(bd.id); });
});

/* ── Page Navigation ────────────────────────────────────────── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = el(id);
  if (page) page.classList.add('active');
}

/* ── Tabs ───────────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.tabGroup;
    document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-tab-for="${group}"]`).forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    el(btn.dataset.tabTarget)?.classList.add('active');

    // Auto-sync electricity bill when switching back to Room & Billing tab
    if (btn.dataset.tabTarget === 'tab-rooms') {
      if (typeof window.elecAutoSyncBills === 'function') {
        window.elecAutoSyncBills(true);
      }
      const p = getActiveProperty();
      if (p) {
        renderMetrics(p);
        renderRoomsTable(p);
      }
    }
  });
});
