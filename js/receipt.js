/* ── WhatsApp Sharing & Money Receipt ───────────────────────── */
function shareBillWhatsApp(room, bill, prop) {
  if (!room.tenant?.phone) { toast('ভাড়াটিয়ার ফোন নম্বর নেই।', 'warn'); return; }
  const cleanPhone = room.tenant.phone.replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? '88' + cleanPhone : '880' + cleanPhone;
  const msg = `*বাড়ি ভাড়া ও ইউটিলিটি বিল — ${monthLabel(bill.month)}*
*${prop.name}* (রুম নং: *${room.number}*)
ভাড়াটিয়া: *${room.tenant.name}*
--------------------------------
• মূল ভাড়া: ৳${tk(bill.rent).toLocaleString('en-IN')}
• বিদ্যুৎ বিল: ৳${tk(bill.electricity).toLocaleString('en-IN')}
• পানি / গ্যাস / ওয়াইফাই: ৳${(tk(bill.water)+tk(bill.gas)+tk(bill.wifi)).toLocaleString('en-IN')}
${tk(bill.other) > 0 ? `• অন্যান্য চার্জ: ৳${tk(bill.other).toLocaleString('en-IN')}\n` : ''}${tk(bill.prevBalance) > 0 ? `• পূর্বের বকেয়া: +৳${tk(bill.prevBalance).toLocaleString('en-IN')}\n` : ''}${tk(bill.prevBalance) < 0 ? `• পূর্বের অতিরিক্ত জমা সমন্বয়: -৳${Math.abs(tk(bill.prevBalance)).toLocaleString('en-IN')}\n` : ''}--------------------------------
*সর্বমোট বিল: ৳${tk(bill.total).toLocaleString('en-IN')}*
পরিশোধিত: ৳${tk(bill.paid).toLocaleString('en-IN')}
${tk(bill.due) > 0 ? `*বকেয়া: ৳${tk(bill.due).toLocaleString('en-IN')}*\n` : ''}${tk(bill.advance) > 0 ? `*অতিরিক্ত জমা (পরবর্তী মাসে সমন্বয় হবে): ৳${tk(bill.advance).toLocaleString('en-IN')}*\n` : ''}${bill.comment ? `নোট: ${bill.comment}\n` : ''}--------------------------------
ধন্যবাদ!`;
  const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/* ── Bengali Number to Words Converter ───────────────────────── */
function numberToBengaliWords(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return 'শূন্য টাকা মাত্র';
  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
    'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'ঊনিশ', 'বিশ',
    'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ', 'ত্রিশ',
    'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
    'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
    'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
    'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
    'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
    'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
    'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];

  let remaining = Math.round(amount);
  let words = '';

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundred = Math.floor(remaining / 100);
  const remainder = Math.floor(remaining % 100);

  if (crore > 0) words += units[crore] + ' কোটি ';
  if (lakh > 0) words += units[lakh] + ' লক্ষ ';
  if (thousand > 0) words += units[thousand] + ' হাজার ';
  if (hundred > 0) words += units[hundred] + ' শত ';
  if (remainder > 0) words += units[remainder] + ' ';

  return (words.trim() || 'শূন্য') + ' টাকা মাত্র';
}

window.openReceiptModal = function(rid) {
  const p = getActiveProperty(); if (!p) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);

  // Generate a clean official voucher number
  const vMonth = (STATE.activeMonth || '').replace('-', '');
  const voucherNo = `REC-${vMonth || '2026'}-${room.number || '01'}`;
  if (el('receipt-voucher-no')) el('receipt-voucher-no').textContent = voucherNo;

  el('receipt-prop-name').textContent = p.name;
  el('receipt-prop-addr').textContent = p.address;
  el('receipt-month-display').textContent = monthLabel(STATE.activeMonth);

  el('receipt-tenant-name').textContent = room.tenant?.name || '—';
  el('receipt-tenant-phone').textContent = room.tenant?.phone || '—';
  el('receipt-room-no').textContent = room.number;
  el('receipt-date').textContent = b.paidDate || new Date().toISOString().split('T')[0];

  const pill = el('receipt-status-pill');
  if (b.due <= 0 && b.total > 0) {
    pill.className = 'pill pill-paid'; pill.innerHTML = '<i class="fa-solid fa-check"></i> পরিশোধিত (PAID)';
  } else if (b.paid > 0 && b.due > 0) {
    pill.className = 'pill pill-partial'; pill.textContent = 'আংশিক পরিশোধ (PARTIAL)';
  } else if (b.advance > 0) {
    pill.className = 'pill pill-paid'; pill.innerHTML = '<i class="fa-solid fa-plus"></i> অতিরিক্ত জমা (ADVANCE)';
  } else {
    pill.className = 'pill pill-due'; pill.textContent = 'বকেয়া (DUE)';
  }

  const items = [
    { name: 'মূল বাড়ি ভাড়া (Base Rent)', amt: b.rent },
    { name: 'বিদ্যুৎ বিল (Electricity Sub-Meter)', amt: b.electricity },
    { name: 'পানির বিল (Water Charge)', amt: b.water },
    { name: 'গ্যাস বিল (Gas Charge)', amt: b.gas },
    { name: 'ওয়াইফাই বিল (Internet)', amt: b.wifi },
    { name: 'অন্যান্য সার্ভিস চার্জ (Service / Misc)', amt: b.other }
  ].filter(item => item.amt > 0);

  if (tk(b.prevBalance) > 0) {
    items.push({ name: 'পূর্বের মাসের বকেয়া (Previous Month Due)', amt: b.prevBalance, isDue: true });
  } else if (tk(b.prevBalance) < 0) {
    items.push({ name: 'পূর্বের অতিরিক্ত জমা সমন্বয় (Advance Credit Adjustment)', amt: b.prevBalance, isCredit: true });
  }

  const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  const toBn = n => String(n).split('').map(d => bnDigits[d] || d).join('');

  el('receipt-breakdown-tbody').innerHTML = items.length ? items.map((item, idx) => `
    <tr>
      <td style="text-align:center;font-weight:700">${toBn(idx + 1)}</td>
      <td style="text-align:left">
        ${item.name}
        ${item.isDue ? ` <span style="font-size:0.75rem;color:var(--red);font-weight:700">(যোগ)</span>` : ''}
        ${item.isCredit ? ` <span style="font-size:0.75rem;color:var(--green);font-weight:700">(বাদ)</span>` : ''}
      </td>
      <td style="text-align:right;font-weight:700;${item.isCredit ? 'color:var(--green)' : ''}">
        ${item.amt < 0 ? '-' + fmt(Math.abs(item.amt)) : fmt(item.amt)}
      </td>
    </tr>
  `).join('') : `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:1rem">কোনো বিলের বিবরণ পাওয়া যায়নি</td></tr>`;

  el('receipt-total-amt').textContent = fmt(b.total);
  el('receipt-paid-amt').textContent = fmt(b.paid);

  if (b.due > 0) {
    el('receipt-due-row').style.display = '';
    if (el('receipt-due-label')) {
      el('receipt-due-label').textContent = 'বকেয়া টাকা (Due Balance):';
      el('receipt-due-label').style.color = 'var(--red)';
    }
    el('receipt-due-amt').textContent = fmt(b.due);
    el('receipt-due-amt').style.color = 'var(--red)';
  } else if (b.advance > 0) {
    el('receipt-due-row').style.display = '';
    if (el('receipt-due-label')) {
      el('receipt-due-label').textContent = 'অতিরিক্ত জমা (Advance Credit):';
      el('receipt-due-label').style.color = 'var(--green)';
    }
    el('receipt-due-amt').textContent = `+${fmt(b.advance)}`;
    el('receipt-due-amt').style.color = 'var(--green)';
  } else {
    el('receipt-due-row').style.display = 'none';
  }

  el('receipt-comment').textContent = b.comment || 'কোনো বিশেষ মন্তব্য নেই।';

  // In words (কথায়)
  const wordsTarget = b.paid > 0 ? b.paid : b.total;
  if (el('receipt-amount-words')) {
    let wordStr = numberToBengaliWords(wordsTarget);
    if (b.paid > 0 && b.due > 0) {
      wordStr += ` (পরিশোধিত, অবশিষ্ট বকেয়া ৳${(b.due || 0).toLocaleString('en-IN')})`;
    } else if (b.advance > 0) {
      wordStr += ` (পরিশোধিত, অতিরিক্ত জমা ৳${(b.advance || 0).toLocaleString('en-IN')})`;
    }
    el('receipt-amount-words').textContent = wordStr;
  }

  el('receipt-btn-whatsapp').onclick = () => shareBillWhatsApp(room, b, p);
  openModal('modal-receipt');
};

window.printReceipt = function() {
  const p = getActiveProperty();
  const roomNo = el('receipt-room-no')?.textContent || 'Room';
  const monthTxt = el('receipt-month-display')?.textContent || 'Month';

  // Set formatted document title so Chrome/Edge's "Save as PDF" creates a perfect filename
  const prevTitle = document.title;
  const safePropName = (p?.name || 'PMS').replace(/[\s\/\\:*?"<>|]+/g, '_');
  const safeRoom = String(roomNo).replace(/[\s\/\\:*?"<>|]+/g, '_');
  const safeMonth = String(monthTxt).replace(/[\s\/\\:*?"<>|]+/g, '_');
  document.title = `মানি_রিসিট_${safePropName}_রুম_${safeRoom}_${safeMonth}`;

  window.print();

  setTimeout(() => {
    document.title = prevTitle;
  }, 1000);
};

el('btn-print-receipt')?.addEventListener('click', () => {
  const rid = el('form-bill').dataset.roomId;
  if (!rid) return;
  closeModal('modal-bill');
  openReceiptModal(rid);
});

el('btn-whatsapp-bill')?.addEventListener('click', () => {
  const p = getActiveProperty(); if (!p) return;
  const rid = el('form-bill').dataset.roomId;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);
  shareBillWhatsApp(room, b, p);
});
