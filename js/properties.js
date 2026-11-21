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
    toast('প্রপার্টি যুক্ত হয়েছে!', 'success');
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
  el('modal-property-title').innerHTML = '<i class="fa-solid fa-house"></i> নতুন প্রপার্টি যুক্ত করুন';
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
      <div class="es-icon"><i class="fa-solid fa-city"></i></div>
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
          <div class="prop-name"><i class="fa-solid fa-building" style="margin-right:0.35rem;color:var(--accent-light)"></i>${p.name}</div>
          <div class="prop-addr"><i class="fa-solid fa-location-dot" style="margin-right:0.25rem;color:var(--text-muted)"></i>${p.address}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.35rem">
            ${p.owners.length > 1 ? '<i class="fa-solid fa-users" style="margin-right:0.25rem"></i>' + p.owners.join(', ') : '<i class="fa-solid fa-user" style="margin-right:0.25rem"></i>' + p.owners[0]}
          </div>
        </div>
        <div style="display:flex;gap:0.4rem;flex-shrink:0">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="event.stopPropagation();editProperty('${p.id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();deleteProperty('${p.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
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
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openPropertyDetail('${p.id}')"><i class="fa-solid fa-clipboard-list"></i> বিস্তারিত দেখুন</button>
          ${p.owners.length > 1 ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openOwnerSplit('${p.id}')"><i class="fa-solid fa-users"></i> Split দেখুন</button>` : ''}
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
  el('modal-property-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> প্রপার্টি আপডেট করুন';
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
