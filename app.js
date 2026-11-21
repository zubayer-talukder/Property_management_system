/* ======================================================
   Property Management System — Main Application Entry Point
   Modularized architecture: see js/ folder for components
   ====================================================== */

/* ======================================================
   Property Management System — Main Application Entry Point
   Modularized architecture: see js/ folder for components
   ====================================================== */

/* ── Cloud Sync Engine ──────────────────────────────────────── */
function calculatePropertiesWeight(props) {
  if (!Array.isArray(props)) return 0;
  let weight = 0;
  props.forEach(p => {
    weight += 5;
    (p.rooms || []).forEach(r => {
      weight += 2;
      if (r.tenant && r.tenant.name) weight += 25; // tenant presence has high value
      if (r.bills) {
        Object.keys(r.bills).forEach(m => {
          if (r.bills[m] && !r.bills[m].isTransient) weight += 10;
        });
      }
    });
  });
  return weight;
}

async function performInitialCloudSync(uid) {
  try {
    const txtEl = el('backup-status-txt');
    if (txtEl) txtEl.innerHTML = '<i class="fa-solid fa-rotate fa-spin" style="color:var(--amber)"></i> Cloud থেকে সর্বাধুনিক ডাটা সিঙ্ক হচ্ছে...';

    const cloudData = await window.PMS_FB.restoreFromCloud(uid);

    if (!cloudData || !Array.isArray(cloudData.properties) || cloudData.properties.length === 0) {
      // Cloud is empty, but local has data: push local to Cloud immediately
      if (STATE.properties && STATE.properties.length > 0) {
        scheduleCloudSync(true);
      }
      updateBackupStatus();
      return;
    }

    const localWeight = calculatePropertiesWeight(STATE.properties);
    const cloudWeight = calculatePropertiesWeight(cloudData.properties);

    const localUpdatedAt = localStorage.getItem('pms_updated_at_' + uid) || '';
    const cloudUpdatedAt = cloudData.backedUpAt || '';

    // Should we adopt cloud data?
    // 1. Cloud has richer data (more occupied rooms/tenants/bills)
    // 2. Local is empty
    // 3. Or Cloud is strictly newer
    const shouldPull = (cloudWeight > localWeight) ||
                       (!STATE.properties.length) ||
                       (cloudWeight === localWeight && cloudUpdatedAt > localUpdatedAt);

    if (shouldPull) {
      STATE.properties = cloudData.properties;
      const userKey = 'pms_v2_' + uid;
      localStorage.setItem(userKey, JSON.stringify({ properties: STATE.properties }));
      localStorage.setItem('pms_v2', JSON.stringify({ properties: STATE.properties }));
      localStorage.setItem('pms_updated_at_' + uid, cloudUpdatedAt || new Date().toISOString());

      if (cloudData.theme && typeof window.applyTheme === 'function') {
        window.applyTheme(cloudData.theme);
      }

      renderPropertiesPage();
      if (STATE.activePropertyId) renderDetailPage();
      updateBackupStatus();
      toast('Cloud থেকে সর্বশেষ ডাটা সফলভাবে সিঙ্ক হয়েছে!', 'success', 2500);
    } else if (localWeight > cloudWeight) {
      // Local has more complete data (e.g. from localhost edits): push to Cloud!
      scheduleCloudSync(true);
      updateBackupStatus();
    } else {
      updateBackupStatus();
    }
  } catch (err) {
    console.error('performInitialCloudSync error:', err);
    updateBackupStatus();
  }
}

let _cloudListenerUnsub = null;
function setupRealtimeCloudListener(uid) {
  if (typeof window.PMS_FB?.listenToCloudBackup !== 'function') return;
  if (_cloudListenerUnsub) {
    try { _cloudListenerUnsub(); } catch (_) {}
  }

  _cloudListenerUnsub = window.PMS_FB.listenToCloudBackup(uid, (cloudData) => {
    if (!cloudData || !Array.isArray(cloudData.properties)) return;

    // Ignore echoes from this exact tab/client
    if (cloudData.clientId === window._pmsClientId) return;

    const localWeight = calculatePropertiesWeight(STATE.properties);
    const cloudWeight = calculatePropertiesWeight(cloudData.properties);
    const localUpdatedAt = localStorage.getItem('pms_updated_at_' + uid) || '';
    const cloudUpdatedAt = cloudData.backedUpAt || '';

    if (cloudWeight >= localWeight || cloudUpdatedAt > localUpdatedAt) {
      STATE.properties = cloudData.properties;
      const userKey = 'pms_v2_' + uid;
      localStorage.setItem(userKey, JSON.stringify({ properties: STATE.properties }));
      localStorage.setItem('pms_v2', JSON.stringify({ properties: STATE.properties }));
      localStorage.setItem('pms_updated_at_' + uid, cloudUpdatedAt || new Date().toISOString());

      if (cloudData.theme && typeof window.applyTheme === 'function') {
        window.applyTheme(cloudData.theme);
      }

      renderPropertiesPage();
      if (STATE.activePropertyId) renderDetailPage();
      updateBackupStatus();
    }
  });
}

window.manualTriggerCloudSync = async function() {
  if (!STATE.currentUser?.uid) {
    toast('ক্লাউড সিঙ্ক করতে প্রথমে গুগল লগইন করুন।', 'warn');
    return;
  }
  const btn = el('btn-cloud-sync');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> <span>সিঙ্ক হচ্ছে...</span>';
  }
  try {
    await performInitialCloudSync(STATE.currentUser.uid);
    await scheduleCloudSync(true);
    toast('ক্লাউডের সাথে সকল ডাটা সফলভাবে সিঙ্ক সম্পন্ন হয়েছে!', 'success');
  } catch (err) {
    console.error('manualTriggerCloudSync error:', err);
    toast('ক্লাউড সিঙ্ক সম্পন্ন করা যায়নি।', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
};

/* ── Init ───────────────────────────────────────────────────── */
async function init() {
  initThemeToggle();
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

  // Automatic Two-Way Cloud Sync with Firebase Firestore
  if (window.PMS_FB?.isEnabled && STATE.currentUser?.uid) {
    await performInitialCloudSync(STATE.currentUser.uid);
    setupRealtimeCloudListener(STATE.currentUser.uid);
  }
}
init();

