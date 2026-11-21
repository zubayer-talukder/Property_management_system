/* ── Landlord Summary Sheet (বাড়িওয়ালার মাসিক সামারি ও বকেয়া বিবরণী) ── */
window.openLandlordSummaryModal = function() {
  const p = getActiveProperty();
  if (!p) {
    toast('অনুগ্রহ করে একটি প্রপার্টি সিলেক্ট করুন', 'warn');
    return;
  }

  const activeMonth = STATE.activeMonth;
  const monthTxt = monthLabel(activeMonth);
  const now = new Date();
  const printDate = now.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) || now.toISOString().split('T')[0];

  if (el('lss-prop-name')) el('lss-prop-name').textContent = p.name;
  if (el('lss-prop-addr')) el('lss-prop-addr').textContent = p.address;
  if (el('lss-month-label')) el('lss-month-label').textContent = monthTxt;
  if (el('lss-print-date')) el('lss-print-date').textContent = printDate;
  if (el('lss-meta-rooms')) el('lss-meta-rooms').textContent = `${p.rooms.length}টি রুম`;

  let sumRent = 0;
  let sumUtil = 0;
  let sumPrev = 0;
  let sumTotal = 0;
  let sumPaid = 0;
  let sumDue = 0;
  let sumAdvance = 0;
  let dueRoomsCount = 0;
  const duesList = [];

  const rowsHtml = p.rooms.map(room => {
    const isVacant = !room.tenant?.name;
    const b = getBill(room, activeMonth);

    const baseRent = tk(b.rent);
    const util = tk(b.electricity) + tk(b.water) + tk(b.gas) + tk(b.wifi) + tk(b.other);
    const prev = tk(b.prevBalance);
    const total = tk(b.total);
    const paid = tk(b.paid);
    const due = tk(b.due);
    const advance = tk(b.advance);

    sumRent += baseRent;
    sumUtil += util;
    sumPrev += prev;
    sumTotal += total;
    sumPaid += paid;
    sumDue += due;
    sumAdvance += advance;

    if (due > 0 && !isVacant) {
      dueRoomsCount++;
      duesList.push({
        room: room.number,
        tenant: room.tenant.name,
        phone: room.tenant.phone || '',
        due: due,
        total: total,
        paid: paid
      });
    }

    let statusPill = '';
    if (isVacant) {
      statusPill = '<span class="lss-pill lss-pill-vacant">খালি</span>';
    } else if (due <= 0 && total > 0) {
      statusPill = '<span class="lss-pill lss-pill-paid">পরিশোধিত</span>';
    } else if (paid > 0 && due > 0) {
      statusPill = '<span class="lss-pill lss-pill-partial">আংশিক</span>';
    } else if (advance > 0) {
      statusPill = '<span class="lss-pill lss-pill-paid">অগ্রিম</span>';
    } else {
      statusPill = '<span class="lss-pill lss-pill-due">বকেয়া</span>';
    }

    return `
      <tr class="${due > 0 ? 'lss-row-has-due' : ''}">
        <td style="font-weight:800;text-align:center">রুম ${room.number}</td>
        <td>
          <div style="font-weight:700;color:#0f172a">${isVacant ? '<span style="color:#64748b;font-style:italic">খালি (Vacant)</span>' : room.tenant.name}</div>
          ${!isVacant && room.tenant.phone ? `<div style="font-size:0.75rem;color:#64748b"><i class="fa-solid fa-phone" style="font-size:0.65rem"></i> ${room.tenant.phone}</div>` : ''}
        </td>
        <td style="text-align:right">${fmt(baseRent)}</td>
        <td style="text-align:right">${util > 0 ? fmt(util) : '—'}</td>
        <td style="text-align:right;${prev > 0 ? 'color:var(--red);font-weight:700' : (prev < 0 ? 'color:var(--green);font-weight:700' : '')}">
          ${prev > 0 ? `+${fmt(prev)}` : (prev < 0 ? `-${fmt(Math.abs(prev))}` : '০')}
        </td>
        <td style="text-align:right;font-weight:800">${fmt(total)}</td>
        <td style="text-align:right;color:var(--green);font-weight:700">${fmt(paid)}</td>
        <td style="text-align:right;${due > 0 ? 'background:#fff1f2;color:#dc2626;font-weight:900;border:1px solid #fecdd3' : 'color:#059669;font-weight:700'}">
          ${due > 0 ? `৳ ${due.toLocaleString('en-IN')}` : '০'}
        </td>
        <td style="text-align:center">${statusPill}</td>
      </tr>
    `;
  }).join('');

  if (el('lss-tbody')) el('lss-tbody').innerHTML = rowsHtml;

  // Set KPIs
  if (el('lss-kpi-expected')) el('lss-kpi-expected').textContent = fmt(sumTotal);
  if (el('lss-kpi-collected')) el('lss-kpi-collected').textContent = fmt(sumPaid);
  const colRate = sumTotal > 0 ? Math.min(100, Math.round((sumPaid / sumTotal) * 100)) : 0;
  if (el('lss-kpi-rate')) el('lss-kpi-rate').textContent = `আদায়ের হার: ${colRate}%`;

  if (el('lss-kpi-due')) el('lss-kpi-due').textContent = fmt(sumDue);
  if (el('lss-kpi-due-count')) el('lss-kpi-due-count').textContent = `${dueRoomsCount}টি রুমে বকেয়া বাকি`;
  if (el('lss-kpi-advance')) el('lss-kpi-advance').textContent = fmt(sumAdvance);

  // Set Footer Totals
  if (el('lss-foot-rent')) el('lss-foot-rent').textContent = fmt(sumRent);
  if (el('lss-foot-util')) el('lss-foot-util').textContent = fmt(sumUtil);
  if (el('lss-foot-prev')) el('lss-foot-prev').textContent = sumPrev >= 0 ? fmt(sumPrev) : `-${fmt(Math.abs(sumPrev))}`;
  if (el('lss-foot-total')) el('lss-foot-total').textContent = fmt(sumTotal);
  if (el('lss-foot-paid')) el('lss-foot-paid').textContent = fmt(sumPaid);
  if (el('lss-foot-due')) el('lss-foot-due').textContent = fmt(sumDue);
  if (el('lss-foot-badge')) el('lss-foot-badge').innerHTML = sumDue === 0 ? '<span class="lss-pill lss-pill-paid">সব আদায়</span>' : `<span class="lss-pill lss-pill-due">${dueRoomsCount} রুমে বকেয়া</span>`;

  // Dues Callout Section
  const duesBox = el('lss-dues-callout');
  const duesListEl = el('lss-dues-list');
  if (duesBox && duesListEl) {
    if (duesList.length > 0) {
      duesBox.style.display = 'block';
      duesListEl.innerHTML = duesList.map(item => `
        <div class="dues-item-chip">
          <span class="chip-room">রুম ${item.room}:</span>
          <span class="chip-name">${item.tenant}</span>
          ${item.phone ? `<span class="chip-phone">(${item.phone})</span>` : ''}
          <span class="chip-amount">বকেয়া: ৳ ${item.due.toLocaleString('en-IN')}</span>
        </div>
      `).join('');
    } else {
      duesBox.style.display = 'none';
    }
  }

  openModal('modal-landlord-summary');
};

window.printLandlordSummary = function() {
  const p = getActiveProperty();
  const monthTxt = el('lss-month-label')?.textContent || STATE.activeMonth || 'Month';

  const prevTitle = document.title;
  const safePropName = (p?.name || 'PMS').replace(/[\s\/\\:*?"<>|]+/g, '_');
  const safeMonth = String(monthTxt).replace(/[\s\/\\:*?"<>|]+/g, '_');
  document.title = `বাড়িওয়ালার_মাসিক_সামারি_${safePropName}_${safeMonth}`;

  window.print();

  setTimeout(() => {
    document.title = prevTitle;
  }, 1000);
};

window.copyLandlordSummaryForWA = function() {
  const p = getActiveProperty(); if (!p) return;
  const monthTxt = el('lss-month-label')?.textContent || STATE.activeMonth;
  const expected = el('lss-kpi-expected')?.textContent || '০';
  const collected = el('lss-kpi-collected')?.textContent || '০';
  const due = el('lss-kpi-due')?.textContent || '০';
  const dueCount = el('lss-kpi-due-count')?.textContent || '';

  let text = `🏢 *${p.name} — মাসিক ভাড়া ও বকেয়া রিপোর্ট*\n`;
  text += `📍 ঠিকানা: ${p.address}\n`;
  text += `📅 মাস: ${monthTxt}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 মোট পাওনা: ${expected}\n`;
  text += `✅ মোট আদায়: ${collected}\n`;
  text += `⚠️ *সর্বমোট বকেয়া: ${due}* (${dueCount})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📌 *রুমভিত্তিক বকেয়ার তালিকা:*\n`;

  let hasDues = false;
  p.rooms.forEach(r => {
    if (!r.tenant?.name) return;
    const b = getBill(r, STATE.activeMonth);
    if (b.due > 0) {
      hasDues = true;
      text += `• রুম ${r.number} (${r.tenant.name}): ৳ ${b.due.toLocaleString('en-IN')} বাকি\n`;
    }
  });

  if (!hasDues) {
    text += `🎉 সকল রুমের ভাড়া সম্পূর্ণ পরিশোধিত!\n`;
  }

  navigator.clipboard.writeText(text).then(() => {
    toast('হোয়াটসঅ্যাপ সামারি টেক্সট কপি হয়েছে!', 'success');
  }).catch(() => {
    toast('কপি করা সম্ভব হয়নি', 'error');
  });
};
