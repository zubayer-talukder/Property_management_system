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
  const [y, m] = ym.split('-').map(Number);
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
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  div.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  el('toast-container').appendChild(div);
  setTimeout(() => {
    div.classList.add('out');
    setTimeout(() => div.remove(), 350);
  }, duration);
}

/* ── Persist ────────────────────────────────────────────────── */
function save() {
  if (!STATE.currentUser || !STATE.currentUser.uid) return;
  const userKey = 'pms_v2_' + STATE.currentUser.uid;
  localStorage.setItem(userKey, JSON.stringify({ properties: STATE.properties }));
  localStorage.setItem('pms_v2', JSON.stringify({ properties: STATE.properties }));
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

  try {
    const userKey = 'pms_v2_' + STATE.currentUser.uid;
    const raw = localStorage.getItem(userKey) || localStorage.getItem('pms_v2');
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
    if (textEl) textEl.textContent = '🔄 সেভ হচ্ছে...';
    if (el('backup-status-txt')) {
      el('backup-status-txt').innerHTML = '<span style="color:var(--amber)">🔄 সকল পরিবর্তন স্বয়ংক্রিয়ভাবে ক্লাউডে সেভ হচ্ছে... ⏳</span>';
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
        if (textEl) textEl.textContent = '✓ সেভ সম্পন্ন';
        setTimeout(() => {
          if (textEl && !indicator?.classList.contains('syncing')) {
            textEl.textContent = '☁️ অটো-সেভ সক্রিয়';
          }
        }, 1800);
        if (el('backup-status-txt')) {
          el('backup-status-txt').innerHTML = `✓ <strong>স্বয়ংক্রিয় ক্লাউড সিঙ্ক:</strong> সকল তথ্য Firebase-এ সংরক্ষিত (${timeStr}) — কোনো বাটন চাপার প্রয়োজন নেই।`;
        }
      }
    } catch (e) {
      console.error('Cloud auto-sync failed:', e);
      const indicator = el('btn-backup');
      const textEl = el('btn-backup-text');
      if (indicator) indicator.classList.remove('syncing');
      if (textEl) textEl.textContent = '⚠️ সিঙ্ক ব্যর্থ';
      if (el('backup-status-txt')) {
        el('backup-status-txt').innerHTML = '⚠️ ক্লাউড সিঙ্ক ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
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
      toast(`স্বাগতম, ${authUser.displayName || authUser.email}! 🎉`, 'success');
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

/* ── Properties CRUD ────────────────────────────────────────── */
function getProperty(id) { return STATE.properties.find(p => p.id === id); }
function getActiveProperty() { return getProperty(STATE.activePropertyId); }

el('btn-add-property').addEventListener('click', () => {
  if (!isLoggedIn()) { triggerGoogleLogin(); return; }
  resetPropertyForm();
  openModal('modal-property');
});

el('form-property').addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const isMulti = el('chk-multi-owner').checked;
  const ownersRaw = el('prop-owners-input').value.trim();
  const owners = isMulti
    ? ownersRaw.split('\n').map(s => s.trim()).filter(Boolean)
    : [STATE.currentUser.displayName || STATE.currentUser.email || 'মালিক'];

  const roomCount = tk(fd.get('roomCount'));
  const existingProp = el('form-property').dataset.editId;

  if (existingProp) {
    const prop = getProperty(existingProp);
    prop.name = fd.get('name');
    prop.address = fd.get('address');
    prop.owners = owners;
    // don't change rooms if editing
    toast('প্রপার্টি আপডেট হয়েছে।', 'success');
  } else {
    const prop = {
      id: uid(),
      name: fd.get('name'),
      address: fd.get('address'),
      owners,
      rooms: []
    };
    for (let i = 1; i <= roomCount; i++) {
      prop.rooms.push(makeRoom(prop.id, String(i)));
    }
    STATE.properties.push(prop);
    toast('প্রপার্টি যুক্ত হয়েছে! 🏠', 'success');
  }
  save();
  closeModal('modal-property');
  renderPropertiesPage();
});

function makeRoom(propId, num) {
  return {
    id: uid(),
    propId,
    number: num,
    baseRent: 0,
    waterBill: 0,
    gasBill: 0,
    wifiBill: 0,
    otherBill: 0,
    tenant: null,
    bills: {}      // key: 'YYYY-MM' → BillRecord
  };
}

function resetPropertyForm() {
  el('form-property').reset();
  el('form-property').dataset.editId = '';
  el('modal-property-title').textContent = '🏠 নতুন প্রপার্টি যুক্ত করুন';
  el('multi-owners-group').classList.add('hidden');
  el('chk-multi-owner').checked = false;
}

el('chk-multi-owner').addEventListener('change', () => {
  el('multi-owners-group').classList.toggle('hidden', !el('chk-multi-owner').checked);
});

function renderPropertiesPage() {
  const grid = el('properties-grid');
  if (!STATE.properties.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="es-icon">🏘️</div>
      <h3>কোনো প্রপার্টি নেই</h3>
      <p>${isLoggedIn() ? '"নতুন প্রপার্টি যুক্ত করুন" বাটনে ক্লিক করুন।' : 'প্রপার্টি দেখতে প্রথমে লগইন করুন।'}</p>
    </div>`;
    return;
  }
  grid.innerHTML = STATE.properties.map(p => {
    const m = STATE.activeMonth;
    const bills = p.rooms.map(r => r.bills[m] || {});
    const paid = bills.filter(b => b.tenant && b.due <= 0 && b.total > 0).length;
    const due  = bills.filter(b => b.due > 0).length;
    const vacant = p.rooms.filter(r => !r.tenant).length;
    return `<div class="property-card" onclick="openPropertyDetail('${p.id}')">
      <div class="property-card-header">
        <div>
          <div class="prop-name">🏢 ${p.name}</div>
          <div class="prop-addr">📍 ${p.address}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.35rem">
            ${p.owners.length > 1 ? '👥 ' + p.owners.join(', ') : '👤 ' + p.owners[0]}
          </div>
        </div>
        <div style="display:flex;gap:0.4rem;flex-shrink:0">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="event.stopPropagation();editProperty('${p.id}')" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();deleteProperty('${p.id}')" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="property-card-body">
        <div class="property-mini-stats">
          <div class="pms"><div class="pms-val">${p.rooms.length}</div><div class="pms-lbl">মোট রুম</div></div>
          <div class="pms green"><div class="pms-val">${paid}</div><div class="pms-lbl">পরিশোধিত</div></div>
          <div class="pms amber"><div class="pms-val">${due}</div><div class="pms-lbl">বকেয়া</div></div>
          <div class="pms cyan"><div class="pms-val">${vacant}</div><div class="pms-lbl">খালি</div></div>
        </div>
        <div class="property-card-actions">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openPropertyDetail('${p.id}')">📋 বিস্তারিত দেখুন</button>
          ${p.owners.length > 1 ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openOwnerSplit('${p.id}')">👥 Split দেখুন</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

window.editProperty = function(id) {
  const p = getProperty(id);
  el('prop-name').value = p.name;
  el('prop-address').value = p.address;
  el('prop-room-count').value = p.rooms.length;
  el('prop-room-count').disabled = true;
  el('form-property').dataset.editId = id;
  el('modal-property-title').textContent = '✏️ প্রপার্টি আপডেট করুন';
  if (p.owners.length > 1) {
    el('chk-multi-owner').checked = true;
    el('multi-owners-group').classList.remove('hidden');
    el('prop-owners-input').value = p.owners.join('\n');
  }
  openModal('modal-property');
};

window.deleteProperty = function(id) {
  if (!confirm('এই প্রপার্টি এবং সকল ডাটা মুছে ফেলতে চান?')) return;
  STATE.properties = STATE.properties.filter(p => p.id !== id);
  save(); renderPropertiesPage();
  toast('প্রপার্টি মুছে ফেলা হয়েছে।', 'warn');
};

/* ── Property Detail View ───────────────────────────────────── */
window.openPropertyDetail = function(id) {
  STATE.activePropertyId = id;
  renderDetailPage();
  showPage('page-detail');
};

el('btn-back-to-props').addEventListener('click', () => {
  STATE.activePropertyId = null;
  showPage('page-properties');
  renderPropertiesPage();
});

el('btn-prev-month').addEventListener('click', () => {
  STATE.activeMonth = prevMonth(STATE.activeMonth);
  renderDetailPage();
});
el('btn-next-month').addEventListener('click', () => {
  STATE.activeMonth = nextMonth(STATE.activeMonth);
  renderDetailPage();
});

function renderDetailPage() {
  const p = getActiveProperty(); if (!p) return;
  if (typeof window.elecAutoSyncBills === 'function') {
    window.elecAutoSyncBills(true);
  }
  el('detail-prop-name').textContent = p.name;
  el('detail-prop-addr').textContent = p.address;
  el('detail-month-label').textContent = monthLabel(STATE.activeMonth);
  renderMetrics(p);
  renderRoomsTable(p);
  updateBackupStatus();
}

function renderMetrics(p) {
  const m = STATE.activeMonth;
  let paid = 0, dueCount = 0, dueAmt = 0, vacant = 0, totalExpected = 0;

  p.rooms.forEach(r => {
    if (!r.tenant) { vacant++; return; }
    const b = r.bills[m] || {};
    const total = tk(b.total);
    const due   = tk(b.due);
    totalExpected += total;
    if (due <= 0 && total > 0) paid++;
    else if (due > 0) { dueCount++; dueAmt += due; }
  });

  el('mc-total-rooms').textContent   = p.rooms.length;
  el('mc-paid-rooms').textContent    = paid;
  el('mc-due-rooms').textContent     = dueCount;
  el('mc-due-amount').textContent    = fmt(dueAmt);
  el('mc-vacant-rooms').textContent  = vacant;
  el('mc-expected-rent').textContent = fmt(totalExpected);
}

function renderRoomsTable(p) {
  const m = STATE.activeMonth;
  const tbody = el('rooms-tbody');
  if (!p.rooms.length) {
    tbody.innerHTML = `<tr><td colspan="13" class="text-center" style="padding:2rem;color:var(--text-muted)">কোনো রুম নেই। "রুম যুক্ত করুন" বাটনে ক্লিক করুন।</td></tr>`;
    return;
  }
  tbody.innerHTML = p.rooms.map(r => {
    const b = getBill(r, m);
    const isVacant = !r.tenant;
    const statusPill = isVacant
      ? `<span class="pill pill-vacant">খালি</span>`
      : b.due <= 0 && b.total > 0
        ? `<span class="pill pill-paid">✓ পরিশোধ</span>`
        : b.due > 0 && b.paid > 0
          ? `<span class="pill pill-partial">আংশিক</span>`
          : `<span class="pill pill-due">বকেয়া</span>`;

    return `<tr data-room-id="${r.id}">
      <td class="room-num">
        <span>${r.number}</span>
      </td>
      <td>
        ${isVacant
          ? `<button class="btn btn-success btn-sm" onclick="openTenantModal('${r.id}','add')">+ ভাড়াটিয়া</button>`
          : `<div class="tenant-cell-content">
              ${r.tenant.photo
                ? `<img src="${r.tenant.photo}" class="tenant-table-avatar" alt="${r.tenant.name}">`
                : `<div class="tenant-table-avatar" style="display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,0.15);font-size:0.85rem">👤</div>`
              }
              <div>
                <div class="tenant-name">${r.tenant.name}</div>
                <div style="font-size:0.7rem;color:var(--text-muted)">${r.tenant.phone}</div>
              </div>
            </div>`}
      </td>
      <td class="amount total">
        ${isVacant ? '-' : fmt(b.total)}
        ${!isVacant && tk(b.electricity) > 0 ? `<div style="font-size:0.72rem;color:var(--amber);font-weight:600" title="বিদ্যুৎ বিল">⚡ ${fmt(b.electricity)}</div>` : ''}
      </td>
      <td class="amount paid">${isVacant ? '-' : fmt(b.paid)}</td>
      <td class="amount due">${isVacant ? '-' : fmt(b.due)}</td>
      <td>${statusPill}</td>
      <td>${b.paidDate ? `<span style="font-size:0.75rem">${b.paidDate}</span>` : '-'}</td>
      <td>
        <div style="display:flex;gap:0.35rem;flex-wrap:wrap">
          <button class="btn btn-warning btn-sm" onclick="openRoomModal('${r.id}')">⚙️ রুম</button>
          ${!isVacant ? `<button class="btn btn-secondary btn-sm" onclick="openBillModal('${r.id}')">💰 বিল</button>` : ''}
          ${!isVacant ? `<button class="btn btn-secondary btn-sm" onclick="openTenantModal('${r.id}','view')">👤 KYC</button>` : ''}
          ${!isVacant ? `<button class="btn btn-primary btn-sm" onclick="openReceiptModal('${r.id}')" title="মানি রিসিট">🧾 রিসিট</button>` : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteRoom('${r.id}')" title="Delete Room">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── Bill helpers ───────────────────────────────────────────── */
function getBill(room, month) {
  if (!room.bills[month]) {
    room.bills[month] = makeBill(room, month);
    save();
  }
  return room.bills[month];
}

function makeBill(room, month) {
  // Try to copy from previous month
  const prev = room.bills[prevMonth(month)];
  if (prev) {
    return {
      month,
      tenant: room.tenant?.name || '',
      rent: tk(prev.rent),
      electricity: 0,
      water: tk(prev.water),
      gas: tk(prev.gas),
      wifi: tk(prev.wifi),
      other: tk(prev.other),
      total: 0,
      paid: 0,
      due: 0,
      paidDate: '',
      comment: ''
    };
  }
  return {
    month,
    tenant: room.tenant?.name || '',
    rent: tk(room.baseRent),
    electricity: 0,
    water: tk(room.waterBill),
    gas: tk(room.gasBill),
    wifi: tk(room.wifiBill),
    other: tk(room.otherBill),
    total: 0,
    paid: 0,
    due: 0,
    paidDate: '',
    comment: ''
  };
}

function recalcBill(b) {
  b.total = tk(b.rent) + tk(b.electricity) + tk(b.water) + tk(b.gas) + tk(b.wifi) + tk(b.other);
  b.due   = Math.max(0, b.total - tk(b.paid));
  return b;
}

/* Auto-generate bills for all rooms in active month */
el('btn-auto-generate').addEventListener('click', () => {
  const p = getActiveProperty(); if (!p) return;
  const m = STATE.activeMonth;
  p.rooms.forEach(r => { if (r.tenant) { getBill(r, m); } });
  if (typeof window.elecAutoSyncBills === 'function') {
    window.elecAutoSyncBills(true);
  }
  save(); renderDetailPage();
  toast(`${monthLabel(m)} এর বিল তৈরি হয়েছে। ✅`, 'success');
});

/* ── Add Room ───────────────────────────────────────────────── */
el('btn-add-room').addEventListener('click', () => {
  if (!isLoggedIn()) { triggerGoogleLogin(); return; }
  const p = getActiveProperty(); if (!p) return;
  el('room-modal-title').textContent = '🚪 নতুন রুম যুক্ত করুন';
  el('form-room').reset();
  el('form-room').dataset.roomId = '';
  openModal('modal-room');
});

el('form-room').addEventListener('submit', e => {
  e.preventDefault();
  const p = getActiveProperty(); if (!p) return;
  const fd = new FormData(e.target);
  const rid = e.target.dataset.roomId;

  if (rid) {
    const room = p.rooms.find(r => r.id === rid);
    room.number   = fd.get('roomNumber');
    room.baseRent = tk(fd.get('baseRent'));
    room.waterBill= tk(fd.get('waterBill'));
    room.gasBill  = tk(fd.get('gasBill'));
    room.wifiBill = tk(fd.get('wifiBill'));
    room.otherBill= tk(fd.get('otherBill'));
    // Also update current month bill base values
    const b = room.bills[STATE.activeMonth];
    if (b) {
      b.rent  = room.baseRent;
      b.water = room.waterBill;
      b.gas   = room.gasBill;
      b.wifi  = room.wifiBill;
      b.other = room.otherBill;
      recalcBill(b);
    }
    toast('রুম আপডেট হয়েছে।', 'success');
  } else {
    const room = makeRoom(p.id, fd.get('roomNumber'));
    room.baseRent = tk(fd.get('baseRent'));
    room.waterBill= tk(fd.get('waterBill'));
    room.gasBill  = tk(fd.get('gasBill'));
    room.wifiBill = tk(fd.get('wifiBill'));
    room.otherBill= tk(fd.get('otherBill'));
    p.rooms.push(room);
    toast('রুম যুক্ত হয়েছে! 🚪', 'success');
  }
  save(); closeModal('modal-room'); renderDetailPage();
});

window.openRoomModal = function(rid) {
  const p = getActiveProperty(); if (!p) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  el('room-modal-title').textContent = '✏️ রুম আপডেট করুন';
  el('form-room').dataset.roomId = rid;
  el('room-number').value   = room.number;
  el('room-base-rent').value= room.baseRent;
  el('room-water').value    = room.waterBill;
  el('room-gas').value      = room.gasBill;
  el('room-wifi').value     = room.wifiBill;
  el('room-other').value    = room.otherBill;
  openModal('modal-room');
};

window.deleteRoom = function(rid) {
  if (!confirm('এই রুম মুছে ফেলবেন?')) return;
  const p = getActiveProperty(); if (!p) return;
  p.rooms = p.rooms.filter(r => r.id !== rid);
  save(); renderDetailPage();
  toast('রুম মুছে ফেলা হয়েছে।', 'warn');
};

/* ── Bill Modal ─────────────────────────────────────────────── */
window.openBillModal = function(rid) {
  const p = getActiveProperty(); if (!p) return;
  if (typeof window.elecAutoSyncBills === 'function') {
    window.elecAutoSyncBills(true);
  }
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);
  el('bill-room-label').textContent = `রুম ${room.number} — ${monthLabel(STATE.activeMonth)}`;
  el('bill-rent').value       = b.rent;
  el('bill-electricity').value= b.electricity;
  el('bill-water').value      = b.water;
  el('bill-gas').value        = b.gas;
  el('bill-wifi').value       = b.wifi;
  el('bill-other').value      = b.other;
  el('bill-paid').value       = b.paid;
  el('bill-paid-date').value  = b.paidDate;
  el('bill-comment').value    = b.comment;
  el('form-bill').dataset.roomId = rid;
  updateBillTotalsUI(b);
  openModal('modal-bill');
};

function updateBillTotalsUI(b) {
  const total = tk(b.rent)+tk(b.electricity)+tk(b.water)+tk(b.gas)+tk(b.wifi)+tk(b.other);
  const due   = Math.max(0, total - tk(b.paid));
  el('bill-total-display').textContent = fmt(total);
  el('bill-due-display').textContent   = fmt(due);
  el('bill-due-display').style.color   = due > 0 ? 'var(--red)' : 'var(--green)';
}

['bill-rent','bill-electricity','bill-water','bill-gas','bill-wifi','bill-other','bill-paid'].forEach(id => {
  el(id).addEventListener('input', () => {
    const b = {
      rent: tk(el('bill-rent').value), electricity: tk(el('bill-electricity').value),
      water: tk(el('bill-water').value), gas: tk(el('bill-gas').value),
      wifi: tk(el('bill-wifi').value), other: tk(el('bill-other').value),
      paid: tk(el('bill-paid').value)
    };
    updateBillTotalsUI(b);
  });
});

el('form-bill').addEventListener('submit', e => {
  e.preventDefault();
  const p = getActiveProperty(); if (!p) return;
  const rid = e.target.dataset.roomId;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);
  b.rent        = tk(el('bill-rent').value);
  b.electricity = tk(el('bill-electricity').value);
  b.water       = tk(el('bill-water').value);
  b.gas         = tk(el('bill-gas').value);
  b.wifi        = tk(el('bill-wifi').value);
  b.other       = tk(el('bill-other').value);
  b.paid        = tk(el('bill-paid').value);
  b.paidDate    = el('bill-paid-date').value;
  b.comment     = el('bill-comment').value;
  recalcBill(b);
  save(); closeModal('modal-bill'); renderDetailPage();
  toast('বিল আপডেট হয়েছে! 💰', 'success');
});

/* ── WhatsApp Sharing & Money Receipt ───────────────────────── */
function shareBillWhatsApp(room, bill, prop) {
  if (!room.tenant?.phone) { toast('ভাড়াটিয়ার ফোন নম্বর নেই।', 'warn'); return; }
  const cleanPhone = room.tenant.phone.replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? '88' + cleanPhone : '880' + cleanPhone;
  const msg = `*বাড়ি ভাড়া ও ইউটিলিটি বিল — ${monthLabel(bill.month)}*
🏢 *${prop.name}* (রুম নং: *${room.number}*)
👤 ভাড়াটিয়া: *${room.tenant.name}*
--------------------------------
• মূল ভাড়া: ৳${tk(bill.rent).toLocaleString('en-IN')}
• বিদ্যুৎ বিল: ৳${tk(bill.electricity).toLocaleString('en-IN')}
• পানির বিল: ৳${tk(bill.water).toLocaleString('en-IN')}
• গ্যাস বিল: ৳${tk(bill.gas).toLocaleString('en-IN')}
• ওয়াইফাই: ৳${tk(bill.wifi).toLocaleString('en-IN')}
${bill.other > 0 ? `• অন্যান্য চার্জ: ৳${tk(bill.other).toLocaleString('en-IN')}\n` : ''}--------------------------------
*মোট বিল: ৳${tk(bill.total).toLocaleString('en-IN')}*
পরিশোধিত: ৳${tk(bill.paid).toLocaleString('en-IN')}
*বকেয়া: ৳${tk(bill.due).toLocaleString('en-IN')}*
${bill.comment ? `নোট: ${bill.comment}\n` : ''}--------------------------------
পরিশোধের জন্য যোগাযোগ করুন। ধন্যবাদ!`;
  const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

window.openReceiptModal = function(rid) {
  const p = getActiveProperty(); if (!p) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);

  el('receipt-prop-name').textContent = p.name;
  el('receipt-prop-addr').textContent = p.address;
  el('receipt-month-display').textContent = monthLabel(STATE.activeMonth);

  el('receipt-tenant-name').textContent = room.tenant?.name || '—';
  el('receipt-tenant-phone').textContent = room.tenant?.phone || '—';
  el('receipt-room-no').textContent = room.number;
  el('receipt-date').textContent = b.paidDate || new Date().toISOString().split('T')[0];

  const pill = el('receipt-status-pill');
  if (b.due <= 0 && b.total > 0) {
    pill.className = 'pill pill-paid'; pill.textContent = '✓ পরিশোধিত (PAID)';
  } else if (b.paid > 0 && b.due > 0) {
    pill.className = 'pill pill-partial'; pill.textContent = 'আংশিক পরিশোধ';
  } else {
    pill.className = 'pill pill-due'; pill.textContent = 'বকেয়া (DUE)';
  }

  const items = [
    { name: 'মূল বাড়ি ভাড়া (Base Rent)', amt: b.rent },
    { name: 'বিদ্যুৎ বিল (Electricity Sub-Meter)', amt: b.electricity },
    { name: 'পানির বিল (Water Charge)', amt: b.water },
    { name: 'গ্যাস বিল (Gas Charge)', amt: b.gas },
    { name: 'ওয়াইফাই বিল (Internet)', amt: b.wifi },
    { name: 'অন্যান্য সার্ভিস চার্জ', amt: b.other }
  ].filter(item => item.amt > 0);

  el('receipt-breakdown-tbody').innerHTML = items.map(item => `
    <tr>
      <td style="text-align:left">${item.name}</td>
      <td style="text-align:right">${fmt(item.amt)}</td>
    </tr>
  `).join('');

  el('receipt-total-amt').textContent = fmt(b.total);
  el('receipt-paid-amt').textContent = fmt(b.paid);
  el('receipt-due-amt').textContent = fmt(b.due);
  el('receipt-due-row').style.display = b.due > 0 ? '' : 'none';
  el('receipt-comment').textContent = b.comment || 'কোনো মন্তব্য নেই';

  el('receipt-btn-whatsapp').onclick = () => shareBillWhatsApp(room, b, p);
  openModal('modal-receipt');
};

el('btn-print-receipt')?.addEventListener('click', () => {
  const rid = el('form-bill').dataset.roomId;
  if (!rid) return;
  openReceiptModal(rid);
});

el('btn-whatsapp-bill')?.addEventListener('click', () => {
  const p = getActiveProperty(); if (!p) return;
  const rid = el('form-bill').dataset.roomId;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);
  shareBillWhatsApp(room, b, p);
});

/* ── Tenant KYC Modal & Firebase Storage ───────────────────── */
async function compressImageFile(file, maxDimension = 900, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({ blob: blob || file, dataUrl });
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve({ blob: file, dataUrl: e.target.result });
      img.src = e.target.result;
    };
    reader.onerror = () => resolve({ blob: file, dataUrl: '' });
    reader.readAsDataURL(file);
  });
}

let _tempTenantPhotoBlob = null;
let _tempTenantPhotoDataUrl = null;
let _photoCompressPromise = null;

let _tempTenantNidBlob = null;
let _tempTenantNidDataUrl = null;
let _nidCompressPromise = null;

let _photoAction = 'keep'; // 'keep' | 'new' | 'remove'
let _nidAction = 'keep';   // 'keep' | 'new' | 'remove'

window.triggerFileInput = function(id) {
  const input = el(id);
  if (input) {
    input.value = '';
    input.click();
  }
};

window.handleTenantImageSelected = async function(input, type) {
  const file = input.files && input.files[0];
  if (!file) return;

  const isPhoto = type === 'photo';
  if (isPhoto) _photoAction = 'new';
  else _nidAction = 'new';

  const previewImg = el(isPhoto ? 'tenant-photo-preview' : 'tenant-nid-preview');
  const zoneEl = el(isPhoto ? 'zone-tenant-photo' : 'zone-tenant-nid');
  const cardEl = el(isPhoto ? 'card-tenant-photo' : 'card-tenant-nid');
  const badgeEl = el(isPhoto ? 'badge-photo-status' : 'badge-nid-status');
  const nameEl = el(isPhoto ? 'label-photo-name' : 'label-nid-name');
  const sizeEl = el(isPhoto ? 'label-photo-size' : 'label-nid-size');

  // 1. Instant preview via Object URL
  try {
    const objectUrl = URL.createObjectURL(file);
    if (previewImg) previewImg.src = objectUrl;
  } catch (_) {}

  // 2. Immediate UI visual change
  if (zoneEl) zoneEl.classList.add('hidden');
  if (cardEl) cardEl.classList.remove('hidden');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = `আকার: ${(file.size / 1024).toFixed(0)} KB (প্রসেসিং... ⏳)`;
  if (badgeEl) {
    badgeEl.className = 'img-status-badge selected';
    badgeEl.textContent = '⏳ প্রসেসিং হচ্ছে...';
  }

  // 3. Keep raw file immediately available
  if (isPhoto) {
    _tempTenantPhotoBlob = file;
  } else {
    _tempTenantNidBlob = file;
  }

  // 4. Optimized compression with tracked Promise
  // Passport photo: 400x400 max, quality 0.75 (~20-30 KB)
  // NID: 800x800 max, quality 0.65 (~40-60 KB)
  const maxDim = isPhoto ? 400 : 800;
  const quality = isPhoto ? 0.75 : 0.65;
  const p = compressImageFile(file, maxDim, quality);
  if (isPhoto) _photoCompressPromise = p;
  else _nidCompressPromise = p;

  try {
    const { blob, dataUrl } = await p;
    if (isPhoto) {
      _tempTenantPhotoBlob = blob;
      _tempTenantPhotoDataUrl = dataUrl;
    } else {
      _tempTenantNidBlob = blob;
      _tempTenantNidDataUrl = dataUrl;
    }
    if (previewImg) previewImg.src = dataUrl;
    if (sizeEl) sizeEl.textContent = `আকার: ${(blob.size / 1024).toFixed(0)} KB (অপটিমাইজড ⚡)`;
    if (badgeEl) {
      badgeEl.className = 'img-status-badge saved';
      badgeEl.textContent = '✓ সংরক্ষণ করতে প্রস্তুত';
    }
  } catch (err) {
    console.warn("Compression warning:", err);
    const reader = new FileReader();
    reader.onload = e => {
      if (isPhoto) _tempTenantPhotoDataUrl = e.target.result;
      else _tempTenantNidDataUrl = e.target.result;
    };
    reader.readAsDataURL(file);
    if (sizeEl) sizeEl.textContent = `আকার: ${(file.size / 1024).toFixed(0)} KB`;
    if (badgeEl) {
      badgeEl.className = 'img-status-badge selected';
      badgeEl.textContent = '✓ প্রস্তুত';
    }
  }
};

window.removeTenantImage = function(type) {
  const isPhoto = type === 'photo';
  if (isPhoto) {
    _photoAction = 'remove';
    _photoCompressPromise = null;
    _tempTenantPhotoBlob = null;
    _tempTenantPhotoDataUrl = null;
  } else {
    _nidAction = 'remove';
    _nidCompressPromise = null;
    _tempTenantNidBlob = null;
    _tempTenantNidDataUrl = null;
  }

  const input = el(isPhoto ? 'tenant-photo-input' : 'tenant-nid-input');
  const previewImg = el(isPhoto ? 'tenant-photo-preview' : 'tenant-nid-preview');
  const zoneEl = el(isPhoto ? 'zone-tenant-photo' : 'zone-tenant-nid');
  const cardEl = el(isPhoto ? 'card-tenant-photo' : 'card-tenant-nid');
  const badgeEl = el(isPhoto ? 'badge-photo-status' : 'badge-nid-status');

  if (input) input.value = '';
  if (previewImg) previewImg.src = '';
  if (zoneEl) zoneEl.classList.remove('hidden');
  if (cardEl) cardEl.classList.add('hidden');
  if (badgeEl) {
    badgeEl.className = 'img-status-badge';
    badgeEl.textContent = 'কোনো ছবি নেই';
  }
};

window.openTenantModal = function(rid, mode) {
  const p = getActiveProperty(); if (!p) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  el('form-tenant').reset();
  el('form-tenant').dataset.roomId = rid;

  // Reset actions to keep existing images
  _photoAction = 'keep';
  _nidAction = 'keep';
  _tempTenantPhotoBlob = null;
  _tempTenantPhotoDataUrl = null;
  _tempTenantNidBlob = null;
  _tempTenantNidDataUrl = null;

  // Reset visual elements to clean state
  ['photo', 'nid'].forEach(type => {
    const isPhoto = type === 'photo';
    const input = el(isPhoto ? 'tenant-photo-input' : 'tenant-nid-input');
    const previewImg = el(isPhoto ? 'tenant-photo-preview' : 'tenant-nid-preview');
    const zoneEl = el(isPhoto ? 'zone-tenant-photo' : 'zone-tenant-nid');
    const cardEl = el(isPhoto ? 'card-tenant-photo' : 'card-tenant-nid');
    const badgeEl = el(isPhoto ? 'badge-photo-status' : 'badge-nid-status');
    if (input) input.value = '';
    if (previewImg) previewImg.src = '';
    if (zoneEl) zoneEl.classList.remove('hidden');
    if (cardEl) cardEl.classList.add('hidden');
    if (badgeEl) {
      badgeEl.className = 'img-status-badge';
      badgeEl.textContent = 'কোনো ছবি নেই';
    }
  });

  const showSavedImg = (type, src) => {
    if (!src) return;
    const isPhoto = type === 'photo';
    const prev = el(isPhoto ? 'tenant-photo-preview' : 'tenant-nid-preview');
    if (prev) prev.src = src;
    el(isPhoto ? 'zone-tenant-photo' : 'zone-tenant-nid')?.classList.add('hidden');
    el(isPhoto ? 'card-tenant-photo' : 'card-tenant-nid')?.classList.remove('hidden');
    if (el(isPhoto ? 'label-photo-name' : 'label-nid-name')) {
      el(isPhoto ? 'label-photo-name' : 'label-nid-name').textContent = isPhoto ? 'সংরক্ষিত ছবি' : 'সংরক্ষিত NID কার্ড';
    }
    if (el(isPhoto ? 'label-photo-size' : 'label-nid-size')) {
      el(isPhoto ? 'label-photo-size' : 'label-nid-size').textContent = src.startsWith('http') ? 'Firebase Storage ☁️' : 'Firestore Cloud 💾';
    }
    const b = el(isPhoto ? 'badge-photo-status' : 'badge-nid-status');
    if (b) {
      b.className = 'img-status-badge saved';
      b.textContent = '✓ সংরক্ষিত';
    }
  };

  if (mode === 'view' && room.tenant) {
    const t = room.tenant;
    el('tenant-name').value            = t.name || '';
    el('tenant-phone').value           = t.phone || '';
    el('tenant-spouse').value          = t.spouseName || '';
    el('tenant-kids-count').value      = t.kidsCount || '';
    el('tenant-kids-names').value      = t.kidsNames || '';
    el('tenant-perm-address').value    = t.permanentAddress || '';
    el('tenant-nid-num').value         = t.nidNumber || '';
    el('tenant-emg-name').value        = t.emergencyName || '';
    el('tenant-emg-phone').value       = t.emergencyPhone || '';
    el('tenant-emg-rel').value         = t.emergencyRelation || '';
    el('tenant-deposit').value         = t.deposit || '';
    el('tenant-lease-start').value     = t.leaseStart || '';

    // Load Photo
    if (t.photo) showSavedImg('photo', t.photo);

    // Load NID
    if (t.nidImage) showSavedImg('nid', t.nidImage);

    // Check Firestore KYC in case image is synced there
    if (window.PMS_FB?.getTenantKYC && STATE.currentUser?.uid && (!t.photo || !t.nidImage)) {
      window.PMS_FB.getTenantKYC(STATE.currentUser.uid, rid).then(kyc => {
        if (!kyc) return;
        if (kyc.photo && !t.photo && _photoAction === 'keep') {
          t.photo = kyc.photo;
          showSavedImg('photo', kyc.photo);
        }
        if (kyc.nidImage && !t.nidImage && _nidAction === 'keep') {
          t.nidImage = kyc.nidImage;
          showSavedImg('nid', kyc.nidImage);
        }
      }).catch(() => {});
    }

    el('tenant-modal-title').textContent = `👤 ${t.name} — KYC তথ্য`;
    el('btn-evict').classList.remove('hidden');
  } else {
    el('tenant-modal-title').textContent = '➕ নতুন ভাড়াটিয়া যুক্ত করুন';
    el('btn-evict').classList.add('hidden');
    el('tenant-lease-start').value = new Date().toISOString().split('T')[0];
  }
  // Reset tabs
  document.querySelector('[data-tab-group="tenant-tabs"][data-tab-target="tenant-tab-personal"]')?.click();
  openModal('modal-tenant');
};

el('btn-evict').addEventListener('click', async () => {
  const rid = el('form-tenant').dataset.roomId;
  if (!confirm('এই ভাড়াটিয়াকে উচ্ছেদ করবেন? সব KYC ডাটা মুছে যাবে।')) return;
  const p = getActiveProperty(); if (!p) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;

  // Delete from Firestore KYC collection
  if (window.PMS_FB?.deleteTenantKYC && STATE.currentUser?.uid) {
    try {
      await window.PMS_FB.deleteTenantKYC(STATE.currentUser.uid, rid);
    } catch (_) {}
  }

  room.tenant = null;
  save(); closeModal('modal-tenant'); renderDetailPage();
  toast('ভাড়াটিয়া উচ্ছেদ হয়েছে ও Firebase থেকে KYC মুছে ফেলা হয়েছে।', 'warn');
});

el('form-tenant').addEventListener('submit', async e => {
  e.preventDefault();
  const p = getActiveProperty(); if (!p) return;
  const rid = e.target.dataset.roomId;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:5px"></span> Firebase-এ সংরক্ষণ হচ্ছে...';
  }

  try {
    const ownerUID = STATE.currentUser?.uid;
    let finalPhotoUrl = (room.tenant && room.tenant.photo) ? room.tenant.photo : '';
    let finalNidUrl   = (room.tenant && room.tenant.nidImage) ? room.tenant.nidImage : '';

    // Await photo compression if in progress
    if (_photoAction === 'new' && _photoCompressPromise) {
      try {
        const pRes = await _photoCompressPromise;
        if (pRes) {
          _tempTenantPhotoBlob = pRes.blob || _tempTenantPhotoBlob;
          _tempTenantPhotoDataUrl = pRes.dataUrl || _tempTenantPhotoDataUrl;
        }
      } catch (_) {}
    }

    // Await NID compression if in progress
    if (_nidAction === 'new' && _nidCompressPromise) {
      try {
        const nRes = await _nidCompressPromise;
        if (nRes) {
          _tempTenantNidBlob = nRes.blob || _tempTenantNidBlob;
          _tempTenantNidDataUrl = nRes.dataUrl || _tempTenantNidDataUrl;
        }
      } catch (_) {}
    }

    // Handle photo state
    if (_photoAction === 'remove') {
      finalPhotoUrl = '';
    } else if (_photoAction === 'new') {
      let cloudUrl = null;
      if (_tempTenantPhotoBlob && window.PMS_FB?.uploadFile && ownerUID) {
        const path = `owners/${ownerUID}/tenants/${rid}_photo_${Date.now()}.jpg`;
        cloudUrl = await window.PMS_FB.uploadFile(path, _tempTenantPhotoBlob);
      }
      finalPhotoUrl = cloudUrl || _tempTenantPhotoDataUrl || '';

      // Direct fallback to raw blob if needed
      if (!finalPhotoUrl && _tempTenantPhotoBlob) {
        finalPhotoUrl = await new Promise(r => {
          const reader = new FileReader();
          reader.onload = ev => r(ev.target.result || '');
          reader.onerror = () => r('');
          reader.readAsDataURL(_tempTenantPhotoBlob);
        });
      }
    }

    // Handle NID state
    if (_nidAction === 'remove') {
      finalNidUrl = '';
    } else if (_nidAction === 'new') {
      let cloudUrl = null;
      if (_tempTenantNidBlob && window.PMS_FB?.uploadFile && ownerUID) {
        const path = `owners/${ownerUID}/tenants/${rid}_nid_${Date.now()}.jpg`;
        cloudUrl = await window.PMS_FB.uploadFile(path, _tempTenantNidBlob);
      }
      finalNidUrl = cloudUrl || _tempTenantNidDataUrl || '';

      if (!finalNidUrl && _tempTenantNidBlob) {
        finalNidUrl = await new Promise(r => {
          const reader = new FileReader();
          reader.onload = ev => r(ev.target.result || '');
          reader.onerror = () => r('');
          reader.readAsDataURL(_tempTenantNidBlob);
        });
      }
    }

    const tenant = {
      name:              el('tenant-name').value.trim(),
      phone:             el('tenant-phone').value.trim(),
      photo:             finalPhotoUrl,
      spouseName:        el('tenant-spouse').value.trim(),
      kidsCount:         el('tenant-kids-count').value,
      kidsNames:         el('tenant-kids-names').value.trim(),
      permanentAddress:  el('tenant-perm-address').value.trim(),
      nidNumber:         el('tenant-nid-num').value.trim(),
      nidImage:          finalNidUrl,
      emergencyName:     el('tenant-emg-name').value.trim(),
      emergencyPhone:    el('tenant-emg-phone').value.trim(),
      emergencyRelation: el('tenant-emg-rel').value.trim(),
      deposit:           tk(el('tenant-deposit').value),
      leaseStart:        el('tenant-lease-start').value
    };

    // Store dedicated KYC record in Firebase Firestore
    if (window.PMS_FB?.saveTenantKYC && ownerUID) {
      try {
        await window.PMS_FB.saveTenantKYC(ownerUID, rid, {
          ...tenant,
          roomId: rid,
          roomNumber: room.number,
          propertyId: p.id,
          propertyName: p.name
        });
      } catch (fbErr) {
        console.warn("Direct Firestore KYC write warning:", fbErr);
      }
    }

    room.tenant = tenant;

    // Populate current month bill with tenant name
    const b = getBill(room, STATE.activeMonth);
    b.tenant = tenant.name;
    b.rent   = b.rent || tk(room.baseRent);
    recalcBill(b);

    save();
    closeModal('modal-tenant');
    renderDetailPage();
    toast(`${tenant.name}-এর KYC ও ছবি Firebase-এ সফলভাবে সংরক্ষিত হয়েছে! ☁️👤`, 'success');
  } catch (err) {
    console.error("Error saving tenant KYC:", err);
    toast('KYC সংরক্ষণে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
});

/* ── Co-Owner Split Modal ───────────────────────────────────── */
window.openOwnerSplit = function(id) {
  const p = getProperty(id) || getActiveProperty(); if (!p) return;
  if (p.owners.length < 2) { toast('শুধুমাত্র মাল্টিপল ওনার প্রপার্টিতে স্প্লিট প্রযোজ্য।', 'warn'); return; }

  const m = STATE.activeMonth;
  let totalWater = 0, totalGas = 0, totalPaidRent = 0;

  p.rooms.forEach(r => {
    const b = r.bills[m] || {};
    totalWater    += tk(b.water);
    totalGas      += tk(b.gas);
    totalPaidRent += tk(b.paid);
  });

  const N = p.owners.length;
  const sharedPerOwner = (totalWater + totalGas) / N;
  const rentPerOwner   = totalPaidRent / N;
  const netPerOwner    = rentPerOwner - sharedPerOwner;

  const rows = p.owners.map(owner => {
    const net = netPerOwner;
    return `<tr>
      <td>${owner}</td>
      <td>${fmt(rentPerOwner)}</td>
      <td>${fmt(totalWater / N)}</td>
      <td>${fmt(totalGas / N)}</td>
      <td class="${net >= 0 ? 'net-positive' : 'net-negative'}">${fmt(net)}</td>
    </tr>`;
  }).join('');

  el('split-modal-month').textContent = monthLabel(m);
  el('split-modal-prop').textContent  = p.name;
  el('split-summary-total-rent').textContent  = fmt(totalPaidRent);
  el('split-summary-total-water').textContent = fmt(totalWater);
  el('split-summary-total-gas').textContent   = fmt(totalGas);
  el('split-tbody').innerHTML = rows;
  openModal('modal-split');
};

/* ── Backup & Restore ───────────────────────────────────────── */
function updateBackupStatus() {
  const badge = el('firebase-status-badge');
  const txt = el('backup-status-txt');
  if (window.PMS_FB?.isEnabled && STATE.currentUser) {
    if (badge) {
      badge.textContent = '🔥 Firebase Connected';
      badge.classList.add('connected');
    }
    if (txt) {
      txt.innerHTML = '✓ <strong>স্বয়ংক্রিয় ক্লাউড সিঙ্ক সক্রিয়:</strong> যেকোনো পরিবর্তন স্বয়ংক্রিয়ভাবে Firebase-এ সংরক্ষিত হবে (কোনো বাটন চাপার প্রয়োজন নেই)।';
    }
    const indicator = el('btn-backup');
    const textEl = el('btn-backup-text');
    if (indicator) {
      indicator.classList.remove('hidden');
      if (textEl) textEl.textContent = '☁️ অটো-সেভ সক্রিয়';
    }
  } else if (window.PMS_FB?.isEnabled) {
    if (badge) {
      badge.textContent = '🔥 Firebase Ready';
      badge.classList.add('connected');
    }
    if (txt) {
      txt.textContent = 'লগইন করুন — লগইন করলে সকল ডাটা স্বয়ংক্রিয়ভাবে ক্লাউডে ব্যাকআপ হবে।';
    }
  } else {
    if (badge) {
      badge.textContent = '⚠️ Demo Mode';
      badge.classList.remove('connected');
    }
    if (txt) {
      txt.textContent = 'Demo mode — ডাটা LocalStorage-এ সংরক্ষিত।';
    }
  }
}

el('btn-backup')?.addEventListener('click', async () => {
  if (!STATE.currentUser) { toast('লগইন করুন।', 'warn'); return; }
  toast('আপনার সকল ডাটা স্বয়ংক্রিয়ভাবে Firebase ক্লাউডে সেভ করা হচ্ছে! কোনো বাটন চাপার দরকার নেই। ☁️', 'info');
  scheduleCloudSync(true);
});

el('btn-restore').addEventListener('click', async () => {
  if (!STATE.currentUser) { toast('লগইন করুন।', 'warn'); return; }
  if (!window.PMS_FB?.isEnabled) {
    el('restore-file-input').click(); return;
  }
  if (!confirm('Cloud থেকে ডাটা রিস্টোর করলে বর্তমান লোকাল ডাটা হারাবে। নিশ্চিত?')) return;
  el('btn-restore').disabled = true;
  el('btn-restore').innerHTML = '<span class="spinner"></span>';
  const data = await window.PMS_FB.restoreFromCloud(STATE.currentUser.uid);
  el('btn-restore').disabled = false;
  el('btn-restore').innerHTML = '📥 <span>Restore</span>';
  if (data?.properties) {
    STATE.properties = data.properties; save(); renderPropertiesPage();
    toast('Cloud থেকে রিস্টোর সম্পন্ন! 📥', 'success');
  } else toast('Cloud-এ কোনো ব্যাকআপ পাওয়া যায়নি।', 'warn');
});

el('restore-file-input').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.properties) {
        STATE.properties = data.properties; save(); renderPropertiesPage();
        toast('JSON ফাইল থেকে রিস্টোর সম্পন্ন! ✅', 'success');
      } else throw new Error('Invalid format');
    } catch (_) { toast('ফাইল ফরম্যাট সঠিক নয়।', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ── Seed Demo Data ─────────────────────────────────────────── */
function seedDemoData(force = false) {
  if (!force && STATE.properties && STATE.properties.length > 0) return;

  const currentM = yyyymm(new Date());
  const propId = 'prop_green_view_1';

  const demoProp = {
    id: propId,
    name: 'গ্রীন ভিউ রেসিডেন্স (Green View)',
    address: 'বাড়ি ১২, রোড ৪/এ, ধানমন্ডি, ঢাকা',
    owners: ['০১৭XXXXXXXX (মালিক ১)', '০১৮YYYYYYYY (মালিক ২)'],
    rooms: [
      {
        id: 'r_101',
        propId: propId,
        number: '১০১ (১ম তলা)',
        baseRent: 16000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 200,
        tenant: {
          name: 'মো: আরিফুল ইসলাম',
          phone: '01711000001',
          spouseName: 'ফারহানা আকতার',
          kidsCount: 1,
          kidsNames: 'তানভীর আহমেদ',
          permanentAddress: 'গ্রাম: রাধানগর, শ্রীমঙ্গল, মৌলভীবাজার',
          nidNumber: '19902692518000123',
          nidImage: '',
          emergencyName: 'আবুল কালাম',
          emergencyPhone: '01811000001',
          emergencyRelation: 'বড় ভাই',
          deposit: 32000,
          leaseStart: '2025-01-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'মো: আরিফুল ইসলাম',
            rent: 16000,
            electricity: 1450,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 200,
            total: 19730,
            paid: 19730,
            due: 0,
            paidDate: new Date().toISOString().split('T')[0],
            comment: 'বিকাশের মাধ্যমে পরিশোধিত'
          }
        }
      },
      {
        id: 'r_102',
        propId: propId,
        number: '১০২ (১ম তলা)',
        baseRent: 15000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 0,
        tenant: {
          name: 'ড. শামীম আহমেদ',
          phone: '01812000002',
          spouseName: 'নুসরাত জাহান',
          kidsCount: 2,
          kidsNames: 'আয়ান, আরিশা',
          permanentAddress: 'থানা রোড, ফেনী সদর, ফেনী',
          nidNumber: '19852692518000456',
          nidImage: '',
          emergencyName: 'কাজী রফিকুল',
          emergencyPhone: '01912000002',
          emergencyRelation: 'মামা',
          deposit: 30000,
          leaseStart: '2024-06-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'ড. শামীম আহমেদ',
            rent: 15000,
            electricity: 1350,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 0,
            total: 18430,
            paid: 10000,
            due: 8430,
            paidDate: new Date().toISOString().split('T')[0],
            comment: '১০,০০০ নগদ দেওয়া হয়েছে, বাকি বিল আগামী সপ্তাহে'
          }
        }
      },
      {
        id: 'r_201',
        propId: propId,
        number: '২০১ (২য় তলা)',
        baseRent: 18000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 300,
        tenant: {
          name: 'নাসরীন জাহান',
          phone: '01913000003',
          spouseName: 'ইকবাল মাহমুদ',
          kidsCount: 0,
          kidsNames: '',
          permanentAddress: 'হাউজিং এস্টেট, কুষ্টিয়া',
          nidNumber: '19952692518000789',
          nidImage: '',
          emergencyName: 'মাহমুদুল হক',
          emergencyPhone: '01713000003',
          emergencyRelation: 'বাবা',
          deposit: 36000,
          leaseStart: '2025-03-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'নাসরীন জাহান',
            rent: 18000,
            electricity: 2025,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 300,
            total: 22405,
            paid: 0,
            due: 22405,
            paidDate: '',
            comment: 'চলতি মাসের নোটিশ পাঠানো হয়েছে'
          }
        }
      },
      {
        id: 'r_202',
        propId: propId,
        number: '২০২ (২য় তলা)',
        baseRent: 17000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 0,
        tenant: {
          name: 'ইঞ্জি: তানভীর হাসান',
          phone: '01614000004',
          spouseName: 'সামিয়া হক',
          kidsCount: 1,
          kidsNames: 'নিহাল',
          permanentAddress: 'মিরপুর ১০, ঢাকা',
          nidNumber: '19922692518000999',
          nidImage: '',
          emergencyName: 'হাসান হাবিব',
          emergencyPhone: '01514000004',
          emergencyRelation: 'চাচা',
          deposit: 34000,
          leaseStart: '2024-11-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'ইঞ্জি: তানভীর হাসান',
            rent: 17000,
            electricity: 1425,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 0,
            total: 20505,
            paid: 20505,
            due: 0,
            paidDate: new Date().toISOString().split('T')[0],
            comment: 'ব্যাংক ট্রান্সফারের মাধ্যমে পরিশোধ'
          }
        }
      },
      {
        id: 'r_301',
        propId: propId,
        number: '৩০১ (৩য় তলা - পেন্টহাউস)',
        baseRent: 20000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 0,
        tenant: null,
        bills: {}
      }
    ]
  };

  const demoElec = {
    activeMeterIdx: 0,
    mainMeters: [
      {
        id: 'm_main_1',
        name: 'ডেসকো মেইন মিটার (গ্রীন ভিউ)',
        totalBill: 6250,
        subMeters: [
          { id: 'sm_1', name: 'সাব-মিটার ১০১', linkedRoomId: 'r_101', prevReading: 420, currReading: 536 },
          { id: 'sm_2', name: 'সাব-মিটার ১০২', linkedRoomId: 'r_102', prevReading: 310, currReading: 418 },
          { id: 'sm_3', name: 'সাব-মিটার ২০১', linkedRoomId: 'r_201', prevReading: 550, currReading: 712 },
          { id: 'sm_4', name: 'সাব-মিটার ২০২', linkedRoomId: 'r_202', prevReading: 280, currReading: 394 }
        ]
      }
    ]
  };

  if (!STATE.currentUser) {
    toast('নমুনা ডাটা লোড করার পূর্বে অনুগ্রহ করে লগইন করুন।', 'warn');
    return;
  }
  demoProp.ownerName = STATE.currentUser.displayName || STATE.currentUser.email || 'বাড়িওয়ালা';
  STATE.properties = [demoProp];
  save();
  try {
    localStorage.setItem('pms_elec_' + propId, JSON.stringify(demoElec));
  } catch (_) {}
}

el('btn-seed-demo')?.addEventListener('click', () => {
  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }
  if (STATE.properties.length > 0 && !confirm('নমুনা ডেমো ডাটা লোড করতে চান?')) return;
  seedDemoData(true);
  renderPropertiesPage();
  toast('নমুনা ডাটা সফলভাবে লোড হয়েছে! ✨', 'success');
});

/* ── Init ───────────────────────────────────────────────────── */
async function init() {
  load();
  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }
  setAuthUI(STATE.currentUser);

  // Sync auth state with Firebase Auth if available
  if (window.PMS_FB?.onAuthChange) {
    window.PMS_FB.onAuthChange((fbUser) => {
      if (!fbUser && isLoggedIn() && STATE.currentUser?.provider === 'google') {
        localStorage.removeItem('pms_user');
        window.location.replace('login.html');
      }
    });
  }

  showPage('page-properties');
  renderPropertiesPage();
  updateBackupStatus();

  // Auto-fetch from Cloud Firestore if local storage is empty (after cookies cleared or on new device)
  if (window.PMS_FB?.isEnabled && STATE.currentUser?.uid) {
    if (!STATE.properties || STATE.properties.length === 0) {
      try {
        if (el('backup-status-txt')) el('backup-status-txt').textContent = 'Cloud থেকে ডাটা আনা হচ্ছে... ☁️';
        const cloudData = await window.PMS_FB.restoreFromCloud(STATE.currentUser.uid);
        if (cloudData && Array.isArray(cloudData.properties) && cloudData.properties.length > 0) {
          STATE.properties = cloudData.properties;
          const userKey = 'pms_v2_' + STATE.currentUser.uid;
          localStorage.setItem(userKey, JSON.stringify({ properties: STATE.properties }));
          localStorage.setItem('pms_v2', JSON.stringify({ properties: STATE.properties }));
          renderPropertiesPage();
          updateBackupStatus();
          toast(`Cloud থেকে আপনার ${STATE.properties.length}টি প্রপার্টির তথ্য লোড করা হয়েছে! ☁️`, 'success');
        } else {
          updateBackupStatus();
        }
      } catch (err) {
        console.error('Auto cloud restore error:', err);
        updateBackupStatus();
      }
    }
  }
}
init();

