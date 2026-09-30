/* ============================================================
   illustrations.js: schematic cervix SVGs
   NO real patient photos anywhere. All hand-drawn schematics.
   ============================================================ */

const Ill = (function () {

  /* Shared base: outer cervix circle, external os, optional SCJ */
  function base(opts) {
    opts = opts || {};
    const scj = opts.scj || 'full';        // full | partial | none
    const col = opts.col !== false;        // columnar epithelium patch
    const aw = opts.aw || 'none';          // none | faint | dense
    const awTouch = opts.awTouch || false; // does the white area touch the SCJ?
    const over75 = opts.over75 || false;
    const growth = opts.growth || false;
    const label = opts.label || '';

    let s = '';
    s += `<svg viewBox="0 0 120 120" role="img" aria-label="${label}">`;

    // outer cervix
    s += `<circle cx="60" cy="60" r="50" fill="#f7cdd7" stroke="#e0a3b3" stroke-width="2"/>`;

    // columnar epithelium (red patch around the os)
    if (col) {
      s += `<circle cx="60" cy="60" r="22" fill="#e88a9c" opacity="0.85"/>`;
    }

    // SCJ dashed ring
    if (scj === 'full') {
      s += `<circle cx="60" cy="60" r="26" fill="none" stroke="#7a3b48" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    } else if (scj === 'partial') {
      s += `<path d="M60 34 A26 26 0 0 1 86 60" fill="none" stroke="#7a3b48" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    }

    // acetowhite area
    if (aw === 'faint') {
      s += `<circle cx="60" cy="60" r="16" fill="#ffffff" opacity="0.35"/>`;
    } else if (aw === 'dense') {
      if (over75) {
        s += `<circle cx="60" cy="60" r="42" fill="#ffffff" opacity="0.92"/>`;
      } else if (awTouch) {
        s += `<path d="M60 60 L60 36 A24 24 0 0 1 84 60 Z" fill="#ffffff" opacity="0.92" stroke="#c9d3cf" stroke-width="1"/>`;
      } else {
        s += `<path d="M78 42 A22 22 0 0 1 96 66 A22 22 0 0 1 78 88 Z" fill="#ffffff" opacity="0.92" stroke="#c9d3cf" stroke-width="1"/>`;
      }
    }

    // growth / ulcer
    if (growth) {
      s += `<circle cx="60" cy="60" r="15" fill="#b96b7a"/>`;
      s += `<circle cx="55" cy="55" r="2.4" fill="#b4233a"/>`;
      s += `<circle cx="65" cy="58" r="2" fill="#b4233a"/>`;
      s += `<circle cx="60" cy="66" r="2.6" fill="#b4233a"/>`;
      s += `<circle cx="52" cy="63" r="1.8" fill="#b4233a"/>`;
      s += `<path d="M46 74 q6 -6 12 -2" fill="none" stroke="#b4233a" stroke-width="1.6" stroke-linecap="round"/>`;
    }

    // external os (dark centre)
    s += `<circle cx="60" cy="60" r="6" fill="#4b2a33"/>`;

    s += `</svg>`;
    return s;
  }

  /* The 7 learning illustrations */
  const items = [
    { key: 'l1', badge: 'neg',  svg: () => base({ aw: 'none' }) },
    { key: 'l2', badge: 'neg',  svg: () => base({ aw: 'faint' }) },
    { key: 'l3', badge: 'neg',  svg: () => base({ aw: 'dense', awTouch: false }) },
    { key: 'l4', badge: 'pos',  svg: () => base({ aw: 'dense', awTouch: true }) },
    { key: 'l5', badge: 'pos',  svg: () => base({ aw: 'dense', over75: true }) },
    { key: 'l6', badge: 'susp', svg: () => base({ growth: true }) },
    { key: 'l7', badge: 'inconclusive', svg: () => base({ scj: 'none' }) }
  ];

  /* Small schematics used inside the checklist choices */
  const mini = {
    aw_none:  base({ aw: 'none' }),
    aw_faint: base({ aw: 'faint' }),
    aw_dense: base({ aw: 'dense', awTouch: true })
  };

  /* Clickable 4-quadrant clock */
  function clock(selected) {
    selected = selected || [];
    const wedges = [
      { id: 1, d: 'M60 60 L60 12 A48 48 0 0 1 108 60 Z', lx: 82, ly: 34 },
      { id: 2, d: 'M60 60 L108 60 A48 48 0 0 1 60 108 Z', lx: 82, ly: 88 },
      { id: 3, d: 'M60 60 L60 108 A48 48 0 0 1 12 60 Z', lx: 38, ly: 88 },
      { id: 4, d: 'M60 60 L12 60 A48 48 0 0 1 60 12 Z', lx: 38, ly: 34 }
    ];
    let s = `<svg class="clock" viewBox="0 0 120 120" role="group" aria-label="Quadrants">`;
    s += `<circle cx="60" cy="60" r="50" fill="#f7cdd7" stroke="#e0a3b3" stroke-width="2"/>`;
    wedges.forEach(w => {
      const on = selected.indexOf(w.id) >= 0 ? ' on' : '';
      s += `<path class="wedge${on}" d="${w.d}" data-q="${w.id}" tabindex="0"
              role="button" aria-pressed="${on ? 'true' : 'false'}"/>`;
    });
    s += `<circle class="core" cx="60" cy="60" r="10"/>`;
    wedges.forEach(w => {
      s += `<text class="lbl" x="${w.lx}" y="${w.ly}" text-anchor="middle">${w.id}</text>`;
    });
    s += `</svg>`;
    return s;
  }

  return { base, items, mini, clock };
})();