/* ============================================================
   via-rules.js: VIA criteria, management, WhatsApp, CSV
   The app NEVER diagnoses. It only turns the health worker's
   checklist answers into a *suggested* category.
   ============================================================ */

const VIA = (function () {

  /* ---- 1. Suggest a result from the checklist ---- */
  function suggest(cl) {
    const reasons = [];

    // Rule 1: growth / ulcer / bleeding
    if (cl.suspicious === true) {
      return { code: 'susp', reasons: ['reason_suspicious'] };
    }

    // Rule 2: SCJ not visible
    if (cl.scj === 'none') {
      return { code: 'inconclusive', reasons: ['reason_scj_none'] };
    }

    // Rule 3: dense acetowhite touching the SCJ
    if (cl.aw === 'dense' && cl.touchesScj === true) {
      reasons.push('reason_dense_touch');
      if (cl.scj === 'partial') reasons.push('reason_scj_partial');
      return { code: 'pos', reasons };
    }

    // Rule 4: otherwise negative
    if (cl.aw === 'none') reasons.push('reason_no_aw');
    else if (cl.aw === 'faint') reasons.push('reason_faint');
    else reasons.push('reason_not_touching');
    if (cl.scj === 'partial') reasons.push('reason_scj_partial');

    return { code: 'neg', reasons };
  }

  /* ---- 2. Management from the final result ---- */
  function management(result, cl) {
    if (result === 'susp') return 'urgent';
    if (result === 'pos') {
      const eligible = cl.scj === 'full' && cl.over75 !== true;
      return eligible ? 'ablation' : 'colpo';
    }
    if (result === 'inconclusive') return 'colpo';
    return 'rescreen';
  }

  /* Days until the referral is due */
  function dueDays(mgmt) {
    if (mgmt === 'urgent') return 7;
    if (mgmt === 'ablation' || mgmt === 'colpo') return 14;
    return null; // rescreen uses nextScreen instead
  }

  /* Add days to a date, return ISO date (YYYY-MM-DD) */
  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /* Add years to a date */
  function addYears(date, n) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + n);
    return d.toISOString().slice(0, 10);
  }

  /* ---- 3. WhatsApp helpers ---- */
  function waNumber(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10) return '91' + digits;
    return digits;
  }

  function waLink(phone, message) {
    return 'https://wa.me/' + waNumber(phone) + '?text=' + encodeURIComponent(message);
  }

  /* ---- 4. CSV export ---- */
  const CSV_HEADERS = [
    'id', 'date', 'name', 'age', 'id_number', 'phone', 'village',
    'scj', 'acetowhite', 'touches_scj', 'quadrants', 'over_75', 'suspicious',
    'suggested', 'result', 'management', 'refer_to', 'referral_due',
    'referral_status', 'next_screening', 'photo_pre', 'photo_post',
    'worker', 'facility', 'notes'
  ];

  function csvCell(v) {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCSV(records) {
    const rows = [CSV_HEADERS.join(',')];
    records.forEach(r => {
      const cl = r.checklist || {};
      const ref = r.referral || {};
      rows.push([
        r.id,
        (r.createdAt || '').slice(0, 10),
        r.patient?.name,
        r.patient?.age,
        r.patient?.pid,
        r.patient?.phone,
        r.patient?.village,
        cl.scj,
        cl.aw,
        cl.touchesScj === null ? '' : (cl.touchesScj ? 'yes' : 'no'),
        (cl.quadrants || []).join('|'),
        cl.over75 === null ? '' : (cl.over75 ? 'yes' : 'no'),
        cl.suspicious ? 'yes' : 'no',
        r.suggested,
        r.result,
        r.management,
        ref.to || '',
        ref.due || '',
        ref.status || '',
        r.nextScreen || '',
        r.photos?.pre ? 'yes' : 'no',
        r.photos?.post ? 'yes' : 'no',
        r.worker,
        r.facility,
        r.notes
      ].map(csvCell).join(','));
    });
    return '\uFEFF' + rows.join('\r\n'); // UTF-8 BOM for Excel
  }

  return { suggest, management, dueDays, addDays, addYears, waNumber, waLink, toCSV };
})();