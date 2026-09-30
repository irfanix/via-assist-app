/* ============================================================
   app.js: router, screens, wizard, follow-up, CSV, demo data
   ============================================================ */

const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

let wizard = null;       // the in-progress record
let wizardStep = 1;
let timerHandle = null;
let recordsCache = [];
let activeFollowupTab = 'overdue';

/* ---------- helpers ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString(I18N.lang === 'hi' ? 'hi-IN' : 'en-IN',
      { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) { return iso; }
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysBetween(aIso, bIso) {
  const a = new Date(aIso + 'T00:00:00');
  const b = new Date(bIso + 'T00:00:00');
  return Math.round((a - b) / 86400000);
}
function isOverdue(ref) {
  return ref && ref.status === 'pending' && ref.due && ref.due < todayISO();
}

/* Result badge label key */
const RESULT_LABEL = { neg: 'result_neg', pos: 'result_pos', susp: 'result_susp', inconclusive: 'result_inconclusive' };
const RESULT_SHORT = { neg: 'result_neg', pos: 'result_pos', susp: 'result_susp', inconclusive: 'result_inconclusive' };
const MGMT_LABEL = { rescreen: 'mgmt_rescreen', ablation: 'mgmt_ablation', colpo: 'mgmt_colpo', urgent: 'mgmt_urgent' };
const STATUS_LABEL = { pending: 'status_pending', visited: 'status_visited', treated: 'status_treated', lost: 'status_lost' };

function badge(code) {
  return `<span class="badge ${code}">${esc(t(RESULT_SHORT[code] || code))}</span>`;
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg, ms) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2200);
}

/* ---------- language button ---------- */
function updateLangButton() {
  const b = $('#langToggle');
  b.textContent = I18N.lang === 'en' ? 'हिंदी' : 'English';
  b.setAttribute('aria-label', t('lang_switch_aria'));
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  I18N.init();
  await DB.init();
  I18N.applyStatic();
  updateLangButton();

  window.addEventListener('hashchange', router);
  if (!location.hash) location.hash = '#/home';
  router();

  $('#langToggle').addEventListener('click', () => {
    I18N.set(I18N.lang === 'en' ? 'hi' : 'en');
    I18N.applyStatic();
    updateLangButton();
    router();
  });

  // Register service worker for offline use (only works on HTTPS/localhost)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

/* ---------- router ---------- */
function router() {
  // stop any running timer when leaving the wizard
  if (timerHandle && !location.hash.startsWith('#/new')) {
    clearInterval(timerHandle);
    timerHandle = null;
  }

  const hash = location.hash || '#/home';
  const parts = hash.replace(/^#\//, '').split('/');
  const name = parts[0] || 'home';
  const param = parts[1];

  // active nav highlight
  $$('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.route === name));

  if (name === 'home') return renderHome();
  if (name === 'new') return renderNew();
  if (name === 'followup') return renderFollowup();
  if (name === 'learn') return renderLearn();
  if (name === 'record' && param) return renderRecord(param);

  location.hash = '#/home';
}

/* ---------- refresh cached records + badge ---------- */
async function refreshRecords() {
  recordsCache = await DB.all();
  recordsCache.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  updateFollowupBadge();
}
async function updateFollowupBadge() {
  const all = recordsCache.length ? recordsCache : await DB.all();
  const n = all.filter(r => isOverdue(r.referral)).length;
  const b = $('#followupBadge');
  if (n > 0) { b.textContent = n; b.hidden = false; }
  else { b.hidden = true; }
}

/* ============================================================
   HOME
   ============================================================ */
async function renderHome() {
  await refreshRecords();
  const s = Settings.all();
  const all = recordsCache;

  const screened = all.length;
  const positive = all.filter(r => r.result === 'pos' || r.result === 'susp').length;
  const overdue = all.filter(r => isOverdue(r.referral)).length;
  const referred = all.filter(r => r.referral).length;
  const completed = all.filter(r => r.referral && (r.referral.status === 'visited' || r.referral.status === 'treated')).length;
  const pct = referred ? Math.round((completed / referred) * 100) : 0;

  const recent = all.slice(0, 6).map(r => {
    const ref = r.referral;
    let dueText = '';
    if (ref && ref.status === 'pending') {
      const d = daysBetween(todayISO(), ref.due); // >0 means overdue
      if (d > 0) dueText = `<span style="color:var(--danger);font-weight:600">${esc(t('overdue_by', { n: d }))}</span>`;
      else if (d === 0) dueText = `<span style="font-weight:600">${esc(t('due_today'))}</span>`;
      else dueText = esc(t('in_days', { n: -d }));
    } else if (ref) {
      dueText = esc(t(STATUS_LABEL[ref.status]));
    } else if (r.nextScreen) {
      dueText = esc(t('due_on', { date: fmtDate(r.nextScreen) }));
    }
    return `
      <a class="item" href="#/record/${esc(r.id)}">
        <div class="grow">
          <div class="name">${esc(r.patient?.name || '-')} ${r.demo ? `<span class="badge inconclusive">${esc(t('demo_tag'))}</span>` : ''}</div>
          <div class="meta">${esc(fmtDate(r.createdAt))} · ${dueText}</div>
        </div>
        ${badge(r.result)}
      </a>`;
  }).join('') || `<p class="muted center">${esc(t('home_no_recent'))}</p>`;

  const greeting = s.worker ? t('home_greeting', { name: esc(s.worker) }) : t('home_greeting_anon');

  $('#app').innerHTML = `
    <h1>${greeting}</h1>
    <p class="muted">${esc(t('home_subtitle'))}</p>

    <a class="btn btn-primary btn-lg btn-wide" href="#/new" style="margin:14px 0">＋ ${esc(t('home_start'))}</a>

    <div class="stats">
      <div class="stat"><div class="n">${screened}</div><div class="l">${esc(t('stat_screened'))}</div></div>
      <div class="stat"><div class="n">${positive}</div><div class="l">${esc(t('stat_positive'))}</div></div>
      <a class="stat link ${overdue ? 'alert' : ''}" href="#/followup">
        <div class="n">${overdue}</div><div class="l">${esc(t('stat_overdue'))}</div>
      </a>
      <div class="stat"><div class="n">${pct}%</div><div class="l">${esc(t('stat_completed'))}</div></div>
    </div>

    <h2>${esc(t('home_recent'))}</h2>
    ${recent}

    <details class="section">
      <summary>${esc(t('home_settings'))}</summary>
      <div class="body">
        <div class="field">
          <label for="setWorker">${esc(t('setting_worker'))}</label>
          <input id="setWorker" type="text" value="${esc(s.worker)}" />
        </div>
        <div class="field">
          <label for="setFacility">${esc(t('setting_facility'))}</label>
          <input id="setFacility" type="text" value="${esc(s.facility)}" />
        </div>
        <div class="field">
          <label for="setReferral">${esc(t('setting_referral'))}</label>
          <input id="setReferral" type="text" value="${esc(s.referral)}" />
        </div>
        <label class="check" style="margin-bottom:12px">
          <input id="setDemo" type="checkbox" ${s.demo ? 'checked' : ''} />
          <span><strong>${esc(t('setting_demo'))}</strong><br><span class="muted small">${esc(t('setting_demo_hint'))}</span></span>
        </label>
        <button class="btn btn-primary btn-wide" id="saveSettings">${esc(t('setting_save'))}</button>
      </div>
    </details>

    <details class="section">
      <summary>${esc(t('home_privacy'))}</summary>
      <div class="body">
        <p class="muted small">${esc(t('privacy_note'))}</p>
        <div class="stack">
          <button class="btn btn-wide" id="exportCsv">⬇ ${esc(t('btn_export_csv'))}</button>
          <button class="btn btn-wide" id="loadDemo">🧪 ${esc(t('btn_load_demo'))}</button>
          <button class="btn btn-danger btn-wide" id="deleteAll">🗑 ${esc(t('btn_delete_all'))}</button>
        </div>
      </div>
    </details>
  `;

  $('#saveSettings').addEventListener('click', () => {
    Settings.setAll({
      worker: $('#setWorker').value.trim(),
      facility: $('#setFacility').value.trim(),
      referral: $('#setReferral').value.trim(),
      demo: $('#setDemo').checked
    });
    toast(t('setting_saved'));
    renderHome();
  });

  $('#exportCsv').addEventListener('click', exportCSV);
  $('#loadDemo').addEventListener('click', loadDemoData);
  $('#deleteAll').addEventListener('click', async () => {
    if (!confirm(t('confirm_delete'))) return;
    await DB.clear();
    await refreshRecords();
    toast(t('toast_deleted'));
    renderHome();
  });
}

/* ---------- CSV export ---------- */
async function exportCSV() {
  const all = await DB.all();
  const csv = VIA.toCSV(all);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'via-assist-register-' + todayISO() + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================================================
   NEW SCREENING WIZARD
   ============================================================ */
function newDraft() {
  const s = Settings.all();
  return {
    id: DB.uid(),
    createdAt: new Date().toISOString(),
    patient: { name: '', pid: '', age: '', phone: '', village: '' },
    consent: false,
    photos: { pre: null, post: null },
    quality: { pre: null, post: null },
    checklist: { scj: null, aw: null, touchesScj: null, quadrants: [], over75: null, suspicious: null },
    suggested: null,
    result: null,
    management: null,
    referral: null,
    nextScreen: null,
    notes: '',
    worker: s.worker || '',
    facility: s.facility || '',
    timerDone: false
  };
}

function renderNew() {
  if (!wizard) { wizard = newDraft(); wizardStep = 1; }
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }

  const container = $('#app');
  container.innerHTML = `
    <div class="progress"><i style="width:${(wizardStep / 6) * 100}%"></i></div>
    <p class="muted small">${esc(t('step_of', { n: wizardStep }))}</p>
    <div id="stepBody"></div>
    <div class="wizard-footer">
      <button class="btn" id="btnBack" ${wizardStep === 1 ? 'disabled' : ''}>← ${esc(t('back'))}</button>
      <button class="btn btn-primary" id="btnNext">${wizardStep === 6 ? esc(t('save_record')) : esc(t('next')) + ' →'}</button>
    </div>
  `;

  renderStep(wizardStep);

  $('#btnBack').addEventListener('click', () => {
    if (wizardStep > 1) { wizardStep--; renderNew(); }
  });
  $('#btnNext').addEventListener('click', onNext);
}

function renderStep(n) {
  const box = $('#stepBody');
  if (n === 1) return step1(box);
  if (n === 2) return step2(box);
  if (n === 3) return step3(box);
  if (n === 4) return step4(box);
  if (n === 5) return step5(box);
  if (n === 6) return step6(box);
}

/* ---------- next button logic ---------- */
async function onNext() {
  if (wizardStep === 1) {
    if (!validateStep1()) return;
  }
  if (wizardStep === 3 && !wizard.timerDone) {
    toast(t('timer_block'));
    return;
  }
  if (wizardStep === 5 && !wizard.suggested) {
    toast(t('err_checklist'));
    return;
  }
  if (wizardStep === 6) {
    await saveRecord();
    return;
  }
  wizardStep++;
  renderNew();
}

/* ---------------- STEP 1: patient ---------------- */
function step1(box) {
  const p = wizard.patient;
  box.innerHTML = `
    <h1>${esc(t('s1_title'))}</h1>

    <div class="field" id="fName">
      <label for="pName">${esc(t('f_name'))} *</label>
      <input id="pName" type="text" value="${esc(p.name)}" autocomplete="off" />
      <div class="err" hidden>${esc(t('err_required'))}</div>
    </div>

    <div class="field" id="fAge">
      <label for="pAge">${esc(t('f_age'))} * (${esc(t('age_unit'))})</label>
      <input id="pAge" type="number" inputmode="numeric" min="15" max="100" value="${esc(p.age)}" />
      <div class="err" hidden>${esc(t('err_age'))}</div>
    </div>

    <div class="callout warn" id="ageWarn" hidden>${esc(t('warn_age'))}</div>

    <div class="field">
      <label for="pPhone">${esc(t('f_phone'))} <span class="muted small">(${esc(t('optional'))})</span></label>
      <input id="pPhone" type="tel" inputmode="tel" value="${esc(p.phone)}" />
    </div>

    <div class="field">
      <label for="pPid">${esc(t('f_pid'))} <span class="muted small">(${esc(t('optional'))})</span></label>
      <input id="pPid" type="text" value="${esc(p.pid)}" />
    </div>

    <div class="field">
      <label for="pVillage">${esc(t('f_village'))} <span class="muted small">(${esc(t('optional'))})</span></label>
      <input id="pVillage" type="text" value="${esc(p.village)}" />
    </div>

    <div class="field" id="fConsent">
      <label class="check">
        <input id="pConsent" type="checkbox" ${wizard.consent ? 'checked' : ''} />
        <span>${esc(t('consent_label'))}</span>
      </label>
      <div class="err" hidden>${esc(t('err_consent'))}</div>
    </div>
  `;

  // live age warning
  const ageEl = $('#pAge');
  ageEl.addEventListener('input', () => {
    const v = parseInt(ageEl.value, 10);
    const warn = $('#ageWarn');
    if (!isNaN(v) && (v < 30 || v > 65)) warn.hidden = false;
    else warn.hidden = true;
  });
  if (ageEl.value) ageEl.dispatchEvent(new Event('input'));
}

function validateStep1() {
  const name = $('#pName').value.trim();
  const age = parseInt($('#pAge').value, 10);
  const consent = $('#pConsent').checked;
  let ok = true;

  $('#fName').classList.toggle('invalid', !name);
  $('#fName .err').hidden = !!name;
  if (!name) ok = false;

  const ageBad = isNaN(age) || age < 15 || age > 100;
  $('#fAge').classList.toggle('invalid', ageBad);
  $('#fAge .err').hidden = !ageBad;
  if (ageBad) ok = false;

  $('#fConsent').classList.toggle('invalid', !consent);
  $('#fConsent .err').hidden = consent;
  if (!consent) ok = false;

  if (!ok) return false;

  wizard.patient = {
    name,
    age,
    phone: $('#pPhone').value.trim(),
    pid: $('#pPid').value.trim(),
    village: $('#pVillage').value.trim()
  };
  wizard.consent = true;
  return true;
}

/* ---------------- STEP 2 & 4: photos ---------------- */
function step2(box) { return photoStep(box, 'pre'); }
function step4(box) { return photoStep(box, 'post'); }

function photoStep(box, which) {
  const isPre = which === 'pre';
  const photo = wizard.photos[which];
  const report = wizard.quality[which];

  box.innerHTML = `
    <h1>${esc(t(isPre ? 's2_title' : 's4_title'))}</h1>

    <div class="callout info">
      <strong>${esc(t('photo_tips'))}</strong>
      <ul style="margin:6px 0 0; padding-left:18px">
        <li>${esc(t('tip_light'))}</li>
        <li>${esc(t('tip_centre'))}</li>
        <li>${esc(t('tip_steady'))}</li>
      </ul>
    </div>

    <label class="file-drop" for="photoInput">
      <span style="font-size:1.8rem">📷</span>
      <span><strong>${esc(t('choose_photo'))}</strong></span>
      <span class="muted small">${esc(t('photo_optional_note'))}</span>
      <input id="photoInput" type="file" accept="image/*" capture="environment" />
    </label>

    <div class="photo-preview" id="photoPreview" style="margin-top:12px">
      ${photo ? `<img src="${photo}" alt="" />` : `<span class="muted">${esc(t('not_recorded'))}</span>`}
    </div>

    <div id="qualityBox" style="margin-top:10px"></div>

    ${!isPre && (wizard.photos.pre || wizard.photos.post) ? compareHTML() : ''}
  `;

  if (report) renderQuality(report);

  $('#photoInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await Quality.compress(reader.result, 900, 0.8);
        wizard.photos[which] = compressed;
        const rep = await Quality.check(compressed);
        wizard.quality[which] = rep;
        $('#photoPreview').innerHTML = `<img src="${compressed}" alt="" />`;
        renderQuality(rep);
        // re-render to update the comparison section on step 4
        if (!isPre) renderStep(4);
      } catch (err) {
        console.warn(err);
      }
    };
    reader.readAsDataURL(file);
  });
}

function compareHTML() {
  const pre = wizard.photos.pre;
  const post = wizard.photos.post;
  return `
    <h3>${esc(t('before'))} / ${esc(t('after'))}</h3>
    <div class="compare">
      <figure>
        ${pre ? `<img src="${pre}" alt="" />` : `<div class="photo-preview muted">-</div>`}
        <figcaption>${esc(t('before'))}</figcaption>
      </figure>
      <figure>
        ${post ? `<img src="${post}" alt="" />` : `<div class="photo-preview muted">-</div>`}
        <figcaption>${esc(t('after'))}</figcaption>
      </figure>
    </div>
  `;
}

function renderQuality(rep) {
  const box = $('#qualityBox');
  if (!box) return;
  if (rep.ok) {
    box.innerHTML = `<div class="callout ok">✓ ${esc(t('quality_good'))}</div>`;
  } else {
    box.innerHTML = `
      <div class="callout warn">
        <strong>${esc(t('quality_bad'))}</strong>
        <ul style="margin:6px 0 0; padding-left:18px">
          ${rep.issues.map(k => `<li>${esc(t(k))}</li>`).join('')}
        </ul>
        <div class="small" style="margin-top:6px">${esc(t('quality_retake'))}</div>
      </div>`;
  }
}

/* ---------------- STEP 3: timer ---------------- */
function step3(box) {
  const demo = Settings.get('demo');
  const total = demo ? 5 : 60;
  const C = 2 * Math.PI * 54;

  box.innerHTML = `
    <h1>${esc(t('s3_title'))}</h1>
    <ol style="padding-left:20px">
      <li>${esc(t('acid_1'))}</li>
      <li>${esc(t('acid_2'))}</li>
      <li>${esc(t('acid_3'))}</li>
    </ol>

    <div class="timer-wrap ${wizard.timerDone ? 'timer-done' : ''}" id="timerWrap">
      <svg class="timer-ring" viewBox="0 0 120 120" aria-hidden="true">
        <circle class="ring-bg" cx="60" cy="60" r="54"></circle>
        <circle class="ring-fg" id="ringProgress" cx="60" cy="60" r="54"
                stroke-dasharray="${C}" stroke-dashoffset="0"></circle>
      </svg>
      <div class="timer-label" id="timerLabel">${wizard.timerDone ? '✓' : total + 's'}</div>
    </div>

    <div class="center">
      <button class="btn btn-primary btn-lg" id="timerBtn">
        ${wizard.timerDone ? esc(t('timer_restart')) : esc(t('timer_start'))}
      </button>
    </div>

    <div class="callout ${wizard.timerDone ? 'ok' : 'info'}" style="margin-top:14px" id="timerMsg">
      ${wizard.timerDone ? '✓ ' + esc(t('timer_done')) : esc(t('timer_waiting'))}
    </div>
  `;

  const ring = $('#ringProgress');
  const label = $('#timerLabel');
  const wrap = $('#timerWrap');

  function resetRing() {
    ring.style.strokeDashoffset = 0;
    ring.style.transition = 'none';
  }

  function start() {
    clearInterval(timerHandle);
    wrap.classList.remove('timer-done');
    $('#timerMsg').className = 'callout info';
    $('#timerMsg').textContent = t('timer_waiting');
    resetRing();
    // force reflow so the transition restarts cleanly
    void ring.getBoundingClientRect();
    ring.style.transition = 'stroke-dashoffset 1s linear';

    let remaining = total;
    const tick = () => {
      label.textContent = remaining + 's';
      ring.style.strokeDashoffset = C * (1 - remaining / total);
      if (remaining === 0) {
        clearInterval(timerHandle);
        finish();
        return;
      }
      remaining--;
    };
    tick();
    timerHandle = setInterval(tick, 1000);
  }

  function finish() {
    wizard.timerDone = true;
    wrap.classList.add('timer-done');
    label.textContent = '✓';
    ring.style.strokeDashoffset = C; // fully drawn
    $('#timerMsg').className = 'callout ok';
    $('#timerMsg').textContent = '✓ ' + t('timer_done');
    $('#timerBtn').textContent = t('timer_restart');
    toast(t('toast_timer_done'), 3000);
    beep();
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }

  $('#timerBtn').addEventListener('click', start);

  // If the user comes back to this step and the timer already finished, show it done
  if (wizard.timerDone) {
    ring.style.strokeDashoffset = C;
    label.textContent = '✓';
  }
}

/* short beep with Web Audio */
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch (e) { /* audio is a nice-to-have */ }
}

/* ---------------- STEP 5: checklist ---------------- */
function step5(box) {
  const cl = wizard.checklist;

  const yesNo = (name, val, onChange) => `
    <div class="choices" data-group="${name}">
      <label class="choice ${val === true ? 'sel' : ''}">
        <input type="radio" name="${name}" value="yes" ${val === true ? 'checked' : ''} />
        <span class="txt">${esc(t('yes'))}</span>
      </label>
      <label class="choice ${val === false ? 'sel' : ''}">
        <input type="radio" name="${name}" value="no" ${val === false ? 'checked' : ''} />
        <span class="txt">${esc(t('no'))}</span>
      </label>
    </div>`;

  box.innerHTML = `
    <h1>${esc(t('s5_title'))}</h1>

    <div class="field">
      <label>${esc(t('cl_scj'))}</label>
      <div class="choices" data-group="scj">
        ${['full', 'partial', 'none'].map(k => `
          <label class="choice ${cl.scj === k ? 'sel' : ''}">
            <input type="radio" name="scj" value="${k}" ${cl.scj === k ? 'checked' : ''} />
            <span class="txt">${esc(t('scj_' + k))}</span>
          </label>`).join('')}
      </div>
    </div>

    <div class="field">
      <label>${esc(t('cl_aw'))}</label>
      <div class="choices" data-group="aw">
        ${['none', 'faint', 'dense'].map(k => `
          <label class="choice ${cl.aw === k ? 'sel' : ''}">
            <span class="ill">${Ill.mini['aw_' + k]}</span>
            <input type="radio" name="aw" value="${k}" ${cl.aw === k ? 'checked' : ''} />
            <span class="txt">${esc(t('aw_' + k))}</span>
          </label>`).join('')}
      </div>
    </div>

    <div class="field" id="touchField" ${cl.aw === 'dense' ? '' : 'hidden'}>
      <label>${esc(t('cl_touches'))}</label>
      ${yesNo('touchesScj', cl.touchesScj)}
    </div>

    <div class="field" id="quadField" ${(cl.aw === 'dense' && cl.touchesScj === true) ? '' : 'hidden'}>
      <label>${esc(t('cl_quad'))}</label>
      ${Ill.clock(cl.quadrants)}
      <div class="row" style="justify-content:center; gap:14px; margin-top:6px">
        <span class="muted small">${esc(t('quad_1'))}</span>
        <span class="muted small">${esc(t('quad_2'))}</span>
        <span class="muted small">${esc(t('quad_3'))}</span>
        <span class="muted small">${esc(t('quad_4'))}</span>
      </div>
    </div>

    <div class="field" id="over75Field" ${(cl.aw === 'dense' && cl.touchesScj === true) ? '' : 'hidden'}>
      <label>${esc(t('cl_over75'))}</label>
      ${yesNo('over75', cl.over75)}
    </div>

    <div class="field">
      <label>${esc(t('cl_suspicious'))}</label>
      ${yesNo('suspicious', cl.suspicious)}
    </div>

    <div class="callout" id="suggestBox"></div>
  `;

  /* ---- wire up the choices ---- */
  function syncSel(group) {
    $$(`[data-group="${group}"] .choice`).forEach(l => {
      const input = l.querySelector('input');
      l.classList.toggle('sel', input.checked);
    });
  }

  box.addEventListener('change', (e) => {
    const name = e.target.name;
    if (!name) return;
    const val = e.target.value;

    if (name === 'scj') cl.scj = val;
    if (name === 'aw') cl.aw = val;
    if (name === 'touchesScj') cl.touchesScj = (val === 'yes');
    if (name === 'over75') cl.over75 = (val === 'yes');
    if (name === 'suspicious') cl.suspicious = (val === 'yes');

    syncSel(name);

    // show/hide conditional fields
    $('#touchField').hidden = cl.aw !== 'dense';
    const showQuad = cl.aw === 'dense' && cl.touchesScj === true;
    $('#quadField').hidden = !showQuad;
    $('#over75Field').hidden = !showQuad;
    if (!showQuad) { cl.quadrants = []; }

    updateSuggestion();
  });

  /* ---- clickable quadrant clock ---- */
  box.addEventListener('click', (e) => {
    const w = e.target.closest('.wedge');
    if (!w) return;
    const q = parseInt(w.dataset.q, 10);
    const i = cl.quadrants.indexOf(q);
    if (i >= 0) cl.quadrants.splice(i, 1);
    else cl.quadrants.push(q);
    // re-render just the clock
    const holder = w.closest('svg');
    holder.outerHTML = Ill.clock(cl.quadrants);
    updateSuggestion();
  });

  function updateSuggestion() {
    const boxEl = $('#suggestBox');
    const complete =
      cl.scj && cl.aw &&
      (cl.aw !== 'dense' || cl.touchesScj !== null) &&
      (cl.aw !== 'dense' || cl.touchesScj !== true || cl.over75 !== null) &&
      cl.suspicious !== null;

    if (!complete) {
      boxEl.className = 'callout';
      boxEl.innerHTML = `<span class="muted">${esc(t('suggested_wait'))}</span>`;
      wizard.suggested = null;
      return;
    }

    const sug = VIA.suggest(cl);
    wizard.suggested = sug.code;
    boxEl.className = 'callout ' + (sug.code === 'susp' ? 'danger' : sug.code === 'pos' ? 'warn' : sug.code === 'inconclusive' ? 'info' : 'ok');
    boxEl.innerHTML = `
      <div class="row"><strong>${esc(t('suggested_title'))}</strong>${badge(sug.code)}</div>
      <ul style="margin:8px 0 0; padding-left:18px">
        ${sug.reasons.map(r => `<li>${esc(t(r))}</li>`).join('')}
      </ul>`;
  }

  updateSuggestion();
}

/* ---------------- STEP 6: result & management ---------------- */
function step6(box) {
  const cl = wizard.checklist;
  const sug = wizard.suggested || VIA.suggest(cl).code;
  wizard.suggested = sug;
  const current = wizard.result || sug;
  const mgmt = VIA.management(current, cl);
  const dueDays = VIA.dueDays(mgmt);
  const due = dueDays ? VIA.addDays(new Date(), dueDays) : null;
  const nextScreen = mgmt === 'rescreen' ? VIA.addYears(new Date(), 5) : null;

  const results = ['neg', 'pos', 'susp', 'inconclusive'];

  box.innerHTML = `
    <h1>${esc(t('s6_title'))}</h1>

    <div class="callout ${sug === 'susp' ? 'danger' : sug === 'pos' ? 'warn' : sug === 'inconclusive' ? 'info' : 'ok'}">
      <div class="row"><strong>${esc(t('suggested_title'))}</strong>${badge(sug)}</div>
    </div>

    <div class="field">
      <label>${esc(t('final_result'))}</label>
      <div class="choices" id="resultChoices">
        ${results.map(r => `
          <label class="choice ${current === r ? 'sel' : ''}">
            <input type="radio" name="finalResult" value="${r}" ${current === r ? 'checked' : ''} />
            <span class="txt">${esc(t(RESULT_LABEL[r]))}</span>
          </label>`).join('')}
      </div>
    </div>

    <div class="callout warn" id="overrideNote" ${current !== sug ? '' : 'hidden'}>
      ${esc(t('overridden'))}
    </div>

    <div class="card">
      <h3>${esc(t('management_title'))}</h3>
      <p><strong>${esc(t(MGMT_LABEL[mgmt]))}</strong></p>
      <div class="field">
        <label for="referTo">${esc(t('refer_to'))}</label>
        <input id="referTo" type="text" value="${esc(wizard.referral?.to || Settings.get('referral') || '')}" />
      </div>
      <div class="field">
        <label>${esc(mgmt === 'rescreen' ? t('next_screen_date') : t('due_date'))}</label>
        <input type="date" id="dueInput" value="${due || nextScreen || ''}" />
      </div>
      <div class="field">
        <label for="notesInput">${esc(t('notes'))}</label>
        <textarea id="notesInput">${esc(wizard.notes)}</textarea>
      </div>
    </div>
  `;

  // update management card live when the final result changes
  box.onchange = (e) => {
    if (e.target.name !== 'finalResult') return;
    wizard.result = e.target.value;
    $$('#resultChoices .choice').forEach(l => l.classList.toggle('sel', l.querySelector('input').checked));
    const override = wizard.result !== sug;
    $('#overrideNote').hidden = !override;
    renderStep(6); // refresh the management card
  };

  wizard.result = current;
}

/* ---------------- save ---------------- */
async function saveRecord() {
  const cl = wizard.checklist;
  const result = wizard.result || wizard.suggested || VIA.suggest(cl).code;
  const mgmt = VIA.management(result, cl);

  const referTo = $('#referTo').value.trim();
  const dueVal = $('#dueInput').value;
  const notes = $('#notesInput').value.trim();

  let referral = null;
  let nextScreen = null;

  if (mgmt === 'rescreen') {
    nextScreen = dueVal || VIA.addYears(new Date(), 5);
  } else {
    referral = {
      status: 'pending',
      due: dueVal || VIA.addDays(new Date(), VIA.dueDays(mgmt)),
      to: referTo,
      history: [{ at: new Date().toISOString(), status: 'pending' }]
    };
  }

  const rec = {
    ...wizard,
    result,
    management: mgmt,
    referral,
    nextScreen,
    notes,
    worker: Settings.get('worker') || wizard.worker,
    facility: Settings.get('facility') || wizard.facility
  };
  delete rec.timerDone;

  await DB.put(rec);
  toast(t('toast_saved'));

  wizard = null;
  wizardStep = 1;
  await refreshRecords();
  location.hash = '#/record/' + rec.id;
}

/* ============================================================
   RECORD / REFERRAL SLIP
   ============================================================ */
async function renderRecord(id) {
  const r = await DB.get(id);
  if (!r) {
    $('#app').innerHTML = `<div class="empty"><span class="big">🤷</span>Not found.</div>`;
    return;
  }

  const cl = r.checklist || {};
  const ref = r.referral;
  const isPrint = false;

  const quadText = (cl.quadrants || []).map(q => t('quad_' + q)).join(', ') || t('not_recorded');

  const refLine = ref
    ? `<dt>${esc(t('status_line'))}</dt><dd>${esc(t(STATUS_LABEL[ref.status]))}</dd>
       <dt>${esc(t('refer_to'))}</dt><dd>${esc(ref.to || '-')}</dd>
       <dt>${esc(t('due_date'))}</dt><dd>${esc(fmtDate(ref.due))}</dd>`
    : `<dt>${esc(t('next_screen_date'))}</dt><dd>${esc(fmtDate(r.nextScreen))}</dd>`;

  const photosHTML = (r.photos?.pre || r.photos?.post)
    ? `<hr>
       <h3>${esc(t('before'))} / ${esc(t('after'))}</h3>
       <div class="compare">
         <figure>${r.photos.pre ? `<img src="${r.photos.pre}" alt="" />` : `<div class="photo-preview muted">-</div>`}<figcaption>${esc(t('before'))}</figcaption></figure>
         <figure>${r.photos.post ? `<img src="${r.photos.post}" alt="" />` : `<div class="photo-preview muted">-</div>`}<figcaption>${esc(t('after'))}</figcaption></figure>
       </div>`
    : '';

  $('#app').innerHTML = `
    <div class="slip" id="slip">
      <div class="slip-head">
        <div>
          <h1>${esc(t('record_title'))}</h1>
          <div class="muted small">${esc(r.facility || '')}</div>
        </div>
        <div>${badge(r.result)}</div>
      </div>

      <hr>

      <dl>
        <dt>${esc(t('f_name'))}</dt><dd>${esc(r.patient?.name || '')}</dd>
        <dt>${esc(t('f_age'))}</dt><dd>${esc(r.patient?.age || '')}</dd>
        <dt>${esc(t('f_phone'))}</dt><dd>${esc(r.patient?.phone || '-')}</dd>
        <dt>${esc(t('f_pid'))}</dt><dd>${esc(r.patient?.pid || '-')}</dd>
        <dt>${esc(t('f_village'))}</dt><dd>${esc(r.patient?.village || '-')}</dd>
        <dt>${esc(t('screened_on'))}</dt><dd>${esc(fmtDate(r.createdAt))}</dd>
      </dl>

      <hr>

      <h3>${esc(t('findings'))}</h3>
      <dl>
        <dt>${esc(t('f_scj'))}</dt><dd>${esc(cl.scj ? t('scj_' + cl.scj) : '-')}</dd>
        <dt>${esc(t('f_aw'))}</dt><dd>${esc(cl.aw ? t('aw_' + cl.aw) : '-')}</dd>
        <dt>${esc(t('f_touches'))}</dt><dd>${cl.touchesScj === null || cl.touchesScj === undefined ? '-' : esc(t(cl.touchesScj ? 'yes' : 'no'))}</dd>
        <dt>${esc(t('f_quad'))}</dt><dd>${esc(quadText)}</dd>
        <dt>${esc(t('f_over75'))}</dt><dd>${cl.over75 === null || cl.over75 === undefined ? '-' : esc(t(cl.over75 ? 'yes' : 'no'))}</dd>
        <dt>${esc(t('f_susp'))}</dt><dd>${esc(t(cl.suspicious ? 'yes' : 'no'))}</dd>
      </dl>

      <hr>

      <h3>${esc(t('management_title'))}</h3>
      <p><strong>${esc(t(MGMT_LABEL[r.management]))}</strong></p>
      <dl>${refLine}</dl>

      ${r.notes ? `<hr><h3>${esc(t('notes'))}</h3><p>${esc(r.notes)}</p>` : ''}

      ${photosHTML}

      <hr>
      <p class="disclaimer">${esc(t('record_disclaimer'))}</p>
      <p class="muted small">${esc(t('recorded_by', { worker: r.worker || '-', facility: r.facility || '-' }))}</p>
    </div>

    <div class="no-print" style="margin-top:14px">
      <h3>${esc(t('status_line'))}</h3>
      <div class="stack">
        <div class="row">
          ${ref ? `
            <a class="btn btn-sm" href="tel:${esc(r.patient?.phone || '')}">📞 ${esc(t('btn_call'))}</a>
            <button class="btn btn-sm btn-ok" data-st="visited">✓ ${esc(t('btn_visited'))}</button>
            <button class="btn btn-sm btn-ok" data-st="treated">💊 ${esc(t('btn_treated'))}</button>
            <button class="btn btn-sm btn-warn" data-st="lost">✗ ${esc(t('btn_lost'))}</button>
            ${ref.status !== 'pending' ? `<button class="btn btn-sm" data-st="pending">↺ ${esc(t('btn_reopen'))}</button>` : ''}
          ` : `<span class="muted small">${esc(t('next_screen_date'))}: ${esc(fmtDate(r.nextScreen))}</span>`}
        </div>
        <div class="row">
          <button class="btn btn-sm" id="btnPrint">🖨 ${esc(t('btn_print'))}</button>
          ${ref && r.patient?.phone ? `<a class="btn btn-sm" id="btnWa" target="_blank" rel="noopener" href="${whatsappHref(r)}">💬 ${esc(t('btn_whatsapp'))}</a>` : ''}
          <button class="btn btn-sm btn-danger" id="btnDel">🗑 ${esc(t('btn_delete'))}</button>
        </div>
      </div>
    </div>
  `;

  $$('[data-st]').forEach(b => b.addEventListener('click', async () => {
    const st = b.dataset.st;
    if (!r.referral) return;
    r.referral.status = st;
    r.referral.history = r.referral.history || [];
    r.referral.history.push({ at: new Date().toISOString(), status: st });
    await DB.put(r);
    await refreshRecords();
    renderRecord(id);
  }));

  $('#btnPrint').addEventListener('click', () => window.print());

  $('#btnDel').addEventListener('click', async () => {
    if (!confirm(t('confirm_delete_one'))) return;
    await DB.del(id);
    await refreshRecords();
    location.hash = '#/home';
  });
}

function whatsappHref(r) {
  const ref = r.referral;
  const worker = r.worker || Settings.get('worker') || '';
  const facility = r.facility || Settings.get('facility') || '';

  let msg;
  if (ref && ref.status === 'pending') {
    msg = t('wa_followup', {
      name: r.patient?.name || '',
      worker, facility,
      to: ref.to || Settings.get('referral') || '',
      date: fmtDate(ref.due)
    });
  } else {
    msg = t('wa_negative', {
      name: r.patient?.name || '',
      worker, facility,
      date: fmtDate(r.nextScreen)
    });
  }
  return VIA.waLink(r.patient?.phone, msg);
}

/* ============================================================
   FOLLOW-UP TRACKER
   ============================================================ */
async function renderFollowup() {
  await refreshRecords();
  const all = recordsCache.filter(r => r.referral);

  const groups = {
    overdue: all.filter(r => isOverdue(r.referral)),
    upcoming: all.filter(r => r.referral.status === 'pending' && !isOverdue(r.referral)),
    completed: all.filter(r => r.referral.status === 'visited' || r.referral.status === 'treated'),
    lost: all.filter(r => r.referral.status === 'lost')
  };

  const tabs = ['overdue', 'upcoming', 'completed', 'lost'];

  $('#app').innerHTML = `
    <h1>${esc(t('fu_title'))}</h1>

    <div class="tabs">
      ${tabs.map(tab => `
        <button class="tab ${activeFollowupTab === tab ? 'active' : ''}" data-tab="${tab}">
          ${esc(t('tab_' + tab))} (${groups[tab].length})
        </button>`).join('')}
    </div>

    <div id="fuList"></div>
  `;

  $$('.tab').forEach(b => b.addEventListener('click', () => {
    activeFollowupTab = b.dataset.tab;
    renderFollowup();
  }));

  const list = groups[activeFollowupTab] || [];
  const listEl = $('#fuList');

  if (!list.length) {
    listEl.innerHTML = `<div class="empty"><span class="big">📋</span>${esc(t('fu_empty'))}</div>`;
    return;
  }

  // sort by due date
  list.sort((a, b) => (a.referral.due || '').localeCompare(b.referral.due || ''));

  listEl.innerHTML = list.map(r => {
    const ref = r.referral;
    const od = isOverdue(ref);
    const d = daysBetween(todayISO(), ref.due); // >0 means overdue
    let when = '';
    if (ref.status !== 'pending') when = t(STATUS_LABEL[ref.status]);
    else if (od) when = t('overdue_by', { n: d });
    else if (d === 0) when = t('due_today');
    else when = t('in_days', { n: -d });

    return `
      <div class="item ${od ? 'overdue' : ''}">
        <div class="grow">
          <div class="name">${esc(r.patient?.name || '')} ${badge(r.result)}</div>
          <div class="meta">${esc(r.patient?.village || '')} · ${esc(t(MGMT_LABEL[r.management]))}</div>
          <div class="meta">${esc(t('referred_to', { to: ref.to || '-' }))}</div>
          <div class="meta" style="font-weight:650; ${od ? 'color:var(--danger)' : ''}">${esc(when)}</div>
          <div class="row" style="margin-top:8px">
            ${r.patient?.phone ? `<a class="btn btn-sm" target="_blank" rel="noopener" href="${whatsappHref(r)}">💬</a>` : ''}
            <button class="btn btn-sm btn-ok" data-id="${esc(r.id)}" data-st="visited">✓ ${esc(t('btn_visited'))}</button>
            <button class="btn btn-sm btn-ok" data-id="${esc(r.id)}" data-st="treated">💊 ${esc(t('btn_treated'))}</button>
            <button class="btn btn-sm btn-warn" data-id="${esc(r.id)}" data-st="lost">✗ ${esc(t('btn_lost'))}</button>
            ${ref.status !== 'pending' ? `<button class="btn btn-sm" data-id="${esc(r.id)}" data-st="pending">↺ ${esc(t('btn_reopen'))}</button>` : ''}
            <a class="btn btn-sm" href="#/record/${esc(r.id)}">↗</a>
          </div>
        </div>
      </div>`;
  }).join('');

  listEl.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', async () => {
    const rec = await DB.get(b.dataset.id);
    if (!rec || !rec.referral) return;
    rec.referral.status = b.dataset.st;
    rec.referral.history = rec.referral.history || [];
    rec.referral.history.push({ at: new Date().toISOString(), status: b.dataset.st });
    await DB.put(rec);
    await refreshRecords();
    renderFollowup();
  }));
}

/* ============================================================
   LEARN
   ============================================================ */
function renderLearn() {
  const cards = Ill.items.map(it => `
    <div class="ill-card">
      ${it.svg()}
      <div class="row" style="margin-bottom:6px">${badge(it.badge)}</div>
      <strong>${esc(t(it.key + '_t'))}</strong>
      <div class="cap">${esc(t(it.key + '_d'))}</div>
    </div>`).join('');

  $('#app').innerHTML = `
    <h1>${esc(t('learn_title'))}</h1>
    <p class="muted">${esc(t('learn_intro'))}</p>

    <div class="callout">
      <strong>${esc(t('legend_os'))} · ${esc(t('legend_scj'))} · ${esc(t('legend_col'))} · ${esc(t('legend_aw'))}</strong>
      <div class="legend" style="margin-top:8px">
        <span><i class="swatch" style="background:#4b2a33"></i>${esc(t('legend_os'))}</span>
        <span><i class="swatch" style="background:#f7cdd7"></i>${esc(t('legend_col'))}</span>
        <span><i class="swatch" style="background:#e88a9c"></i>${esc(t('legend_col'))}</span>
        <span><i class="swatch" style="background:#ffffff;border-color:#999"></i>${esc(t('legend_aw'))}</span>
      </div>
      <p class="small muted" style="margin:8px 0 0">${esc(t('schematic_note'))}</p>
    </div>

    <div class="ill-grid">${cards}</div>

    <p class="muted small" style="margin-top:16px">${esc(t('learn_source'))}</p>
  `;
}

/* ============================================================
   DEMO DATA
   ============================================================ */
async function loadDemoData() {
  const existing = await DB.all();
  if (existing.some(r => r.demo)) {
    toast('Demo data already loaded.');
    return;
  }

  const now = Date.now();
  const DAY = 86400000;

  function mk(cfg) {
    const created = new Date(now - cfg.daysAgo * DAY).toISOString();
    const createdDate = created.slice(0, 10);
    const mgmt = cfg.management;
    const dueDays = VIA.dueDays(mgmt);
    const ref = dueDays
      ? {
          status: cfg.status || 'pending',
          due: VIA.addDays(createdDate, dueDays),
          to: cfg.to || 'District Hospital, Colposcopy Unit',
          history: [{ at: created, status: cfg.status || 'pending' }]
        }
      : null;

    return {
      id: DB.uid(),
      createdAt: created,
      demo: true,
      patient: { name: cfg.name, age: cfg.age, pid: '', phone: cfg.phone || '', village: cfg.village },
      consent: true,
      photos: { pre: null, post: null },
      quality: { pre: null, post: null },
      checklist: {
        scj: cfg.scj, aw: cfg.aw,
        touchesScj: cfg.touchesScj, quadrants: cfg.quadrants || [],
        over75: cfg.over75, suspicious: cfg.suspicious
      },
      suggested: cfg.suggested || cfg.result,
      result: cfg.result,
      management: mgmt,
      referral: ref,
      nextScreen: mgmt === 'rescreen' ? VIA.addYears(createdDate, 5) : null,
      notes: cfg.notes || '',
      worker: Settings.get('worker') || 'ANM',
      facility: Settings.get('facility') || 'Sub-Health Centre'
    };
  }

  const demo = [
    mk({ name: 'Sunita Devi', age: 42, village: 'Rampur', phone: '9876543210',
         daysAgo: 30, scj: 'full', aw: 'dense', touchesScj: true, over75: false,
         suspicious: false, result: 'pos', management: 'ablation', status: 'visited',
         notes: 'Referred to PHC for thermal ablation.' }),
    mk({ name: 'Kavita Yadav', age: 35, village: 'Baraut', phone: '9876500011',
         daysAgo: 20, scj: 'full', aw: 'faint', touchesScj: false, over75: false,
         suspicious: false, result: 'neg', management: 'rescreen' }),
    mk({ name: 'Meena Kumari', age: 51, village: 'Sultanpur', phone: '9812345678',
         daysAgo: 20, scj: 'partial', aw: 'dense', touchesScj: true, over75: true,
         suspicious: false, result: 'pos', management: 'colpo',
         notes: 'Large lesion, needs colposcopy.' }),
    mk({ name: 'Anjali Verma', age: 38, village: 'Kheri', phone: '9811122233',
         daysAgo: 16, scj: 'none', aw: 'none', touchesScj: null, over75: null,
         suspicious: false, result: 'inconclusive', management: 'colpo' }),
    mk({ name: 'Rekha Singh', age: 58, village: 'Bhagwanpur', phone: '9898989898',
         daysAgo: 5, scj: 'full', aw: 'dense', touchesScj: false, over75: false,
         suspicious: false, result: 'neg', management: 'rescreen' }),
    mk({ name: 'Pooja Sharma', age: 33, village: 'Nandgaon', phone: '9765432100',
         daysAgo: 3, scj: 'full', aw: 'none', touchesScj: false, over75: false,
         suspicious: true, result: 'susp', management: 'urgent',
         notes: 'Bleeding on touch. Urgent referral given.' }),
    mk({ name: 'Lakshmi Nair', age: 46, village: 'Puthur', phone: '9700011122',
         daysAgo: 1, scj: 'full', aw: 'dense', touchesScj: true, over75: false,
         suspicious: false, result: 'pos', management: 'ablation', status: 'treated',
         notes: 'Treated at CHC.' })
  ];

  for (const r of demo) await DB.put(r);
  await refreshRecords();
  toast('Demo data loaded.');
  renderHome();
}