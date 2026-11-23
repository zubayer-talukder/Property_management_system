/* ── Multi-Gateway & Dynamic QR Configuration ─────────────── */
const PAYMENT_GATEWAYS = {
  bkash: {
    id: 'bkash',
    name: 'বিকাশ (bKash)',
    badgeTitle: 'বিকাশ বাংলা QR পেমেন্ট',
    label: 'বিকাশ পার্সোনাল নম্বর:',
    shortName: 'বিকাশ',
    number: '01521752871',
    accName: 'ABDULLAH ZUBAYER TALUKDER',
    defaultQr: 'assets/bkash-qr-matrix.png',
    themeColor: '#e11d48',
    type: 'সেন্ড মানি (Send Money)',
    sublabel: '01521752871 (সেন্ড মানি)'
  },
  cellfin: {
    id: 'cellfin',
    name: 'CellFin (ইসলামী ব্যাংক)',
    badgeTitle: 'CellFin বাংলা QR (মোবাইল একাউন্ট)',
    label: 'সেলফিন / মোবাইল নম্বর:',
    shortName: 'CellFin',
    number: '01533958357',
    accName: 'ABDULLAH ZUBAYER TALUKDER',
    defaultQr: 'assets/cellfin-qr-matrix.png',
    themeColor: '#047857',
    type: 'সেন্ড মানি (Send Money)',
    sublabel: '01533958357 (CellFin)'
  },
  bank: {
    id: 'bank',
    name: 'ইসলামী ব্যাংক (Bank Transfer)',
    badgeTitle: 'ইসলামী ব্যাংক বাংলা QR (Bank A/C)',
    label: 'ব্যাংক হিসাব নম্বর (A/C No):',
    shortName: 'ব্যাংক একাউন্ট',
    number: '20507776702350919',
    accName: 'ABDULLAH ZUBAYER TALUKDER',
    bankName: 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি',
    defaultQr: 'assets/bank-qr-matrix.png',
    themeColor: '#0284c7',
    type: 'ব্যাংক একাউন্ট ট্রান্সফার',
    sublabel: '20507776702350919 (A/C No)'
  }
};

window.activeSlipGateway = 'bkash';

function getBillPaymentConfig(b) {
  let gwKey = 'bkash';
  if (b && (b.paymentGateway === 'cellfin' || b.paymentGateway === 'bank')) {
    gwKey = b.paymentGateway;
  }
  const gw = PAYMENT_GATEWAYS[gwKey] || PAYMENT_GATEWAYS.bkash;
  const qrSrc = (b && b.customQr) ? b.customQr : gw.defaultQr;
  const isCustom = Boolean(b && b.customQr);
  return { gw, qrSrc, isCustom, gwKey };
}

// Compress and Auto-Crop uploaded custom QR (even from full-screen mobile screenshots)
window.compressQrImageFile = function(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const origW = img.width;
      const origH = img.height;

      // Intelligent QR detection and Auto-Crop if jsQR is loaded
      if (typeof window.jsQR === 'function') {
        try {
          const maxScanDim = 1200;
          let scanW = origW;
          let scanH = origH;
          if (scanW > maxScanDim || scanH > maxScanDim) {
            if (scanW > scanH) {
              scanH = Math.round((scanH * maxScanDim) / scanW);
              scanW = maxScanDim;
            } else {
              scanW = Math.round((scanW * maxScanDim) / scanH);
              scanH = maxScanDim;
            }
          }

          const scanCanvas = document.createElement('canvas');
          scanCanvas.width = scanW;
          scanCanvas.height = scanH;
          const scanCtx = scanCanvas.getContext('2d');
          scanCtx.drawImage(img, 0, 0, scanW, scanH);
          const imgData = scanCtx.getImageData(0, 0, scanW, scanH);

          const qrCode = window.jsQR(imgData.data, scanW, scanH, {
            inversionAttempts: 'attemptBoth'
          });

          if (qrCode && qrCode.location) {
            const scaleX = origW / scanW;
            const scaleY = origH / scanH;

            const pts = [
              qrCode.location.topLeftCorner,
              qrCode.location.topRightCorner,
              qrCode.location.bottomRightCorner,
              qrCode.location.bottomLeftCorner
            ];

            const minX = Math.min(...pts.map(p => p.x)) * scaleX;
            const maxX = Math.max(...pts.map(p => p.x)) * scaleX;
            const minY = Math.min(...pts.map(p => p.y)) * scaleY;
            const maxY = Math.max(...pts.map(p => p.y)) * scaleY;

            const qrW = maxX - minX;
            const qrH = maxY - minY;

            // Safe Quiet Zone padding (10% standard margin around the QR code matrix)
            const pad = Math.round(Math.max(qrW, qrH) * 0.10);

            const cropX = Math.max(0, Math.floor(minX - pad));
            const cropY = Math.max(0, Math.floor(minY - pad));
            const cropW = Math.min(origW - cropX, Math.ceil(qrW + pad * 2));
            const cropH = Math.min(origH - cropY, Math.ceil(qrH + pad * 2));

            // Render into a pristine 540x540 high-contrast square canvas
            const outCanvas = document.createElement('canvas');
            outCanvas.width = 540;
            outCanvas.height = 540;
            const outCtx = outCanvas.getContext('2d', { willReadFrequently: false });
            outCtx.fillStyle = '#ffffff';
            outCtx.fillRect(0, 0, 540, 540);
            outCtx.imageSmoothingEnabled = true;
            outCtx.imageSmoothingQuality = 'high';

            const innerPad = 16;
            outCtx.drawImage(img, cropX, cropY, cropW, cropH, innerPad, innerPad, 540 - innerPad * 2, 540 - innerPad * 2);

            const dataUrl = outCanvas.toDataURL('image/jpeg', 0.92);

            // Check if amount is inside Tag 54 of EMVCo Bangla QR payload
            let detectedAmt = '';
            if (qrCode.data) {
              const amtMatch = qrCode.data.match(/54(\d{2})([0-9.]+)/);
              if (amtMatch) {
                const len = parseInt(amtMatch[1], 10);
                detectedAmt = amtMatch[2].slice(0, len);
              }
            }

            if (typeof toast === 'function') {
              if (detectedAmt) {
                toast(`✓ স্ক্রিনশট থেকে কিউআর ক্রপ করা হয়েছে (টাকার পরিমাণ: ৳${detectedAmt})!`, 'success');
              } else {
                toast('✓ স্ক্রিনশট থেকে কিউআর কোড স্বয়ংক্রিয়ভাবে ক্রপ ও জুম করা হয়েছে!', 'success');
              }
            }
            callback(dataUrl);
            return;
          }
        } catch (err) {
          console.warn('Auto-crop QR error, falling back to standard fit:', err);
        }
      }

      // Fallback: draw centered with proper aspect ratio onto a square canvas so it never stretches
      const outCanvas = document.createElement('canvas');
      const targetSize = 520;
      outCanvas.width = targetSize;
      outCanvas.height = targetSize;
      const outCtx = outCanvas.getContext('2d');
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, targetSize, targetSize);

      let drawW, drawH;
      if (origW > origH) {
        drawW = targetSize;
        drawH = Math.round((origH * targetSize) / origW);
      } else {
        drawH = targetSize;
        drawW = Math.round((origW * targetSize) / origH);
      }
      const offX = Math.round((targetSize - drawW) / 2);
      const offY = Math.round((targetSize - drawH) / 2);

      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = 'high';
      outCtx.drawImage(img, offX, offY, drawW, drawH);

      const dataUrl = outCanvas.toDataURL('image/jpeg', 0.90);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

/* ── WhatsApp Sharing & Clipboard Image Copying ───────────────────────── */
async function copyActiveQrImageToClipboard(customSrc) {
  if (!navigator.clipboard || !window.ClipboardItem) return false;
  try {
    const imgEl = el('ps-qr-image') || el('receipt-qr-img');
    const src = customSrc || imgEl?.src;
    if (!src) return false;

    let pngBlob = null;
    // 1. If DOM image is rendered and loaded, capture directly
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0 && (!customSrc || imgEl.src === customSrc || customSrc.startsWith('data:'))) {
      const canvas = document.createElement('canvas');
      canvas.width = imgEl.naturalWidth || 450;
      canvas.height = imgEl.naturalHeight || 450;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    } else {
      // 2. Otherwise load image from src
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 450;
      canvas.height = img.height || 450;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    }

    if (!pngBlob) return false;

    // Must be called while window/document is focused
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob })
    ]);
    return true;
  } catch (err) {
    console.warn('copyActiveQrImageToClipboard error:', err);
    return false;
  }
}

window.copyCurrentQrImage = async function() {
  const p = getActiveProperty();
  const rid = STATE.activeReceiptRoomId;
  const room = p?.rooms?.find(r => r.id === rid);
  const b = room ? getBill(room, STATE.activeMonth) : null;
  const { qrSrc } = getBillPaymentConfig(b);

  const ok = await copyActiveQrImageToClipboard(qrSrc);
  if (ok) {
    toast('✓ QR ছবি সফলভাবে কপি হয়েছে! যেকোনো চ্যাটে Ctrl+V চেপে পেস্ট করুন।', 'success', 4000);
  } else {
    toast('ছবি কপি করা যায়নি। "QR ছবি সেভ" দিয়ে ডাউনলোড করে নিন।', 'warn');
  }
};

async function shareBillWhatsApp(room, bill, prop) {
  if (!room.tenant?.phone) { toast('ভাড়াটিয়ার ফোন নম্বর নেই।', 'warn'); return; }
  const cleanPhone = room.tenant.phone.replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? '88' + cleanPhone : '880' + cleanPhone;
  const payableAmt = tk(bill.due) > 0 ? tk(bill.due) : (tk(bill.paid) === 0 ? tk(bill.total) : 0);
  const { gw, qrSrc, isCustom } = getBillPaymentConfig(bill);
  const isEn = window.currentLang === 'en';

  let payMsg = '';
  if (payableAmt > 0) {
    if (isEn) {
      const bankLine = gw.bankName ? `• Bank Name: *${gw.bankName}*\n` : '';
      payMsg = `--------------------------------
📲 *${gw.shortName} Payment (${gw.type}):*
• ${gw.label} *${gw.number}*
• Account Holder: *${gw.accName}*
${bankLine}• Payable Amount: *৳${payableAmt.toLocaleString('en-IN')}*
• Reference: *Room ${room.number}*
${isCustom ? `(A dynamic QR code for ৳${payableAmt.toLocaleString('en-IN')} is attached to this bill slip)\n` : `(You can scan the Bangla QR or send money directly)\n`}--------------------------------\n`;
    } else {
      const bankLine = gw.bankName ? `• ব্যাংক এর নাম: *${gw.bankName}*\n` : '';
      payMsg = `--------------------------------
📲 *${gw.shortName} পেমেন্ট (${gw.type}):*
• ${gw.label} *${gw.number}*
• হিসাবধারীর নাম: *${gw.accName}*
${bankLine}• প্রদেয় টাকার পরিমাণ: *৳${payableAmt.toLocaleString('en-IN')}*
• রেফারেন্স: *রুম ${room.number}*
${isCustom ? `(এই বিলের জন্য নির্দিষ্ট ৳${payableAmt.toLocaleString('en-IN')} টাকার ডায়নামিক QR কোড স্লিপে যুক্ত আছে, স্ক্যান করলেই টাকা সরাসরি বসে যাবে)\n` : `(বিকাশ, সেলফিন বা যেকোনো ব্যাংকের বাংলা QR স্ক্যান করেও পেমেন্ট করতে পারবেন)\n`}--------------------------------\n`;
    }
  }

  let msg = '';
  if (isEn) {
    msg = `*House Rent & Utility Bill — ${monthLabel(bill.month)}*
*${prop.name}* (Room No: *${room.number}*)
Tenant: *${room.tenant.name}*
--------------------------------
• Base Rent: ৳${tk(bill.rent).toLocaleString('en-IN')}
• Electricity Bill: ৳${tk(bill.electricity).toLocaleString('en-IN')}
• Water / Gas / WiFi: ৳${(tk(bill.water)+tk(bill.gas)+tk(bill.wifi)).toLocaleString('en-IN')}
${tk(bill.other) > 0 ? `• Other Service Charges: ৳${tk(bill.other).toLocaleString('en-IN')}\n` : ''}${tk(bill.prevBalance) > 0 ? `• Previous Due: +৳${tk(bill.prevBalance).toLocaleString('en-IN')}\n` : ''}${tk(bill.prevBalance) < 0 ? `• Advance Adjustment: -৳${Math.abs(tk(bill.prevBalance)).toLocaleString('en-IN')}\n` : ''}--------------------------------
*Total Bill: ৳${tk(bill.total).toLocaleString('en-IN')}*
Paid Amount: ৳${tk(bill.paid).toLocaleString('en-IN')}
${tk(bill.due) > 0 ? `*Due Amount: ৳${tk(bill.due).toLocaleString('en-IN')}*\n` : ''}${tk(bill.advance) > 0 ? `*Advance Credit (Adjusts next month): ৳${tk(bill.advance).toLocaleString('en-IN')}*\n` : ''}${bill.comment ? `Note: ${bill.comment}\n` : ''}${payMsg}Thank you!`;
  } else {
    msg = `*বাড়ি ভাড়া ও ইউটিলিটি বিল — ${monthLabel(bill.month)}*
*${prop.name}* (রুম নং: *${room.number}*)
ভাড়াটিয়া: *${room.tenant.name}*
--------------------------------
• মূল ভাড়া: ৳${tk(bill.rent).toLocaleString('en-IN')}
• বিদ্যুৎ বিল: ৳${tk(bill.electricity).toLocaleString('en-IN')}
• পানি / গ্যাস / ওয়াইফাই: ৳${(tk(bill.water)+tk(bill.gas)+tk(bill.wifi)).toLocaleString('en-IN')}
${tk(bill.other) > 0 ? `• অন্যান্য চার্জ: ৳${tk(bill.other).toLocaleString('en-IN')}\n` : ''}${tk(bill.prevBalance) > 0 ? `• পূর্বের বকেয়া: +৳${tk(bill.prevBalance).toLocaleString('en-IN')}\n` : ''}${tk(bill.prevBalance) < 0 ? `• পূর্বের অতিরিক্ত জমা সমন্বয়: -৳${Math.abs(tk(bill.prevBalance)).toLocaleString('en-IN')}\n` : ''}--------------------------------
*সর্বমোট বিল: ৳${tk(bill.total).toLocaleString('en-IN')}*
পরিশোধিত: ৳${tk(bill.paid).toLocaleString('en-IN')}
${tk(bill.due) > 0 ? `*বকেয়া: ৳${tk(bill.due).toLocaleString('en-IN')}*\n` : ''}${tk(bill.advance) > 0 ? `*অতিরিক্ত জমা (পরবর্তী মাসে সমন্বয় হবে): ৳${tk(bill.advance).toLocaleString('en-IN')}*\n` : ''}${bill.comment ? `নোট: ${bill.comment}\n` : ''}${payMsg}ধন্যবাদ!`;
  }

  // 1. Copy QR picture to clipboard FIRST while current page is 100% focused!
  let copied = false;
  try {
    copied = await copyActiveQrImageToClipboard(qrSrc);
  } catch (e) {
    console.warn('Auto copy failed:', e);
  }

  if (copied) {
    toast('✓ QR ছবি ক্লিপবোর্ডে কপি হয়েছে! WhatsApp এ Ctrl+V চেপে পেস্ট করুন।', 'success', 5000);
  } else {
    toast('WhatsApp ওপেন হচ্ছে... (ছবি কপি করতে "QR ছবি কপি" বাটন ব্যবহার করুন)', 'info', 4000);
  }

  // 2. Then open direct WhatsApp chat with tenant's number
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

function numberToEnglishWords(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return 'Zero Taka Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWords(n) {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
  }

  return (numToWords(Math.round(amount)).trim() || 'Zero') + ' Taka Only';
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
    const isEn = window.currentLang === 'en';
    let wordStr = isEn ? numberToEnglishWords(wordsTarget) : numberToBengaliWords(wordsTarget);
    if (b.paid > 0 && b.due > 0) {
      wordStr += isEn ? ` (Paid, Remaining Due ৳${(b.due || 0).toLocaleString('en-IN')})` : ` (পরিশোধিত, অবশিষ্ট বকেয়া ৳${(b.due || 0).toLocaleString('en-IN')})`;
    } else if (b.advance > 0) {
      wordStr += isEn ? ` (Paid, Advance Credit ৳${(b.advance || 0).toLocaleString('en-IN')})` : ` (পরিশোধিত, অতিরিক্ত জমা ৳${(b.advance || 0).toLocaleString('en-IN')})`;
    }
    el('receipt-amount-words').textContent = wordStr;
  }

  // Populate Payment Gateway & Bangla QR details inside Money Receipt
  const payableAmt = tk(b.due) > 0 ? tk(b.due) : (tk(b.paid) === 0 ? tk(b.total) : 0);
  const { gw, qrSrc, isCustom } = getBillPaymentConfig(b);

  if (el('receipt-qr-header-tag')) el('receipt-qr-header-tag').innerHTML = `<i class="fa-solid fa-qrcode"></i> ${gw.shortName.toUpperCase()} BANGLA QR`;
  if (el('receipt-qr-img')) el('receipt-qr-img').src = qrSrc;
  if (el('receipt-qr-sublabel')) {
    el('receipt-qr-sublabel').innerHTML = isCustom
      ? `<strong style="color:var(--green)">✓ কাস্টম ডায়নামিক QR</strong> (${gw.shortName})`
      : `<strong>${gw.number}</strong> (${gw.type})`;
  }
  if (el('receipt-qr-badge-title')) el('receipt-qr-badge-title').innerHTML = `<i class="fa-solid fa-mobile-screen-button"></i> ${gw.badgeTitle}`;
  if (el('receipt-qr-send-type')) el('receipt-qr-send-type').textContent = gw.type;
  if (el('receipt-qr-acc-lbl')) el('receipt-qr-acc-lbl').textContent = gw.label;
  if (el('receipt-qr-acc-num')) {
    el('receipt-qr-acc-num').textContent = gw.number;
    let colorCls = 'text-pink';
    if (gw.id === 'cellfin') colorCls = 'text-green';
    else if (gw.id === 'bank') colorCls = 'text-sky';
    el('receipt-qr-acc-num').className = 'qg-val ' + colorCls;
  }
  if (el('receipt-qr-payable-amt')) el('receipt-qr-payable-amt').textContent = fmt(payableAmt > 0 ? payableAmt : b.total);
  if (el('receipt-qr-ref')) el('receipt-qr-ref').textContent = `রুম নং: ${room.number}`;

  if (el('receipt-btn-open-slip')) {
    el('receipt-btn-open-slip').onclick = () => {
      closeModal('modal-receipt');
      openPaymentSlipModal(rid);
    };
  }

  el('receipt-btn-whatsapp').onclick = () => shareBillWhatsApp(room, b, p);
  openModal('modal-receipt');
};

/* ── Dedicated Multi-Gateway & Dynamic QR Payment Slip ───────── */
function renderPaymentSlipUI(room, b, p) {
  const { gw, qrSrc, isCustom, gwKey } = getBillPaymentConfig(b);

  if (el('ps-prop-name')) el('ps-prop-name').textContent = p.name;
  if (el('ps-prop-addr')) el('ps-prop-addr').textContent = p.address;
  if (el('ps-month-display')) el('ps-month-display').textContent = monthLabel(STATE.activeMonth);
  if (el('ps-room-no')) el('ps-room-no').textContent = room.number;
  if (el('ps-tenant-name')) el('ps-tenant-name').textContent = room.tenant?.name || '—';
  if (el('ps-tenant-phone')) el('ps-tenant-phone').textContent = room.tenant?.phone || '—';

  const payableAmt = tk(b.due) > 0 ? tk(b.due) : (tk(b.paid) === 0 ? tk(b.total) : 0);
  const displayAmt = payableAmt > 0 ? payableAmt : b.total;

  if (el('ps-payable-amt')) el('ps-payable-amt').textContent = fmt(displayAmt);
  if (el('ps-step-amt')) el('ps-step-amt').textContent = fmt(displayAmt);
  if (el('ps-ref-val')) el('ps-ref-val').textContent = `রুম নং: ${room.number}`;
  if (el('ps-step-ref')) el('ps-step-ref').textContent = `রুম ${room.number}`;

  if (el('ps-amt-breakdown-note')) {
    if (tk(b.due) > 0 && tk(b.paid) > 0) {
      el('ps-amt-breakdown-note').textContent = `মোট বিল ${fmt(b.total)} - পরিশোধিত ${fmt(b.paid)} = অবশিষ্ট বকেয়া`;
    } else {
      el('ps-amt-breakdown-note').textContent = `ভাড়া + বিদ্যুৎ/ইউটিলিটি চার্জ`;
    }
  }

  // Switch buttons active state
  if (el('ps-gw-btn-bkash')) el('ps-gw-btn-bkash').className = 'ps-gw-btn' + (gwKey === 'bkash' ? ' active' : '');
  if (el('ps-gw-btn-cellfin')) el('ps-gw-btn-cellfin').className = 'ps-gw-btn' + (gwKey === 'cellfin' ? ' active' : '');
  if (el('ps-gw-btn-bank')) el('ps-gw-btn-bank').className = 'ps-gw-btn' + (gwKey === 'bank' ? ' active' : '');

  // QR Image and Header
  if (el('ps-qr-image')) el('ps-qr-image').src = qrSrc;
  if (el('ps-qr-header-tag')) el('ps-qr-header-tag').innerHTML = `<i class="fa-solid fa-qrcode"></i> ${gw.shortName.toUpperCase()} BANGLA QR`;

  // Custom QR badge & clear button
  if (el('ps-qr-status-badge')) {
    if (isCustom) {
      el('ps-qr-status-badge').className = 'ps-qr-status-pill custom';
      el('ps-qr-status-badge').innerHTML = `<i class="fa-solid fa-circle-check"></i> কাস্টম ডায়নামিক QR (${fmt(displayAmt)})`;
      if (el('ps-btn-clear-custom')) el('ps-btn-clear-custom').style.display = 'inline-flex';
    } else {
      el('ps-qr-status-badge').className = 'ps-qr-status-pill';
      el('ps-qr-status-badge').innerHTML = `ডিফল্ট ${gw.shortName} QR`;
      if (el('ps-btn-clear-custom')) el('ps-btn-clear-custom').style.display = 'none';
    }
  }

  // Gateway Info Box
  if (el('ps-gw-pill')) {
    let pillCls = 'ps-bkash-pill';
    let iconCls = 'fa-mobile-screen';
    if (gwKey === 'cellfin') {
      pillCls = 'ps-cellfin-pill';
      iconCls = 'fa-building-columns';
    } else if (gwKey === 'bank') {
      pillCls = 'ps-bank-pill';
      iconCls = 'fa-landmark';
    }
    el('ps-gw-pill').className = 'ps-i-val ' + pillCls;
    el('ps-gw-pill').innerHTML = `<i class="fa-solid ${iconCls}"></i> ${gw.badgeTitle}`;
  }
  if (el('ps-num-label')) el('ps-num-label').textContent = gw.label;
  if (el('ps-acc-number')) {
    el('ps-acc-number').textContent = gw.number;
    let numCls = 'ps-bkash-num';
    if (gwKey === 'cellfin') numCls = 'ps-cellfin-num';
    else if (gwKey === 'bank') numCls = 'ps-bank-num';
    el('ps-acc-number').className = 'ps-i-val ' + numCls;
  }
  if (el('ps-acc-name')) el('ps-acc-name').textContent = gw.accName;
  if (el('ps-bank-name-row')) {
    if (gw.bankName) {
      el('ps-bank-name-row').style.display = 'flex';
      if (el('ps-bank-name')) el('ps-bank-name').textContent = gw.bankName;
    } else {
      el('ps-bank-name-row').style.display = 'none';
    }
  }
  if (el('ps-send-type')) {
    el('ps-send-type').textContent = gw.type;
    el('ps-send-type').style.color = gw.themeColor;
  }

  // Download Link
  if (el('ps-btn-download-qr')) {
    el('ps-btn-download-qr').href = qrSrc;
    el('ps-btn-download-qr').download = `${gw.shortName.toLowerCase()}-payment-qr-${room.number}.png`;
  }

  // WhatsApp Button
  if (el('ps-btn-whatsapp')) {
    el('ps-btn-whatsapp').onclick = () => shareBillWhatsApp(room, b, p);
  }
}

window.openPaymentSlipModal = function(rid) {
  const p = getActiveProperty(); if (!p) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);

  STATE.activeReceiptRoomId = rid;
  renderPaymentSlipUI(room, b, p);
  openModal('modal-payment-slip');
};

window.switchActiveSlipGateway = function(gwKey) {
  const p = getActiveProperty(); if (!p) return;
  const rid = STATE.activeReceiptRoomId; if (!rid) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);

  b.paymentGateway = gwKey;
  save();

  renderPaymentSlipUI(room, b, p);
  toast(`পেমেন্ট মেথড: ${PAYMENT_GATEWAYS[gwKey].name} সক্রিয় করা হয়েছে`, 'success');
};

window.copyActivePaymentNumber = function() {
  const p = getActiveProperty();
  const rid = STATE.activeReceiptRoomId;
  const room = p?.rooms?.find(r => r.id === rid);
  const b = room ? getBill(room, STATE.activeMonth) : null;
  const { gw } = getBillPaymentConfig(b);
  const num = gw ? gw.number : '01521752871';

  if (navigator.clipboard) {
    navigator.clipboard.writeText(num).then(() => {
      toast(`${gw.shortName} নম্বর ${num} কপি হয়েছে!`, 'success');
    }).catch(() => {
      toast(`নম্বর: ${num}`, 'info');
    });
  } else {
    toast(`নম্বর: ${num}`, 'info');
  }
};
window.copyBkashNumber = window.copyActivePaymentNumber;

window.printPaymentSlip = function() {
  const p = getActiveProperty();
  const roomNo = el('ps-room-no')?.textContent || 'Room';
  const monthTxt = el('ps-month-display')?.textContent || 'Month';

  const prevTitle = document.title;
  const safePropName = (p?.name || 'PMS').replace(/[\s\/\\:*?"<>|]+/g, '_');
  const safeRoom = String(roomNo).replace(/[\s\/\\:*?"<>|]+/g, '_');
  const safeMonth = String(monthTxt).replace(/[\s\/\\:*?"<>|]+/g, '_');
  document.title = `পেমেন্ট_স্লিপ_${safePropName}_রুম_${safeRoom}_${safeMonth}`;

  window.print();

  setTimeout(() => {
    document.title = prevTitle;
  }, 1000);
};

// Wire slip quick custom QR upload events
el('ps-btn-trigger-upload')?.addEventListener('click', () => {
  el('ps-custom-qr-input')?.click();
});

el('ps-custom-qr-input')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const p = getActiveProperty(); if (!p) return;
  const rid = STATE.activeReceiptRoomId; if (!rid) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);

  window.compressQrImageFile(file, function(dataUrl) {
    b.customQr = dataUrl;
    save();
    renderPaymentSlipUI(room, b, p);
    toast('এই বিলের জন্য কাস্টম ডায়নামিক QR সফলভাবে সেট হয়েছে!', 'success');
  });
  e.target.value = '';
});

el('ps-btn-clear-custom')?.addEventListener('click', () => {
  const p = getActiveProperty(); if (!p) return;
  const rid = STATE.activeReceiptRoomId; if (!rid) return;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);

  delete b.customQr;
  save();
  renderPaymentSlipUI(room, b, p);
  toast('কাস্টম QR মুছে ফেলা হয়েছে। ডিফল্ট QR সক্রিয়।', 'info');
});

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

el('btn-open-payment-slip')?.addEventListener('click', () => {
  const rid = el('form-bill').dataset.roomId;
  if (!rid) return;
  closeModal('modal-bill');
  openPaymentSlipModal(rid);
});

el('btn-whatsapp-bill')?.addEventListener('click', () => {
  const p = getActiveProperty(); if (!p) return;
  const rid = el('form-bill').dataset.roomId;
  const room = p.rooms.find(r => r.id === rid); if (!room) return;
  const b = getBill(room, STATE.activeMonth);
  shareBillWhatsApp(room, b, p);
});
