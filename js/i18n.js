/* ============================================================
   i18n.js, English + Hindi strings
   Usage:  t('key', {name:'Sunita'})  ->  "Namaste, Sunita!"
           I18N.set('hi')            ->  switch language
           I18N.applyStatic()        ->  translate [data-i18n] nodes
   ============================================================ */

const I18N = (function () {

  const dicts = {
    /* ---------------------- ENGLISH ---------------------- */
    en: {
      skip_to_content: "Skip to content",
      nav_home: "Home", nav_screen: "Screen", nav_followup: "Follow-up", nav_learn: "Learn",
      nav_aria: "Main navigation",
      lang_switch_aria: "Switch language",

      /* home */
      home_greeting: "Namaste, {name}!",
      home_greeting_anon: "Namaste!",
      home_subtitle: "Screen women aged 30–65 for cervical cancer using VIA.",
      home_start: "Start new screening",
      stat_screened: "Women screened",
      stat_positive: "Positive / suspicious",
      stat_overdue: "Overdue follow-ups",
      stat_completed: "Referrals completed",
      home_recent: "Recent screenings",
      home_no_recent: "No screenings yet. Tap “Start new screening”.",
      home_settings: "Settings",
      home_privacy: "Data and privacy",
      setting_worker: "Your name",
      setting_facility: "Facility",
      setting_referral: "Default referral facility",
      setting_demo: "Demo mode",
      setting_demo_hint: "Timer runs for 5 seconds instead of 60.",
      setting_save: "Save settings",
      setting_saved: "Settings saved.",
      privacy_note: "All data is stored only on this device (IndexedDB). Nothing is uploaded. Photos are never sent over WhatsApp. Export the register as CSV (no photos) at any time.",
      btn_export_csv: "Export register (CSV, no photos)",
      btn_load_demo: "Load demo data",
      btn_delete_all: "Delete all data",
      confirm_delete: "Delete ALL records permanently? This cannot be undone.",

      /* wizard common */
      step_of: "Step {n} of 6",
      back: "Back",
      next: "Next",
      save_record: "Save record",
      optional: "optional",
      yes: "Yes", no: "No",

      /* step 1 */
      s1_title: "Patient details",
      f_name: "Name", f_age: "Age", f_phone: "Mobile number",
      f_pid: "ID number (ABHA or other)", f_village: "Village",
      consent_label: "The woman understands the VIA test, agrees to be screened, and agrees that photos may be taken and stored on this device for her care.",
      err_required: "This field is required.",
      err_age: "Enter an age between 15 and 100.",
      warn_age: "The national programme screens women aged 30 to 65. You can still continue.",
      err_consent: "Consent is required before screening.",
      age_unit: "years",

      /* step 2 / 4 photos */
      s2_title: "Photo before acetic acid",
      s4_title: "Photo after 1 minute",
      photo_tips: "Photo tips",
      tip_light: "Use good, even light, face the woman toward a window or lamp.",
      tip_centre: "Keep the cervix in the centre of the frame.",
      tip_steady: "Hold the phone steady and close enough to fill the frame.",
      choose_photo: "Take or choose photo",
      retake: "Retake photo",
      photo_optional_note: "Photo is optional, you can continue without one.",
      quality_good: "Photo quality looks good.",
      quality_bad: "Photo quality issues:",
      quality_retake: "Consider retaking the photo.",
      q_too_dark: "Too dark",
      q_overexposed: "Overexposed",
      q_blurry: "Blurry",
      q_glare: "Strong glare",
      before: "Before",
      after: "After",
      schematic_note: "Schematic illustration, not a clinical photo.",

      /* step 3 timer */
      s3_title: "Apply acetic acid",
      acid_1: "Apply 3–5% acetic acid (vinegar) generously to the cervix.",
      acid_2: "Wait exactly 1 minute. Do not look at the cervix during this time.",
      acid_3: "After 1 minute, look again for any white (acetowhite) areas.",
      timer_start: "Start timer",
      timer_restart: "Restart timer",
      timer_done: "Time is up. Look at the cervix now.",
      timer_waiting: "Timer running…",
      toast_timer_done: "Time is up. Look at the cervix now.",
      timer_block: "Please finish the timer before continuing.",

      /* step 5 checklist */
      s5_title: "What do you see?",
      cl_scj: "Is the SCJ (squamocolumnar junction) visible?",
      scj_full: "Fully visible",
      scj_partial: "Partly visible",
      scj_none: "Not visible",
      cl_aw: "Acetowhite area?",
      aw_none: "None",
      aw_faint: "Faint, patchy or translucent",
      aw_dense: "Dense, well-defined white",
      cl_touches: "Does the white area touch the SCJ?",
      cl_quad: "Which part of the cervix is affected?",
      quad_1: "12 to 3 o'clock",
      quad_2: "3 to 6 o'clock",
      quad_3: "6 to 9 o'clock",
      quad_4: "9 to 12 o'clock",
      cl_over75: "Does it cover more than 75% of the cervix?",
      cl_suspicious: "Growth, ulcer, or bleeding on touch?",
      suggested_title: "Suggested by the VIA criteria",
      suggested_wait: "Answer the questions above to see a suggestion.",
      reason_suspicious: "Growth, ulcer or bleeding seen.",
      reason_scj_none: "SCJ not visible, result inconclusive.",
      reason_dense_touch: "Dense acetowhite area touching the SCJ.",
      reason_no_aw: "No acetowhite area.",
      reason_faint: "Only faint or patchy acetowhite.",
      reason_not_touching: "Dense acetowhite but not touching the SCJ.",
      reason_scj_partial: "Note: SCJ only partly visible.",

      /* step 6 result */
      s6_title: "Result and next step",
      final_result: "Final result (you decide)",
      result_neg: "VIA negative",
      result_pos: "VIA positive",
      result_susp: "Suspicious for cancer",
      result_inconclusive: "SCJ not visible (inconclusive)",
      overridden: "You changed the suggested result. The override is recorded.",
      management_title: "Management",
      mgmt_rescreen: "Rescreen in 5 years",
      mgmt_ablation: "Refer for treatment (ablation)",
      mgmt_colpo: "Refer for colposcopy",
      mgmt_urgent: "Urgent referral",
      refer_to: "Refer to",
      due_date: "Due date",
      next_screen_date: "Next screening date",
      notes: "Notes",
      toast_saved: "Record saved.",

      /* record */
      record_title: "Referral slip",
      findings: "Findings",
      f_scj: "SCJ", f_aw: "Acetowhite", f_touches: "Touches SCJ",
      f_quad: "Quadrants", f_over75: "Over 75% of cervix", f_susp: "Growth / ulcer / bleeding",
      status_line: "Follow-up status",
      status_pending: "Pending", status_visited: "Visited", status_treated: "Treated",
      status_lost: "Lost to follow-up",
      btn_call: "Call", btn_visited: "Visited", btn_treated: "Treated",
      btn_lost: "Lost", btn_reopen: "Reopen",
      btn_print: "Print / save PDF", btn_whatsapp: "WhatsApp reminder",
      btn_delete: "Delete record",
      confirm_delete_one: "Delete this record permanently?",
      recorded_by: "Recorded by {worker} at {facility}.",
      record_disclaimer: "Recorded by a health worker using VIA Assist. The result is the health worker's visual assessment, not a diagnosis by software.",

      /* follow-up */
      fu_title: "Follow-up tracker",
      tab_overdue: "Overdue", tab_upcoming: "Upcoming",
      tab_completed: "Completed", tab_lost: "Lost",
      fu_empty: "Nothing here yet.",
      due_on: "Due {date}",
      overdue_by: "Overdue by {n} days",
      due_today: "Due today",
      in_days: "In {n} days",
      referred_to: "Refer to {to}",

      /* learn */
      learn_title: "Learn, VIA patterns",
      learn_intro: "Schematic illustrations of common VIA findings. Tap through and compare with what you see.",
      learn_source: "Source: IARC/WHO VIA atlas and manual; WHO screen-and-treat guidance for ablation eligibility.",
      legend_os: "External os",
      legend_scj: "SCJ (dashed line)",
      legend_col: "Columnar epithelium",
      legend_aw: "Acetowhite",
      l1_t: "No acetowhite", l1_d: "Normal cervix, VIA negative.",
      l2_t: "Faint / patchy white", l2_d: "Translucent acetowhite, VIA negative.",
      l3_t: "Dense white, away from SCJ", l3_d: "Dense area but not touching the SCJ, VIA negative.",
      l4_t: "Dense white touching SCJ", l4_d: "Dense, well-defined acetowhite touching the SCJ, VIA positive.",
      l5_t: "Large lesion (>75%)", l5_d: "Dense acetowhite covering most of the cervix, VIA positive, refer.",
      l6_t: "Growth / bleeding", l6_d: "Cauliflower-like growth with bleeding spots, suspicious for cancer.",
      l7_t: "SCJ not visible", l7_d: "SCJ cannot be seen, inconclusive, refer for colposcopy.",

      /* whatsapp */
      wa_followup: "Namaste {name}. This is {worker} from {facility}. Your cervical screening test needs a follow-up visit at {to}. Please go by {date}. Please bring this message. Thank you.",
      wa_negative: "Namaste {name}. This is {worker} from {facility}. Your cervical screening result was normal. Your next screening is due on {date}. Thank you.",

      /* misc */
      demo_tag: "Demo",
      toast_deleted: "All data deleted.",
      err_checklist: "Please answer every question first.",
      screened_on: "Screened on",
      days: "days",
      not_recorded: "-"
    },

    /* ---------------------- HINDI ---------------------- */
    hi: {
      skip_to_content: "सामग्री पर जाएँ",
      nav_home: "होम", nav_screen: "स्क्रीनिंग", nav_followup: "फ़ॉलो-अप", nav_learn: "सीखें",
      nav_aria: "मुख्य नेविगेशन",
      lang_switch_aria: "भाषा बदलें",

      home_greeting: "नमस्ते, {name}!",
      home_greeting_anon: "नमस्ते!",
      home_subtitle: "30–65 वर्ष की महिलाओं की VIA से सर्वाइकल कैंसर स्क्रीनिंग करें।",
      home_start: "नई स्क्रीनिंग शुरू करें",
      stat_screened: "स्क्रीन की गई महिलाएँ",
      stat_positive: "पॉज़िटिव / संदिग्ध",
      stat_overdue: "बकाया फ़ॉलो-अप",
      stat_completed: "पूर्ण रेफ़रल",
      home_recent: "हाल की स्क्रीनिंग",
      home_no_recent: "अभी कोई स्क्रीनिंग नहीं। “नई स्क्रीनिंग शुरू करें” दबाएँ।",
      home_settings: "सेटिंग्स",
      home_privacy: "डेटा और गोपनीयता",
      setting_worker: "आपका नाम",
      setting_facility: "केंद्र",
      setting_referral: "डिफ़ॉल्ट रेफ़रल केंद्र",
      setting_demo: "डेमो मोड",
      setting_demo_hint: "टाइमर 60 के बजाय 5 सेकंड चलेगा।",
      setting_save: "सेटिंग्स सहेजें",
      setting_saved: "सेटिंग्स सहेजी गईं।",
      privacy_note: "सारा डेटा केवल इस डिवाइस पर (IndexedDB) रहता है। कुछ भी अपलोड नहीं होता। फ़ोटो कभी WhatsApp पर नहीं भेजी जातीं। रजिस्टर को CSV (बिना फ़ोटो) में कभी भी निर्यात करें।",
      btn_export_csv: "रजिस्टर निर्यात करें (CSV, बिना फ़ोटो)",
      btn_load_demo: "डेमो डेटा लोड करें",
      btn_delete_all: "सारा डेटा मिटाएँ",
      confirm_delete: "सारे रिकॉर्ड हमेशा के लिए मिटाएँ? इसे वापस नहीं लाया जा सकता।",

      step_of: "चरण {n} / 6",
      back: "पीछे",
      next: "आगे",
      save_record: "रिकॉर्ड सहेजें",
      optional: "वैकल्पिक",
      yes: "हाँ", no: "नहीं",

      s1_title: "मरीज़ का विवरण",
      f_name: "नाम", f_age: "उम्र", f_phone: "मोबाइल नंबर",
      f_pid: "आईडी नंबर (ABHA या अन्य)", f_village: "गाँव",
      consent_label: "महिला VIA जाँच समझती है, जाँच के लिए सहमत है, और सहमत है कि उसकी देखभाल के लिए इस डिवाइस पर फ़ोटो ली और रखी जा सकती हैं।",
      err_required: "यह फ़ील्ड आवश्यक है।",
      err_age: "15 से 100 के बीच उम्र दर्ज करें।",
      warn_age: "राष्ट्रीय कार्यक्रम 30 से 65 वर्ष की महिलाओं की जाँच करता है। आप फिर भी जारी रख सकती हैं।",
      err_consent: "जाँच से पहले सहमति आवश्यक है।",
      age_unit: "वर्ष",

      s2_title: "एसिटिक एसिड से पहले फ़ोटो",
      s4_title: "1 मिनट बाद फ़ोटो",
      photo_tips: "फ़ोटो सुझाव",
      tip_light: "अच्छी, समान रोशनी रखें, महिला का मुँह खिड़की या लैंप की ओर करें।",
      tip_centre: "गर्भाशय ग्रीवा को फ़्रेम के बीच में रखें।",
      tip_steady: "फ़ोन को स्थिर रखें और फ़्रेम भरने तक पास लाएँ।",
      choose_photo: "फ़ोटो लें या चुनें",
      retake: "फ़ोटो दोबारा लें",
      photo_optional_note: "फ़ोटो वैकल्पिक है, बिना फ़ोटो भी आगे बढ़ सकती हैं।",
      quality_good: "फ़ोटो की गुणवत्ता अच्छी लगती है।",
      quality_bad: "फ़ोटो में समस्याएँ:",
      quality_retake: "फ़ोटो दोबारा लेने पर विचार करें।",
      q_too_dark: "बहुत अंधेरी",
      q_overexposed: "बहुत अधिक रोशनी",
      q_blurry: "धुंधली",
      q_glare: "तेज़ चमक",
      before: "पहले",
      after: "बाद में",
      schematic_note: "यह एक आरेखीय चित्र है, कोई क्लिनिकल फ़ोटो नहीं।",

      s3_title: "एसिटिक एसिड लगाएँ",
      acid_1: "गर्भाशय ग्रीवा पर 3–5% एसिटिक एसिड (सिरका) अच्छी तरह लगाएँ।",
      acid_2: "ठीक 1 मिनट प्रतीक्षा करें। इस दौरान ग्रीवा को न देखें।",
      acid_3: "1 मिनट बाद फिर देखें, कोई सफ़ेद (एसिटोव्हाइट) क्षेत्र है या नहीं।",
      timer_start: "टाइमर शुरू करें",
      timer_restart: "टाइमर फिर शुरू करें",
      timer_done: "समय पूरा। अब ग्रीवा को देखें।",
      timer_waiting: "टाइमर चल रहा है…",
      toast_timer_done: "समय पूरा। अब ग्रीवा को देखें।",
      timer_block: "आगे बढ़ने से पहले टाइमर पूरा करें।",

      s5_title: "आपको क्या दिखाई देता है?",
      cl_scj: "क्या SCJ (स्क्वामोकॉलमनर जंक्शन) दिखाई देता है?",
      scj_full: "पूरी तरह दिखता है",
      scj_partial: "कुछ हिस्सा दिखता है",
      scj_none: "दिखाई नहीं देता",
      cl_aw: "एसिटोव्हाइट क्षेत्र?",
      aw_none: "कोई नहीं",
      aw_faint: "हल्का, धब्बेदार या पारभासी",
      aw_dense: "गाढ़ा, स्पष्ट सफ़ेद",
      cl_touches: "क्या सफ़ेद क्षेत्र SCJ को छूता है?",
      cl_quad: "ग्रीवा का कौन-सा भाग प्रभावित है?",
      quad_1: "12 से 3 बजे",
      quad_2: "3 से 6 बजे",
      quad_3: "6 से 9 बजे",
      quad_4: "9 से 12 बजे",
      cl_over75: "क्या यह ग्रीवा के 75% से अधिक भाग को ढकता है?",
      cl_suspicious: "वृद्धि, अल्सर या छूने पर रक्तस्राव?",
      suggested_title: "VIA मानदंड के अनुसार सुझाव",
      suggested_wait: "सुझाव देखने के लिए ऊपर के प्रश्नों का उत्तर दें।",
      reason_suspicious: "वृद्धि, अल्सर या रक्तस्राव दिखा।",
      reason_scj_none: "SCJ दिखाई नहीं देता, परिणाम अनिश्चित।",
      reason_dense_touch: "गाढ़ा एसिटोव्हाइट क्षेत्र SCJ को छूता है।",
      reason_no_aw: "कोई एसिटोव्हाइट क्षेत्र नहीं।",
      reason_faint: "केवल हल्का या धब्बेदार एसिटोव्हाइट।",
      reason_not_touching: "गाढ़ा एसिटोव्हाइट, पर SCJ को नहीं छूता।",
      reason_scj_partial: "ध्यान दें: SCJ का कुछ हिस्सा ही दिखता है।",

      s6_title: "परिणाम और अगला कदम",
      final_result: "अंतिम परिणाम (आप तय करें)",
      result_neg: "VIA निगेटिव",
      result_pos: "VIA पॉज़िटिव",
      result_susp: "कैंसर के लिए संदिग्ध",
      result_inconclusive: "SCJ दिखाई नहीं देता (अनिश्चित)",
      overridden: "आपने सुझाए परिणाम को बदला। यह बदलाव दर्ज किया गया है।",
      management_title: "प्रबंधन",
      mgmt_rescreen: "5 वर्ष बाद फिर स्क्रीनिंग",
      mgmt_ablation: "उपचार के लिए रेफ़र करें (एब्लेशन)",
      mgmt_colpo: "कोल्पोस्कोपी के लिए रेफ़र करें",
      mgmt_urgent: "तत्काल रेफ़रल",
      refer_to: "रेफ़र करें",
      due_date: "नियत तारीख",
      next_screen_date: "अगली स्क्रीनिंग की तारीख",
      notes: "टिप्पणियाँ",
      toast_saved: "रिकॉर्ड सहेजा गया।",

      record_title: "रेफ़रल पर्ची",
      findings: "निष्कर्ष",
      f_scj: "SCJ", f_aw: "एसिटोव्हाइट", f_touches: "SCJ को छूता है",
      f_quad: "चतुर्थांश", f_over75: "ग्रीवा का 75% से अधिक", f_susp: "वृद्धि / अल्सर / रक्तस्राव",
      status_line: "फ़ॉलो-अप स्थिति",
      status_pending: "लंबित", status_visited: "गई", status_treated: "उपचार हुआ",
      status_lost: "फ़ॉलो-अप छूटा",
      btn_call: "कॉल करें", btn_visited: "गई", btn_treated: "उपचार हुआ",
      btn_lost: "छूटा", btn_reopen: "फिर खोलें",
      btn_print: "प्रिंट / PDF सहेजें", btn_whatsapp: "WhatsApp रिमाइंडर",
      btn_delete: "रिकॉर्ड मिटाएँ",
      confirm_delete_one: "यह रिकॉर्ड हमेशा के लिए मिटाएँ?",
      recorded_by: "{worker} द्वारा {facility} में दर्ज किया गया।",
      record_disclaimer: "स्वास्थ्य कार्यकर्ता द्वारा VIA Assist से दर्ज किया गया। परिणाम स्वास्थ्य कार्यकर्ता का दृश्य मूल्यांकन है, सॉफ़्टवेयर द्वारा निदान नहीं।",

      fu_title: "फ़ॉलो-अप ट्रैकर",
      tab_overdue: "बकाया", tab_upcoming: "आने वाले",
      tab_completed: "पूर्ण", tab_lost: "छूटे",
      fu_empty: "अभी यहाँ कुछ नहीं।",
      due_on: "नियत {date}",
      overdue_by: "{n} दिन बकाया",
      due_today: "आज देय",
      in_days: "{n} दिन में",
      referred_to: "{to} पर रेफ़र",

      learn_title: "सीखें, VIA पैटर्न",
      learn_intro: "सामान्य VIA निष्कर्षों के आरेखीय चित्र। मिलाकर देखें कि आपको क्या दिखता है।",
      learn_source: "स्रोत: IARC/WHO VIA एटलस व मैनुअल; एब्लेशन योग्यता हेतु WHO स्क्रीन-एंड-ट्रीट मार्गदर्शन।",
      legend_os: "बाहरी मुख (os)",
      legend_scj: "SCJ (बिंदु रेखा)",
      legend_col: "स्तंभ उपकला",
      legend_aw: "एसिटोव्हाइट",
      l1_t: "एसिटोव्हाइट नहीं", l1_d: "सामान्य ग्रीवा, VIA निगेटिव।",
      l2_t: "हल्का / धब्बेदार सफ़ेद", l2_d: "पारभासी एसिटोव्हाइट, VIA निगेटिव।",
      l3_t: "गाढ़ा सफ़ेद, SCJ से दूर", l3_d: "गाढ़ा क्षेत्र पर SCJ को नहीं छूता, VIA निगेटिव।",
      l4_t: "गाढ़ा सफ़ेद SCJ को छूता", l4_d: "गाढ़ा, स्पष्ट एसिटोव्हाइट SCJ को छूता, VIA पॉज़िटिव।",
      l5_t: "बड़ा घाव (>75%)", l5_d: "ग्रीवा का अधिकांश भाग गाढ़ा एसिटोव्हाइट, VIA पॉज़िटिव, रेफ़र करें।",
      l6_t: "वृद्धि / रक्तस्राव", l6_d: "फूलगोभी जैसी वृद्धि, रक्तस्राव के धब्बे, कैंसर के लिए संदिग्ध।",
      l7_t: "SCJ दिखाई नहीं देता", l7_d: "SCJ दिखाई नहीं देता, अनिश्चित, कोल्पोस्कोपी के लिए रेफ़र करें।",

      wa_followup: "नमस्ते {name}। मैं {worker}, {facility} से। आपकी सर्वाइकल स्क्रीनिंग जाँच के लिए {to} पर फ़ॉलो-अप ज़रूरी है। कृपया {date} तक जाएँ। यह संदेश साथ लाएँ। धन्यवाद।",
      wa_negative: "नमस्ते {name}। मैं {worker}, {facility} से। आपकी सर्वाइकल स्क्रीनिंग का परिणाम सामान्य था। अगली स्क्रीनिंग {date} को है। धन्यवाद।",

      demo_tag: "डेमो",
      toast_deleted: "सारा डेटा मिटा दिया गया।",
      err_checklist: "कृपया पहले सभी प्रश्नों के उत्तर दें।",
      screened_on: "जाँच की तारीख",
      days: "दिन",
      not_recorded: "-"
    }
  };

  let lang = 'en';

  /* Translate a key, with optional {var} substitution */
  function t(key, vars) {
    const table = dicts[lang] || dicts.en;
    let s = table[key] != null ? table[key] : (dicts.en[key] != null ? dicts.en[key] : key);
    if (vars) {
      for (const k in vars) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      }
    }
    return s;
  }

  function set(newLang) {
    lang = dicts[newLang] ? newLang : 'en';
    if (typeof Settings !== 'undefined') Settings.set('lang', lang);
    document.documentElement.lang = lang;
  }

  function init() {
    const saved = (typeof Settings !== 'undefined') ? Settings.get('lang') : null;
    lang = dicts[saved] ? saved : 'en';
    document.documentElement.lang = lang;
  }

  /* Translate every [data-i18n] and [data-i18n-aria] element in the document */
  function applyStatic(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    (root || document).querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
  }

  return { t, set, init, applyStatic, get lang() { return lang; } };
})();

/* Shorthand used everywhere */
function t(key, vars) { return I18N.t(key, vars); }