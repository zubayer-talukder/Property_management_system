/* ── Backup & Restore ───────────────────────────────────────── */
function updateBackupStatus() {
  const badge = el('firebase-status-badge');
  const txt = el('backup-status-txt');
  if (window.PMS_FB?.isEnabled && STATE.currentUser) {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-fire" style="color:#ff9800"></i> Firebase Connected';
      badge.classList.add('connected');
    }
    if (txt) {
      txt.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--green)"></i> <strong>স্বয়ংক্রিয় ক্লাউড সিঙ্ক সক্রিয়:</strong> যেকোনো পরিবর্তন স্বয়ংক্রিয়ভাবে Firebase-এ সংরক্ষিত হবে (কোনো বাটন চাপার প্রয়োজন নেই)।';
    }
    const indicator = el('btn-backup');
    const textEl = el('btn-backup-text');
    if (indicator) {
      indicator.classList.remove('hidden');
      if (textEl) textEl.innerHTML = '<i class="fa-solid fa-cloud"></i> অটো-সেভ সক্রিয়';
    }
  } else if (window.PMS_FB?.isEnabled) {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-fire" style="color:#ff9800"></i> Firebase Ready';
      badge.classList.add('connected');
    }
    if (txt) {
      txt.textContent = 'লগইন করুন — লগইন করলে সকল ডাটা স্বয়ংক্রিয়ভাবে ক্লাউডে ব্যাকআপ হবে।';
    }
  } else {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:var(--amber)"></i> Demo Mode';
      badge.classList.remove('connected');
    }
    if (txt) {
      txt.textContent = 'Demo mode — ডাটা LocalStorage-এ সংরক্ষিত।';
    }
  }
}

el('btn-backup')?.addEventListener('click', async () => {
  if (!STATE.currentUser) { toast('লগইন করুন।', 'warn'); return; }
  toast('আপনার সকল ডাটা স্বয়ংক্রিয়ভাবে Firebase ক্লাউডে সেভ করা হচ্ছে! কোনো বাটন চাপার দরকার নেই।', 'info');
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
  el('btn-restore').innerHTML = '<i class="fa-solid fa-download"></i> <span>Restore</span>';
  if (data?.properties) {
    STATE.properties = data.properties; save(); renderPropertiesPage();
    toast('Cloud থেকে রিস্টোর সম্পন্ন!', 'success');
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
        toast('JSON ফাইল থেকে রিস্টোর সম্পন্ন!', 'success');
      } else throw new Error('Invalid format');
    } catch (_) { toast('ফাইল ফরম্যাট সঠিক নয়।', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});
