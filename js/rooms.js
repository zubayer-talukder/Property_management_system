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
    const b = getBill(r, m);
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
        ? `<span class="pill pill-paid"><i class="fa-solid fa-check"></i> পরিশোধ</span>`
        : b.due > 0 && b.paid > 0
          ? `<span class="pill pill-partial">আংশিক</span>`
          : b.advance > 0
            ? `<span class="pill pill-paid" style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0"><i class="fa-solid fa-plus"></i> অগ্রিম</span>`
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
                : `<div class="tenant-table-avatar" style="display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,0.15);font-size:0.85rem"><i class="fa-solid fa-user" style="color:var(--accent-light)"></i></div>`
              }
              <div>
                <div class="tenant-name">${r.tenant.name}</div>
                <div style="font-size:0.7rem;color:var(--text-muted)">${r.tenant.phone}</div>
              </div>
            </div>`}
      </td>
      <td class="amount total">
        ${isVacant ? '-' : fmt(b.total)}
        ${!isVacant && tk(b.electricity) > 0 ? `<div style="font-size:0.72rem;color:var(--amber);font-weight:600" title="বিদ্যুৎ বিল"><i class="fa-solid fa-bolt"></i> ${fmt(b.electricity)}</div>` : ''}
        ${!isVacant && tk(b.prevBalance) > 0 ? `<div style="font-size:0.7rem;color:var(--red);font-weight:700" title="পূর্বের বকেয়া যোগ হয়েছে"><i class="fa-solid fa-clock-rotate-left"></i> +${fmt(b.prevBalance)} বকেয়া</div>` : ''}
        ${!isVacant && tk(b.prevBalance) < 0 ? `<div style="font-size:0.7rem;color:var(--green);font-weight:700" title="পূর্বের অতিরিক্ত জমা বাদ হয়েছে"><i class="fa-solid fa-hand-holding-dollar"></i> -${fmt(Math.abs(b.prevBalance))} সমন্বয়</div>` : ''}
      </td>
      <td class="amount paid">${isVacant ? '-' : fmt(b.paid)}</td>
      <td class="amount due">
        ${isVacant ? '-' : b.due > 0 ? fmt(b.due) : b.advance > 0 ? `<span style="color:var(--green);font-size:0.78rem;font-weight:700" title="পরবর্তী মাসে সমন্বয় হবে">+${fmt(b.advance)} অগ্রিম</span>` : '৳০'}
      </td>
      <td>${statusPill}</td>
      <td>${b.paidDate ? `<span style="font-size:0.75rem">${b.paidDate}</span>` : '-'}</td>
      <td>
        <div style="display:flex;gap:0.35rem;flex-wrap:wrap">
          <button class="btn btn-warning btn-sm" onclick="openRoomModal('${r.id}')"><i class="fa-solid fa-gear"></i> রুম</button>
          ${!isVacant ? `<button class="btn btn-secondary btn-sm" onclick="openBillModal('${r.id}')"><i class="fa-solid fa-coins"></i> বিল</button>` : ''}
          ${!isVacant ? `<button class="btn btn-secondary btn-sm" onclick="openTenantModal('${r.id}','view')"><i class="fa-solid fa-user"></i> KYC</button>` : ''}
          ${!isVacant ? `<button class="btn btn-primary btn-sm" onclick="openReceiptModal('${r.id}')" title="মানি রিসিট"><i class="fa-solid fa-receipt"></i> রিসিট</button>` : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteRoom('${r.id}')" title="Delete Room"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── Bill helpers & Ledger Balance Engine ───────────────────── */
function getPreviousEndingBalance(room, month) {
  if (!room || !room.bills) return 0;
  const pm = prevMonth(month);
  const prevBill = room.bills[pm];
  if (!prevBill) return 0;
  const curTot = tk(prevBill.currentTotal) || (tk(prevBill.rent) + tk(prevBill.electricity) + tk(prevBill.water) + tk(prevBill.gas) + tk(prevBill.wifi) + tk(prevBill.other));
  const prevBal = parseFloat(prevBill.prevBalance) || 0;
  const paid = tk(prevBill.paid);
  // Net ending balance: positive means tenant owes money (due), negative means tenant overpaid (advance credit)
  return (curTot + prevBal) - paid;
}

function syncRoomBillsForward(room, fromMonth) {
  if (!room || !room.bills) return;
  const months = Object.keys(room.bills).sort();
  const startIdx = months.indexOf(fromMonth);
  if (startIdx === -1) return;

  for (let i = startIdx + 1; i < months.length; i++) {
    const m = months[i];
    const prevM = months[i - 1];
    if (prevMonth(m) === prevM) {
      const b = room.bills[m];
      if (b && !b.manualPrevBalance) {
        b.prevBalance = getPreviousEndingBalance(room, m);
        recalcBill(b);
      }
    }
  }
}

function getBill(room, month) {
  if (!room.bills[month]) {
    room.bills[month] = makeBill(room, month);
    save();
  } else {
    const b = room.bills[month];
    if (room.tenant && !b.tenant) b.tenant = room.tenant.name;
    // Auto-update previous balance if not manually pinned
    if (!b.manualPrevBalance) {
      const autoPrev = getPreviousEndingBalance(room, month);
      if (parseFloat(b.prevBalance || 0) !== autoPrev) {
        b.prevBalance = autoPrev;
        recalcBill(b);
        save();
      }
    }
  }
  return room.bills[month];
}

function makeBill(room, month) {
  const pm = prevMonth(month);
  const prev = room.bills[pm];
  const prevBalance = getPreviousEndingBalance(room, month);

  if (prev) {
    return recalcBill({
      month,
      tenant: room.tenant?.name || '',
      rent: tk(prev.rent),
      electricity: 0,
      water: tk(prev.water),
      gas: tk(prev.gas),
      wifi: tk(prev.wifi),
      other: tk(prev.other),
      prevBalance: prevBalance,
      currentTotal: 0,
      total: 0,
      paid: 0,
      due: 0,
      advance: 0,
      paidDate: '',
      comment: prevBalance > 0 ? `পূর্বের বকেয়া ৳${prevBalance.toLocaleString('en-IN')} যুক্ত হয়েছে` : prevBalance < 0 ? `পূর্বের অতিরিক্ত জমা ৳${Math.abs(prevBalance).toLocaleString('en-IN')} সমন্বয় হয়েছে` : ''
    });
  }
  return recalcBill({
    month,
    tenant: room.tenant?.name || '',
    rent: tk(room.baseRent),
    electricity: 0,
    water: tk(room.waterBill),
    gas: tk(room.gasBill),
    wifi: tk(room.wifiBill),
    other: tk(room.otherBill),
    prevBalance: prevBalance,
    currentTotal: 0,
    total: 0,
    paid: 0,
    due: 0,
    advance: 0,
    paidDate: '',
    comment: ''
  });
}

function recalcBill(b) {
  b.currentTotal = tk(b.rent) + tk(b.electricity) + tk(b.water) + tk(b.gas) + tk(b.wifi) + tk(b.other);
  const pb = parseFloat(b.prevBalance) || 0;
  b.prevBalance = pb;
  b.total = Math.max(0, b.currentTotal + pb);
  const paid = tk(b.paid);
  b.due = Math.max(0, b.total - paid);
  b.advance = Math.max(0, paid - b.total);
  return b;
}

/* Auto-generate bills for all rooms in active month */
el('btn-auto-generate').addEventListener('click', () => {
  const p = getActiveProperty();
  if (!p) {
    toast('কোনো প্রপার্টি সিলেক্ট করা নেই।', 'warn');
    return;
  }
  if (!p.rooms || p.rooms.length === 0) {
    toast('কোনো রুম নেই! প্রথমে "+ রুম যুক্ত করুন" বাটনে ক্লিক করে রুম তৈরি করুন।', 'warn');
    return;
  }
  const m = STATE.activeMonth;
  const occupiedRooms = p.rooms.filter(r => r.tenant);

  if (occupiedRooms.length === 0) {
    toast('কোনো রুমে ভাড়াটিয়া যুক্ত করা নেই! বিল তৈরির জন্য আগে রুমে ভাড়াটিয়া যুক্ত করুন।', 'warn');
    return;
  }

  let count = 0;
  occupiedRooms.forEach(r => {
    let b = r.bills[m];
    const prev = r.bills[prevMonth(m)];

    if (!b) {
      b = makeBill(r, m);
      r.bills[m] = b;
    } else {
      b.tenant = r.tenant?.name || b.tenant || '';
      if (!b.manualPrevBalance) {
        b.prevBalance = getPreviousEndingBalance(r, m);
      }
      if (tk(b.rent) === 0) {
        b.rent = prev ? tk(prev.rent) : tk(r.baseRent);
      }
      if (tk(b.water) === 0) {
        b.water = prev ? tk(prev.water) : tk(r.waterBill);
      }
      if (tk(b.gas) === 0) {
        b.gas = prev ? tk(prev.gas) : tk(r.gasBill);
      }
      if (tk(b.wifi) === 0) {
        b.wifi = prev ? tk(prev.wifi) : tk(r.wifiBill);
      }
      if (tk(b.other) === 0) {
        b.other = prev ? tk(prev.other) : tk(r.otherBill);
      }
      recalcBill(b);
    }
    count++;
  });

  // Sync electricity bills from sub-meters
  if (typeof window.elecAutoSyncBills === 'function') {
    window.elecAutoSyncBills(true);
  }

  save();
  renderDetailPage();
  toast(`${monthLabel(m)} এর জন্য ${count}টি রুমের বিল প্রস্তুত হয়েছে!`, 'success');
});

/* ── Add Room ───────────────────────────────────────────────── */
el('btn-add-room').addEventListener('click', () => {
  if (!isLoggedIn()) { triggerGoogleLogin(); return; }
  const p = getActiveProperty(); if (!p) return;
  el('room-modal-title').innerHTML = '<i class="fa-solid fa-door-open"></i> নতুন রুম যুক্ত করুন';
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
    toast('রুম যুক্ত হয়েছে!', 'success');
  }
  save(); closeModal('modal-room'); renderDetailPage();
});

window.openRoomModal = function(rid) {
  const p = getActiveProperty(); if (!p) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  el('room-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> রুম আপডেট করুন';
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
  el('bill-prev-balance').value = b.prevBalance !== undefined ? b.prevBalance : getPreviousEndingBalance(room, STATE.activeMonth);
  el('bill-paid').value       = b.paid;
  el('bill-paid-date').value  = b.paidDate;
  el('bill-comment').value    = b.comment;
  el('form-bill').dataset.roomId = rid;
  updateBillTotalsUI(b);
  openModal('modal-bill');
};

function updateBillTotalsUI(b) {
  const currentTotal = tk(b.rent) + tk(b.electricity) + tk(b.water) + tk(b.gas) + tk(b.wifi) + tk(b.other);
  const pb = parseFloat(b.prevBalance) || 0;
  const total = Math.max(0, currentTotal + pb);
  const paid = tk(b.paid);
  const due = Math.max(0, total - paid);
  const advance = Math.max(0, paid - total);

  if (el('bill-current-total-display')) {
    el('bill-current-total-display').textContent = fmt(currentTotal);
  }
  el('bill-total-display').textContent = fmt(total);

  if (due > 0) {
    el('bill-due-display').textContent = fmt(due);
    el('bill-due-display').style.color = 'var(--red)';
    if (el('bill-due-label')) el('bill-due-label').textContent = 'বকেয়া (Due)';
  } else if (advance > 0) {
    el('bill-due-display').textContent = fmt(advance);
    el('bill-due-display').style.color = 'var(--green)';
    if (el('bill-due-label')) el('bill-due-label').textContent = 'অতিরিক্ত জমা (Advance)';
  } else {
    el('bill-due-display').textContent = '৳০';
    el('bill-due-display').style.color = 'var(--text-primary)';
    if (el('bill-due-label')) el('bill-due-label').textContent = 'পরিশোধিত (Paid)';
  }

  // Helper Hint Text
  if (el('bill-prev-balance-hint')) {
    if (pb > 0) {
      el('bill-prev-balance-hint').innerHTML = `<span style="color:var(--red);font-weight:600"><i class="fa-solid fa-clock-rotate-left"></i> গত মাসের বকেয়া ৳${pb.toLocaleString('en-IN')} বিলের সাথে যোগ হয়েছে।</span>`;
    } else if (pb < 0) {
      el('bill-prev-balance-hint').innerHTML = `<span style="color:var(--green);font-weight:600"><i class="fa-solid fa-hand-holding-dollar"></i> গত মাসের অতিরিক্ত জমা ৳${Math.abs(pb).toLocaleString('en-IN')} বিল থেকে বাদ (সমন্বয়) হয়েছে।</span>`;
    } else {
      el('bill-prev-balance-hint').textContent = 'বকেয়া হলে (+) এবং অগ্রিম সমন্বয় হলে (-) স্বয়ংক্রিয়ভাবে হিসাব হয়।';
    }
  }
}

['bill-rent','bill-electricity','bill-water','bill-gas','bill-wifi','bill-other','bill-prev-balance','bill-paid'].forEach(id => {
  el(id)?.addEventListener('input', () => {
    const b = {
      rent: tk(el('bill-rent').value), electricity: tk(el('bill-electricity').value),
      water: tk(el('bill-water').value), gas: tk(el('bill-gas').value),
      wifi: tk(el('bill-wifi').value), other: tk(el('bill-other').value),
      prevBalance: parseFloat(el('bill-prev-balance')?.value) || 0,
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

  const enteredPrev = parseFloat(el('bill-prev-balance').value) || 0;
  const autoPrev = getPreviousEndingBalance(room, STATE.activeMonth);
  if (enteredPrev !== autoPrev) {
    b.manualPrevBalance = true;
  } else {
    delete b.manualPrevBalance;
  }
  b.prevBalance = enteredPrev;

  b.paid        = tk(el('bill-paid').value);
  b.paidDate    = el('bill-paid-date').value;
  b.comment     = el('bill-comment').value;
  recalcBill(b);

  // Sync subsequent months forward so November changes immediately reflect in December, January, etc.
  syncRoomBillsForward(room, STATE.activeMonth);

  save(); closeModal('modal-bill'); renderDetailPage();
  toast('বিল আপডেট হয়েছে!', 'success');
});
