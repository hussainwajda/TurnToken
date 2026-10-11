import type { Message } from "./types";

export const customer = {
  // ── Join page ──────────────────────────────────────────────────────
  "join.title": { en: "What do you need today?", hi: "आज आपको क्या चाहिए?", mr: "आज तुम्हाला काय हवे आहे?" },
  "join.subtitle": {
    en: "Pick everything you'd like done in one visit — we'll line you up for all of it at once.",
    hi: "एक ही बार में जो भी करवाना चाहें चुनें — हम आपको उन सबके लिए एक साथ लाइन में लगा देंगे।",
    mr: "एकाच भेटीत जे काही करून घ्यायचे आहे ते निवडा — आम्ही तुम्हाला त्या सर्वांसाठी एकत्र रांगेत लावू.",
  },
  "join.approxMin": { en: "~{n} min", hi: "~{n} मिनट", mr: "~{n} मिनिटे" },
  "join.joining": { en: "Joining…", hi: "जुड़ रहे हैं…", mr: "सामील होत आहे…" },
  "join.selectOne": { en: "Select a service to continue", hi: "आगे बढ़ने के लिए एक सेवा चुनें", mr: "पुढे जाण्यासाठी एक सेवा निवडा" },
  "join.joinQueue": { en: "Join queue · ~{n} min", hi: "लाइन में जुड़ें · ~{n} मिनट", mr: "रांगेत सामील व्हा · ~{n} मिनिटे" },
  "join.notSure": { en: "Not sure — just add me to the line", hi: "पक्का नहीं — बस मुझे लाइन में जोड़ दें", mr: "नक्की नाही — मला फक्त रांगेत जोडा" },
  "join.err.paused.title": { en: "This queue is paused right now", hi: "यह कतार अभी रुकी हुई है", mr: "ही रांग सध्या थांबवलेली आहे" },
  "join.err.paused.body": {
    en: "The shop has paused new tickets for the moment. Please check with the counter.",
    hi: "दुकान ने फ़िलहाल नए टिकट रोक दिए हैं। कृपया काउंटर पर पूछें।",
    mr: "दुकानाने सध्या नवीन तिकिटे थांबवली आहेत. कृपया काउंटरवर विचारा.",
  },
  "join.err.notFound.title": { en: "We couldn't find that shop", hi: "हमें वह दुकान नहीं मिली", mr: "ती दुकान आम्हाला सापडली नाही" },
  "join.err.notFound.body": {
    en: "The poster you scanned may be out of date.",
    hi: "आपके स्कैन किया हुआ पोस्टर पुराना हो सकता है।",
    mr: "तुम्ही स्कॅन केलेले पोस्टर जुने असू शकते.",
  },
  "join.err.generic.title": { en: "This queue isn't available right now", hi: "यह कतार अभी उपलब्ध नहीं है", mr: "ही रांग सध्या उपलब्ध नाही" },
  "join.err.generic.body": {
    en: "The poster you scanned may be out of date, or something went wrong. Please check with the counter.",
    hi: "आपका स्कैन किया पोस्टर पुराना हो सकता है, या कुछ गड़बड़ हुई है। कृपया काउंटर पर पूछें।",
    mr: "तुम्ही स्कॅन केलेले पोस्टर जुने असू शकते, किंवा काहीतरी चूक झाली आहे. कृपया काउंटरवर विचारा.",
  },
  "join.err.rateLimit": {
    en: "Too many tickets requested from this device — please wait a minute and try again.",
    hi: "इस डिवाइस से बहुत ज़्यादा टिकट माँगे गए — कृपया एक मिनट रुककर फिर कोशिश करें।",
    mr: "या डिव्हाइसवरून खूप जास्त तिकिटे मागितली गेली — कृपया एक मिनिट थांबून पुन्हा प्रयत्न करा.",
  },
  "join.err.badService": {
    en: "One of the services you picked is no longer available. Please try again.",
    hi: "आपकी चुनी हुई एक सेवा अब उपलब्ध नहीं है। कृपया फिर कोशिश करें।",
    mr: "तुम्ही निवडलेली एक सेवा आता उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.",
  },

  // ── Ticket status page ─────────────────────────────────────────────
  "status.waiting": { en: "Waiting in line", hi: "लाइन में इंतज़ार", mr: "रांगेत प्रतीक्षा" },
  "status.called": { en: "Called — head to the counter", hi: "बुलाया गया — काउंटर पर जाएँ", mr: "बोलावले — काउंटरकडे जा" },
  "status.serving": { en: "You're being served", hi: "आपको सेवा दी जा रही है", mr: "तुम्हाला सेवा दिली जात आहे" },
  "status.done": { en: "Served — thank you", hi: "सेवा पूरी — धन्यवाद", mr: "सेवा पूर्ण — धन्यवाद" },
  "status.skipped": {
    en: "Skipped — return soon to keep your place",
    hi: "छोड़ दिया गया — अपनी जगह रखने के लिए जल्दी लौटें",
    mr: "वगळले — तुमची जागा राखण्यासाठी लवकर परत या",
  },
  "status.restored": { en: "Restored — you're back in line", hi: "वापस जोड़ा गया — आप फिर से लाइन में हैं", mr: "परत घेतले — तुम्ही पुन्हा रांगेत आहात" },
  "status.expired": { en: "This ticket has expired", hi: "यह टिकट समाप्त हो गया है", mr: "हे तिकीट कालबाह्य झाले आहे" },
  "status.cancelled": { en: "Ticket cancelled", hi: "टिकट रद्द कर दिया गया", mr: "तिकीट रद्द केले" },
  "status.next": { en: "You're next", hi: "अगली बारी आपकी है", mr: "पुढची पाळी तुमची आहे" },
  "status.aheadOne": { en: "1 person ahead", hi: "आपसे आगे 1 व्यक्ति", mr: "तुमच्या पुढे 1 व्यक्ती" },
  "status.aheadMany": { en: "{n} people ahead", hi: "आपसे आगे {n} लोग", mr: "तुमच्या पुढे {n} जण" },
  "status.about": { en: "about {n} min", hi: "लगभग {n} मिनट", mr: "सुमारे {n} मिनिटे" },
  "status.headTo": { en: "Head to {counter}", hi: "{counter} पर जाएँ", mr: "{counter} कडे जा" },
  "status.notFound": {
    en: "We couldn't find this ticket. It may have expired.",
    hi: "हमें यह टिकट नहीं मिला। यह समाप्त हो चुका हो सकता है।",
    mr: "हे तिकीट आम्हाला सापडले नाही. ते कालबाह्य झाले असू शकते.",
  },
  "status.loading": { en: "Loading your ticket…", hi: "आपका टिकट लोड हो रहा है…", mr: "तुमचे तिकीट लोड होत आहे…" },
  "status.whatsapp": { en: "Or get notified on WhatsApp", hi: "या व्हाट्सऐप पर सूचना पाएँ", mr: "किंवा व्हॉट्सअ‍ॅपवर सूचना मिळवा" },
  "status.cancel": { en: "Cancel my ticket", hi: "मेरा टिकट रद्द करें", mr: "माझे तिकीट रद्द करा" },
  "status.cancelling": { en: "Cancelling…", hi: "रद्द हो रहा है…", mr: "रद्द होत आहे…" },
  "status.cancelError": {
    en: "Couldn't cancel your ticket. Please try again.",
    hi: "आपका टिकट रद्द नहीं हो सका। कृपया फिर कोशिश करें।",
    mr: "तुमचे तिकीट रद्द करता आले नाही. कृपया पुन्हा प्रयत्न करा.",
  },
  "status.powered": { en: "Powered by Turn-Token", hi: "Turn-Token द्वारा संचालित", mr: "Turn-Token द्वारे संचालित" },
  "push.on": {
    en: "Alerts on — we'll notify this device when it's almost your turn.",
    hi: "अलर्ट चालू — आपकी बारी लगभग आने पर हम इस डिवाइस को सूचित करेंगे।",
    mr: "अलर्ट चालू — तुमची पाळी जवळ आल्यावर आम्ही या डिव्हाइसला कळवू.",
  },
  "push.denied": {
    en: "Notifications are blocked in your browser settings. Enable them there to get an alert when it's almost your turn.",
    hi: "आपके ब्राउज़र की सेटिंग में नोटिफ़िकेशन बंद हैं। बारी लगभग आने पर अलर्ट पाने के लिए उन्हें वहाँ चालू करें।",
    mr: "तुमच्या ब्राउझर सेटिंगमध्ये नोटिफिकेशन बंद आहेत. पाळी जवळ आल्यावर अलर्ट मिळण्यासाठी तिथे ते चालू करा.",
  },
  "push.error": { en: "Couldn't turn on alerts.", hi: "अलर्ट चालू नहीं हो सके।", mr: "अलर्ट चालू करता आले नाहीत." },
  "push.retry": { en: "Try again", hi: "फिर कोशिश करें", mr: "पुन्हा प्रयत्न करा" },
  "push.enabling": { en: "Enabling…", hi: "चालू हो रहा है…", mr: "चालू होत आहे…" },
  "push.enable": { en: "Notify me when it's my turn", hi: "मेरी बारी आने पर मुझे बताएँ", mr: "माझी पाळी आल्यावर मला कळवा" },
  "wa.message": {
    en: "Hi {business}! I'm ticket #{number}. Please notify me on WhatsApp when it's almost my turn or when I'm called.",
    hi: "नमस्ते {business}! मेरा टिकट नंबर #{number} है। जब मेरी बारी लगभग आए या मुझे बुलाया जाए तो कृपया मुझे व्हाट्सऐप पर बताएँ।",
    mr: "नमस्कार {business}! माझा तिकीट क्रमांक #{number} आहे. माझी पाळी जवळ आल्यावर किंवा मला बोलावल्यावर कृपया मला व्हॉट्सअ‍ॅपवर कळवा.",
  },
} satisfies Record<string, Message>;
