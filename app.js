/* ======================================================
   Property Management System — Main Application Entry Point
   Modularized architecture: see js/ folder for components
   ====================================================== */

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

  // Auto-fetch from Cloud Firestore if local storage is empty (after cookies cleared or on new device)
  if (window.PMS_FB?.isEnabled && STATE.currentUser?.uid) {
    if (!STATE.properties || STATE.properties.length === 0) {
      try {
        if (el('backup-status-txt')) el('backup-status-txt').innerHTML = '<i class="fa-solid fa-cloud fa-fade"></i> Cloud থেকে ডাটা আনা হচ্ছে...';
        const cloudData = await window.PMS_FB.restoreFromCloud(STATE.currentUser.uid);
        if (cloudData && Array.isArray(cloudData.properties) && cloudData.properties.length > 0) {
          STATE.properties = cloudData.properties;
          const userKey = 'pms_v2_' + STATE.currentUser.uid;
          localStorage.setItem(userKey, JSON.stringify({ properties: STATE.properties }));
          localStorage.setItem('pms_v2', JSON.stringify({ properties: STATE.properties }));
          renderPropertiesPage();
          updateBackupStatus();
          toast(`Cloud থেকে আপনার ${STATE.properties.length}টি প্রপার্টির তথ্য লোড করা হয়েছে!`, 'success');
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

