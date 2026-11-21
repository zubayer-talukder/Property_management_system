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
    if (sizeEl) sizeEl.innerHTML = `আকার: ${(blob.size / 1024).toFixed(0)} KB (<i class="fa-solid fa-bolt" style="color:var(--amber)"></i> অপটিমাইজড)`;
    if (badgeEl) {
      badgeEl.className = 'img-status-badge saved';
      badgeEl.innerHTML = '<i class="fa-solid fa-check"></i> সংরক্ষণ করতে প্রস্তুত';
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
      badgeEl.innerHTML = '<i class="fa-solid fa-check"></i> প্রস্তুত';
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

window.openTenantModal = function(rid = null, mode = 'add') {
  const p = getActiveProperty();
  if (!p) {
    toast('কোনো প্রপার্টি সিলেক্ট করা নেই।', 'warn');
    return;
  }
  if (!p.rooms || !p.rooms.length) {
    toast('প্রথমে প্রপার্টিতে "+ রুম যুক্ত করুন" বাটনে ক্লিক করে রুম তৈরি করুন।', 'warn');
    return;
  }

  // Determine target room: explicit rid, or first vacant room, or first room
  let targetRoomId = rid;
  if (!targetRoomId) {
    const vacantRoom = p.rooms.find(r => !r.tenant);
    targetRoomId = vacantRoom ? vacantRoom.id : p.rooms[0].id;
  }

  const room = p.rooms.find(r => r.id === targetRoomId);
  if (!room) return;

  // Populate room selection dropdown
  const roomSelect = el('tenant-room-select');
  if (roomSelect) {
    roomSelect.innerHTML = p.rooms.map(r => {
      const isVac = !r.tenant;
      return `<option value="${r.id}" ${r.id === targetRoomId ? 'selected' : ''}>রুম ${r.number} ${isVac ? '(খালি)' : '— বর্তমান: ' + r.tenant.name}</option>`;
    }).join('');
    roomSelect.disabled = (mode === 'view');
  }

  el('form-tenant').reset();
  el('form-tenant').dataset.roomId = targetRoomId;

  // Populate monthly rent field
  if (el('tenant-monthly-rent')) {
    el('tenant-monthly-rent').value = room.baseRent || '';
  }

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
      el(isPhoto ? 'label-photo-size' : 'label-nid-size').innerHTML = src.startsWith('http') ? 'Firebase Storage <i class="fa-solid fa-cloud"></i>' : 'Firestore Cloud <i class="fa-solid fa-floppy-disk"></i>';
    }
    const b = el(isPhoto ? 'badge-photo-status' : 'badge-nid-status');
    if (b) {
      b.className = 'img-status-badge saved';
      b.innerHTML = '<i class="fa-solid fa-check"></i> সংরক্ষিত';
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
      window.PMS_FB.getTenantKYC(STATE.currentUser.uid, targetRoomId).then(kyc => {
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

    el('tenant-modal-title').innerHTML = `<i class="fa-solid fa-user"></i> ${t.name} (রুম ${room.number}) — KYC তথ্য`;
    el('btn-evict')?.classList.remove('hidden');
    el('btn-switch-add-tenant')?.classList.remove('hidden');
  } else {
    const mLabel = monthLabel(STATE.activeMonth || yyyymm(new Date()));
    el('tenant-modal-title').innerHTML = `<i class="fa-solid fa-user-plus"></i> নতুন ভাড়াটিয়া যুক্ত করুন (${mLabel})`;
    el('btn-evict')?.classList.add('hidden');
    el('btn-switch-add-tenant')?.classList.add('hidden');

    // Default lease start date to the active month
    const todayStr = new Date().toISOString().split('T')[0];
    if (STATE.activeMonth && todayStr.startsWith(STATE.activeMonth)) {
      el('tenant-lease-start').value = todayStr;
    } else if (STATE.activeMonth) {
      el('tenant-lease-start').value = `${STATE.activeMonth}-01`;
    } else {
      el('tenant-lease-start').value = todayStr;
    }
  }

  // Reset tabs
  document.querySelector('[data-tab-group="tenant-tabs"][data-tab-target="tenant-tab-personal"]')?.click();
  openModal('modal-tenant');
};

el('tenant-room-select')?.addEventListener('change', e => {
  const selectedId = e.target.value;
  el('form-tenant').dataset.roomId = selectedId;
  const p = getActiveProperty();
  const selectedRoom = p?.rooms.find(r => r.id === selectedId);
  if (selectedRoom && el('tenant-monthly-rent')) {
    el('tenant-monthly-rent').value = selectedRoom.baseRent || '';
  }
});

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
  const rid = el('tenant-room-select')?.value || e.target.dataset.roomId;
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

    // Update room base rent if entered in tenant modal
    const enteredRent = tk(el('tenant-monthly-rent')?.value);
    if (enteredRent > 0) {
      room.baseRent = enteredRent;
    }

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

    const activeM = STATE.activeMonth || yyyymm(new Date());
    const leaseStartDate = el('tenant-lease-start').value || `${activeM}-01`;

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
      leaseStart:        leaseStartDate
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

    // Set active tenant on room
    room.tenant = tenant;

    // Establish official bill record for active month (e.g. 2026-12)
    if (!room.bills) room.bills = {};
    let b = room.bills[activeM];
    const carriedDue = (typeof calculateCarriedDuesForMonth === 'function')
      ? calculateCarriedDuesForMonth(room, activeM)
      : 0;

    if (!b || b.isTransient) {
      b = {
        month: activeM,
        tenant: tenant.name,
        rent: enteredRent || tk(room.baseRent),
        electricity: 0,
        water: tk(room.waterBill),
        gas: tk(room.gasBill),
        wifi: tk(room.wifiBill),
        other: tk(room.otherBill),
        prevBalance: carriedDue,
        currentTotal: 0,
        total: 0,
        paid: 0,
        due: 0,
        advance: 0,
        paidDate: '',
        comment: ''
      };
      room.bills[activeM] = b;
    } else {
      b.tenant = tenant.name;
      if (enteredRent > 0) b.rent = enteredRent;
      else if (tk(b.rent) === 0) b.rent = tk(room.baseRent);
      if (tk(b.water) === 0) b.water = tk(room.waterBill);
      if (tk(b.gas) === 0) b.gas = tk(room.gasBill);
      if (tk(b.wifi) === 0) b.wifi = tk(room.wifiBill);
      if (tk(b.other) === 0) b.other = tk(room.otherBill);
    }
    delete b.isTransient;
    recalcBill(b);

    // Save and push immediate cloud sync to Firebase
    save();
    if (typeof scheduleCloudSync === 'function') {
      scheduleCloudSync(true);
    }

    closeModal('modal-tenant');
    renderDetailPage();
    toast(`${tenant.name}-এর তথ্য ও ${monthLabel(activeM)}-এর হিসাব Firebase-এ সফলভাবে সংরক্ষিত হয়েছে!`, 'success');
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
