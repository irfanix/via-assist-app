# VIA Assist

An offline, mobile-first web app that helps ANMs and community health officers in rural India perform **VIA (Visual Inspection with Acetic acid)** cervical cancer screening with more confidence, better record-keeping, and fewer lost follow-ups.

**Live demo:** https://irfanix.github.io/via-assist-app/

---

## The problem

- India has about **125,000 new cervical cancer cases** and **more than 77,000 deaths** every year (CancerWorld).
- Health workers are trained on VIA but **rarely see a positive case**, so reading the cervix is hard.
- Results are written on paper; many are lost.
- In one Tamil Nadu pilot, **fewer than 10% of referred women (74 of 807)** reached the referral centre.

VIA Assist does not replace training or clinical judgement. It gives the health worker a **structure, a timer, a second opinion on the checklist, and a way to keep the follow-up thread alive**.

---

## Features

| Feature | What it does |
|---|---|
| Patient details & consent | Captures name, age (soft 30–65 warning), phone, ABHA/ID, village. Consent is required. |
| Photo before acetic acid | Camera input, live quality check (brightness, sharpness, glare). Never blocks. |
| Acetic acid timer | 60-second ring timer (5 s in demo mode), beep, vibrate, "look now" toast. |
| Photo after 1 minute | Same quality check, plus a side-by-side before/after comparison. |
| Structured checklist | SCJ visibility, acetowhite type, quadrant clock, >75%, suspicious features. |
| Suggested result | The app turns the checklist into a *suggested* category, with reasons. The health worker confirms or overrides. Overrides are recorded. |
| Referral slip | Printable, with before/after photos, findings, management, due date, disclaimer. |
| Follow-up tracker | Overdue / Upcoming / Completed / Lost tabs, red badge on the bottom nav. |
| WhatsApp reminder | One-tap text-only reminder (never sends photos). |
| CSV export | UTF-8 with BOM, quoted, no photo data. |
| Offline PWA | Works from GitHub Pages, installable, caches the shell. |
| English + Hindi | Full translation, saved in Settings. |

---

## How the suggestion works

The app **never diagnoses**. It only applies four simple rules in order:

| Order | Condition | Suggested result |
|---|---|---|
| 1 | Growth, ulcer, or bleeding on touch | **Suspicious for cancer** |
| 2 | SCJ not visible | **SCJ not visible (inconclusive)** |
| 3 | Dense acetowhite **and** touches the SCJ | **VIA positive** |
| 4 | Anything else | **VIA negative** |

Then management follows:

| Result | Condition | Management | Due |
|---|---|---|---|
| Negative |: | Rescreen in 5 years | +5 years |
| Positive | SCJ fully visible, not >75%, not suspicious | Refer for treatment (ablation) | 14 days |
| Positive | otherwise | Refer for colposcopy | 14 days |
| Inconclusive |: | Refer for colposcopy | 14 days |
| Suspicious |: | Urgent referral | 7 days |

---

## Tech

- Plain **HTML + CSS + vanilla JavaScript**. No frameworks, no build step, no npm, no CDNs.
- **IndexedDB** for records (in-memory fallback if unavailable). **localStorage** for settings.
- **Service worker** for offline use (network-first, cache fallback).
- Mobile-first, 44 px minimum tap targets, `aria` labels, dark mode, print styles.

### Files

| File | Purpose |
|---|---|
| `index.html` | App shell: top bar, screen area, bottom navigation |
| `css/style.css` | All styles, dark mode, print styles for the referral slip |
| `js/i18n.js` | English and Hindi text |
| `js/db.js` | Local storage of records (IndexedDB) and settings |
| `js/quality.js` | Photo quality check (brightness, blur, glare) |
| `js/via-rules.js` | VIA suggestion rules, management, WhatsApp link, CSV export |
| `js/illustrations.js` | Hand-drawn schematic cervix diagrams |
| `js/app.js` | Screens, screening wizard, follow-up tracker, demo data |
| `sw.js`, `manifest.json` | Offline support and install as an app |

---

## How to run

**Online:** open https://irfanix.github.io/via-assist-app/

**On your computer:**

```bash
git clone https://github.com/irfanix/via-assist-app.git
cd via-assist-app
python -m http.server 8000
# then open http://localhost:8000
```

**Quick demo:** Home, then *Data and privacy*, then **Load demo data** (7 fictional women, no photos). In *Settings*, turn on **Demo mode** to make the timer 5 seconds.

---

## Privacy and ethics

- No real patient images are used anywhere in this project. All cervix pictures are original schematic drawings.
- Demo data uses fictional names.
- All records stay on the device. Nothing is uploaded.
- The app never analyses the cervix image to make a decision. The health worker always makes the final call.

---

## Limitations and next steps

- The checklist rules are a documentation aid, not a validated clinical decision tool. They should be reviewed by gynaecologists and the national programme before real use.
- Data lives on one phone. A real deployment would need secure sync with the national NCD system.
- Future work: compare the rules against expert-labelled cases, and, only with properly licensed and validated data (for example the IARC Cervical Cancer Image Bank), research image-based decision support.

---

## Credits and sources

- IARC/WHO: Atlas of Visual Inspection of the Cervix with Acetic Acid, and the IARC VIA/VILI manual (VIA reporting criteria).
- WHO guidance on screen-and-treat for cervical cancer prevention (ablation eligibility).
- Ministry of Health and Family Welfare figures, as reported in July 2025.
- CancerWorld: "Delivering cervical cancer screening across India: the plan and the practice".

---

## AI usage disclosure

This project was built with help from AI assistants (Claude by Anthropic), which were used to draft code, Hindi translations and this README. <!-- Irfan: write here what you did yourself, what you changed, and what you learned. -->

---

## License

MIT
