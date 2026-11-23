/* ============================================================
   Property Management System — Electricity Sub-Meter Engine
   ============================================================
   Formula:
     Units Used (sub)  = Current Reading – Previous Reading
     Effective Rate    = Main Meter Total Bill ÷ Σ Sub-Meter Units
     Room Bill         = Sub-Meter Units × Effective Rate
   ============================================================ */

'use strict';

/* ── State ──────────────────────────────────────────────────── */
const ELEC_STATE = {
  mainMeters: [],      // Array<MainMeter>
  activeMeterIdx: 0,
  monthly: {}          // key: 'YYYY-MM' -> { meters: [...] }
};

function elecSave() {
  try {
    const prop = typeof getActiveProperty === 'function' ? getActiveProperty() : null;
    if (!prop) return;
    const m = (typeof STATE !== 'undefined' && STATE?.activeMonth) ? STATE.activeMonth : 'default';
    if (!ELEC_STATE.monthly) ELEC_STATE.monthly = {};

    // Snapshot readings for the active month
    ELEC_STATE.monthly[m] = {
      activeMeterIdx: ELEC_STATE.activeMeterIdx,
      meters: ELEC_STATE.mainMeters.map(meter => ({
        id: meter.id,
        name: meter.name,
        totalBill: meter.totalBill,
        subMeters: (meter.subMeters || []).map(sm => ({
          id: sm.id,
          name: sm.name,
          linkedRoomId: sm.linkedRoomId || '',
          prevReading: sm.prevReading || 0,
          currReading: sm.currReading || 0
        }))
      }))
    };

    prop.elecState = JSON.parse(JSON.stringify(ELEC_STATE));
    localStorage.setItem('pms_elec_' + prop.id, JSON.stringify(ELEC_STATE));
    if (typeof save === 'function') save();
  } catch (_) {}
}

function elecLoad() {
  try {
    const prop = typeof getActiveProperty === 'function' ? getActiveProperty() : null;
    if (!prop) return;
    const m = (typeof STATE !== 'undefined' && STATE?.activeMonth) ? STATE.activeMonth : 'default';

    let data = prop.elecState;
    if (!data) {
      const raw = localStorage.getItem('pms_elec_' + prop.id);
      if (raw) data = JSON.parse(raw);
    }

    if (data) {
      ELEC_STATE.mainMeters = Array.isArray(data.mainMeters) ? data.mainMeters : [];
      ELEC_STATE.activeMeterIdx = data.activeMeterIdx || 0;
      ELEC_STATE.monthly = data.monthly || {};

      // If active month has specific readings, apply them to mainMeters
      if (ELEC_STATE.monthly[m] && Array.isArray(ELEC_STATE.monthly[m].meters)) {
        ELEC_STATE.monthly[m].meters.forEach(mm => {
          const target = ELEC_STATE.mainMeters.find(x => x.id === mm.id);
          if (target) {
            target.totalBill = mm.totalBill;
            (mm.subMeters || []).forEach(sm => {
              const subTarget = (target.subMeters || []).find(s => s.id === sm.id);
              if (subTarget) {
                subTarget.prevReading = sm.prevReading;
                subTarget.currReading = sm.currReading;
                if (sm.linkedRoomId) subTarget.linkedRoomId = sm.linkedRoomId;
              }
            });
          }
        });
      }
    } else {
      ELEC_STATE.mainMeters = [];
      ELEC_STATE.activeMeterIdx = 0;
      ELEC_STATE.monthly = {};
    }
  } catch (_) {
    ELEC_STATE.mainMeters = [];
  }
}

function makeMainMeter(name) {
  return { id: uid(), name, totalBill: 0, subMeters: [] };
}
function makeSubMeter(name, linkedRoomId = '') {
  return { id: uid(), name, linkedRoomId, prevReading: 0, currReading: 0 };
}

/* ── Auto-Sync Bills into Room & Billing ───────────────────── */
function elecAutoSyncBills(silent = true) {
  const p = typeof getActiveProperty === 'function' ? getActiveProperty() : null;
  if (!p || !p.rooms) return;
  const m = STATE?.activeMonth;
  if (!m) return;

  elecLoad();

  // Map of roomId -> total calculated electricity bill
  const roomBills = {};
  const linkedRoomIds = new Set();

  ELEC_STATE.mainMeters.forEach(meter => {
    const subs = meter.subMeters || [];
    const totalBill = tk(meter.totalBill);
    const totalUnits = subs.reduce((s, sm) => s + Math.max(0, tk(sm.currReading) - tk(sm.prevReading)), 0);

    if (totalBill > 0 && totalUnits > 0) {
      const rate = totalBill / totalUnits;
      subs.forEach(sm => {
        if (!sm.linkedRoomId) return;
        linkedRoomIds.add(sm.linkedRoomId);
        const units = Math.max(0, tk(sm.currReading) - tk(sm.prevReading));
        const bill = Math.round(units * rate * 100) / 100;
        roomBills[sm.linkedRoomId] = (roomBills[sm.linkedRoomId] || 0) + bill;
      });
    } else {
      // If bill is 0 or units are 0, record linked room as 0
      subs.forEach(sm => {
        if (sm.linkedRoomId) {
          linkedRoomIds.add(sm.linkedRoomId);
          roomBills[sm.linkedRoomId] = (roomBills[sm.linkedRoomId] || 0) + 0;
        }
      });
    }
  });

  let changed = false;
  linkedRoomIds.forEach(rid => {
    const room = p.rooms.find(r => r.id === rid);
    if (!room) return;
    const newBill = roomBills[rid] !== undefined ? roomBills[rid] : 0;
    if (!room.bills) room.bills = {};
    if (!room.bills[m] && newBill === 0) return;
    if (!room.bills[m] && newBill > 0) {
      room.bills[m] = {
        month: m,
        tenant: room.tenant?.name || '',
        rent: tk(room.baseRent),
        electricity: newBill,
        water: tk(room.waterBill),
        gas: tk(room.gasBill),
        wifi: tk(room.wifiBill),
        other: tk(room.otherBill),
        prevBalance: 0,
        paid: 0
      };
      if (typeof recalcBill === 'function') recalcBill(room.bills[m]);
      changed = true;
      return;
    }
    const b = room.bills[m];
    if (b && b.electricity !== newBill) {
      b.electricity = newBill;
      if (typeof recalcBill === 'function') recalcBill(b);
      changed = true;
    }
  });

  if (changed) {
    if (typeof save === 'function') save();
    if (STATE.activePropertyId) {
      if (typeof renderMetrics === 'function') renderMetrics(p);
      if (typeof renderRoomsTable === 'function') renderRoomsTable(p);
    }
  }

  if (!silent) {
    toast(`রুম ও বিলিং-এ বিদ্যুৎ বিল সফলভাবে আপডেট হয়েছে!`, 'success');
  }
}
window.elecAutoSyncBills = elecAutoSyncBills;

/* ── Render ─────────────────────────────────────────────────── */
function renderElecPanel() {
  const p = getActiveProperty();
  if (!p) return;
  elecLoad();
  renderMainMeterTabs();
  renderSubMeters();
  elecAutoSyncBills(true);
}

function renderMainMeterTabs() {
  const container = document.getElementById('elec-meter-tabs');
  if (!container) return;
  container.innerHTML = ELEC_STATE.mainMeters.map((m, i) =>
    `<button class="btn btn-sm ${i === ELEC_STATE.activeMeterIdx ? 'btn-primary' : 'btn-secondary'}"
       onclick="elecSelectMeter(${i})">${m.name}</button>`
  ).join('') +
  `<button class="btn btn-sm btn-ghost" onclick="elecAddMeter()" title="মিটার যুক্ত করুন">+ মিটার</button>`;

  const activeMeter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx];
  const billInput = document.getElementById('elec-main-bill');
  const meterNameEl = document.getElementById('elec-active-meter-name');
  if (billInput && activeMeter) billInput.value = activeMeter.totalBill || '';
  if (meterNameEl && activeMeter) meterNameEl.textContent = activeMeter.name;
  if (!activeMeter && document.getElementById('elec-main-bill')) {
    document.getElementById('elec-main-bill').value = '';
    document.getElementById('elec-active-meter-name').textContent = '—';
  }
}

function renderSubMeters() {
  const container = document.getElementById('elec-submeters-list');
  if (!container) return;
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx];
  if (!meter) {
    container.innerHTML = `<div class="empty-state"><div class="es-icon"><i class="fa-solid fa-bolt"></i></div><p>${typeof t === 'function' ? t('elec_no_meter', 'আগে একটি মেইন মিটার যুক্ত করুন।') : 'আগে একটি মেইন মিটার যুক্ত করুন।'}</p></div>`;
    return;
  }
  const p = getActiveProperty();
  const rooms = p?.rooms || [];

  container.innerHTML = meter.subMeters.map((sm, i) => {
    const units = Math.max(0, tk(sm.currReading) - tk(sm.prevReading));
    return `
    <div class="submeter-row" data-sub-idx="${i}">
      <div class="form-group" style="margin:0">
        <label class="form-label">${typeof t === 'function' ? t('elec_submeter_name', 'সাব-মিটার নাম') : 'সাব-মিটার নাম'}</label>
        <input class="form-control" value="${sm.name}"
          onchange="elecUpdateSubName(${i}, this.value)" placeholder="e.g. Room 201">
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">${typeof t === 'function' ? t('elec_linked_room', 'লিঙ্ক করা রুম') : 'লিঙ্ক করা রুম'}</label>
        <select class="form-control" onchange="elecLinkRoom(${i}, this.value)">
          <option value="">${window.currentLang === 'en' ? '— Select Room —' : '— নির্বাচন করুন —'}</option>
          ${rooms.map(r => `<option value="${r.id}" ${r.id === sm.linkedRoomId ? 'selected' : ''}>${window.currentLang === 'en' ? 'Room' : 'রুম'} ${r.number}${r.tenant ? ` (${r.tenant.name})` : (window.currentLang === 'en' ? ' (Vacant)' : ' (খালি)')}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">${typeof t === 'function' ? t('elec_prev_reading', 'আগের রিডিং') : 'আগের রিডিং'}</label>
        <input class="form-control" type="number" min="0" step="any" value="${sm.prevReading !== undefined && sm.prevReading !== null ? sm.prevReading : ''}"
          oninput="elecUpdateReading(${i},'prev',this.value,this)" placeholder="0">
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">${typeof t === 'function' ? t('elec_curr_reading', 'বর্তমান') : 'বর্তমান'}</label>
        <input class="form-control" type="number" min="0" step="any" value="${sm.currReading !== undefined && sm.currReading !== null ? sm.currReading : ''}"
          oninput="elecUpdateReading(${i},'curr',this.value,this)" placeholder="0">
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">${typeof t === 'function' ? t('elec_units_used', 'ব্যবহার') : 'ব্যবহার'}</label>
        <input class="form-control submeter-units-val" readonly value="${units} unit"
          style="color:var(--amber);font-weight:700">
      </div>
      <button class="btn btn-danger btn-sm btn-icon" onclick="elecRemoveSubMeter(${i})" style="margin-bottom:0.5rem" title="মুছে ফেলুন"><i class="fa-solid fa-trash-can"></i></button>
    </div>`;
  }).join('') +
  `<button class="btn btn-secondary btn-sm mt-1" onclick="elecAddSubMeter()">${typeof t === 'function' ? t('elec_add_submeter', '+ সাব-মিটার যুক্ত করুন') : '+ সাব-মিটার যুক্ত করুন'}</button>`;

  renderElecResults(meter);
}

function renderElecResults(meter) {
  const resultsEl = document.getElementById('elec-results');
  if (!resultsEl) return;
  const subs = meter.subMeters || [];
  const totalBill = tk(meter.totalBill);
  const totalUnits = subs.reduce((s, sm) => s + Math.max(0, tk(sm.currReading) - tk(sm.prevReading)), 0);

  if (!totalBill || !totalUnits) {
    resultsEl.innerHTML = `<div style="color:var(--text-muted);font-size:0.82rem;padding:0.5rem;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm)">
      <i class="fa-solid fa-circle-info"></i> মেইন মিটারের মোট বিল এবং সাব-মিটারের রিডিং ইনপুট করলেই <strong>স্বয়ংক্রিয়ভাবে রুম ও বিলিং-এ যোগ হবে</strong>।
    </div>`;
    return;
  }
  const rate = totalBill / totalUnits;
  const rows = subs.map(sm => {
    const units = Math.max(0, tk(sm.currReading) - tk(sm.prevReading));
    const bill  = Math.round(units * rate * 100) / 100;
    return `<tr>
      <td>${sm.name}</td>
      <td style="text-align:right;color:var(--amber)">${units} unit</td>
      <td style="text-align:right;color:var(--text-primary);font-weight:700">${fmt(bill)}</td>
    </tr>`;
  }).join('');

  resultsEl.innerHTML = `
    <div class="elec-result">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
        <div class="rate"><i class="fa-solid fa-chart-simple"></i> ${typeof t === 'function' ? t('elec_rate_per_unit', 'প্রতি ইউনিটের রেট') : 'প্রতি ইউনিটের রেট'}: ${fmt(rate)}/unit</div>
        <div style="font-size:0.75rem;background:rgba(16,185,129,0.15);color:var(--green);padding:0.25rem 0.6rem;border-radius:12px;font-weight:600">
          <i class="fa-solid fa-check"></i> ${typeof t === 'function' ? t('elec_synced_badge', 'রুম ও বিলিং-এ স্বয়ংক্রিয়ভাবে সিঙ্ক হয়েছে') : 'রুম ও বিলিং-এ স্বয়ংক্রিয়ভাবে সিঙ্ক হয়েছে'}
        </div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin:0.3rem 0">${window.currentLang === 'en' ? `Total Bill ${fmt(totalBill)} ÷ Total ${totalUnits} units` : `মোট বিল ${fmt(totalBill)} ÷ মোট ${totalUnits} unit`}</div>
      <table class="mt-1">
        <thead>
          <tr>
            <th style="text-align:left;font-size:0.7rem;color:var(--text-muted);padding:0.25rem 0.5rem">${window.currentLang === 'en' ? 'Sub-Meter' : 'সাব-মিটার'}</th>
            <th style="text-align:right;font-size:0.7rem;color:var(--text-muted);padding:0.25rem 0.5rem">${window.currentLang === 'en' ? 'Units' : 'ইউনিট'}</th>
            <th style="text-align:right;font-size:0.7rem;color:var(--text-muted);padding:0.25rem 0.5rem">${window.currentLang === 'en' ? 'Bill (৳)' : 'বিল (৳)'}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <button class="btn btn-success btn-sm mt-1" onclick="elecPushBills()" style="width:100%;margin-top:0.75rem">
        <i class="fa-solid fa-arrows-rotate"></i> ${window.currentLang === 'en' ? 'Refresh & Sync to Current Month Bills' : 'চলতি মাসের বিলে রিফ্রেশ ও সিঙ্ক করুন'}
      </button>
    </div>`;
}

/* ── Actions ────────────────────────────────────────────────── */
window.elecSelectMeter = function(idx) {
  ELEC_STATE.activeMeterIdx = idx;
  renderMainMeterTabs();
  renderSubMeters();
};

window.elecAddMeter = function() {
  const name = prompt('মেইন মিটারের নাম দিন:', `Main Meter ${ELEC_STATE.mainMeters.length + 1}`);
  if (!name?.trim()) return;
  ELEC_STATE.mainMeters.push(makeMainMeter(name.trim()));
  ELEC_STATE.activeMeterIdx = ELEC_STATE.mainMeters.length - 1;
  elecSave();
  renderMainMeterTabs();
  renderSubMeters();
  elecAutoSyncBills(true);
};

window.elecAddSubMeter = function() {
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx]; if (!meter) return;
  meter.subMeters.push(makeSubMeter(`সাব-মিটার ${meter.subMeters.length + 1}`));
  elecSave();
  renderSubMeters();
  elecAutoSyncBills(true);
};

window.elecRemoveSubMeter = function(idx) {
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx]; if (!meter) return;
  if (!confirm('এই সাব-মিটার মুছে ফেলবেন?')) return;
  meter.subMeters.splice(idx, 1);
  elecSave();
  renderSubMeters();
  elecAutoSyncBills(true);
};

window.elecUpdateSubName = function(idx, val) {
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx]; if (!meter) return;
  meter.subMeters[idx].name = val;
  elecSave();
};

window.elecLinkRoom = function(idx, roomId) {
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx]; if (!meter) return;
  meter.subMeters[idx].linkedRoomId = roomId;
  elecSave();
  renderElecResults(meter);
  elecAutoSyncBills(true);
};

window.elecUpdateReading = function(idx, type, val, inputEl) {
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx];
  if (!meter || !meter.subMeters || !meter.subMeters[idx]) return;

  const sm = meter.subMeters[idx];
  const numVal = val === '' ? 0 : tk(val);
  if (type === 'prev') sm.prevReading = numVal;
  else sm.currReading = numVal;

  // Dynamically update the row's "ব্যবহার" field without re-rendering the DOM
  const units = Math.max(0, tk(sm.currReading) - tk(sm.prevReading));
  const row = inputEl ? inputEl.closest('.submeter-row') : document.querySelector(`.submeter-row[data-sub-idx="${idx}"]`);
  if (row) {
    const unitsInput = row.querySelector('.submeter-units-val');
    if (unitsInput) unitsInput.value = `${units} unit`;
  }

  elecSave();
  renderElecResults(meter);
  elecAutoSyncBills(true);
};

/* Save main meter total bill when input changes */
document.addEventListener('change', e => {
  if (e.target.id !== 'elec-main-bill') return;
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx]; if (!meter) return;
  meter.totalBill = tk(e.target.value);
  elecSave();
  renderElecResults(meter);
  elecAutoSyncBills(true);
});
document.addEventListener('input', e => {
  if (e.target.id !== 'elec-main-bill') return;
  const meter = ELEC_STATE.mainMeters[ELEC_STATE.activeMeterIdx]; if (!meter) return;
  meter.totalBill = tk(e.target.value);
  renderElecResults(meter);
  elecAutoSyncBills(true);
});

/* Manual Push/Sync Button Handler */
window.elecPushBills = function() {
  elecAutoSyncBills(false);
};

/* ── Public: Called when entering electricity tab ───────────── */
window.initElecTab = renderElecPanel;
