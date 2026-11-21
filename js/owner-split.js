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
