import type { Message } from "./types";

export const common = {
  "meta.title": {
    en: "Turn-Token — QR queue management for local businesses",
    hi: "Turn-Token — स्थानीय दुकानों के लिए QR कतार प्रबंधन",
    mr: "Turn-Token — स्थानिक व्यवसायांसाठी QR रांग व्यवस्थापन",
  },
  "meta.description": {
    en: "Customers scan a poster, get a live ticket, and know their wait. Shop owners run the whole line from one dashboard.",
    hi: "ग्राहक पोस्टर स्कैन करते हैं, लाइव टिकट पाते हैं और अपना इंतज़ार जान लेते हैं। दुकानदार पूरी लाइन एक ही डैशबोर्ड से चलाते हैं।",
    mr: "ग्राहक पोस्टर स्कॅन करतात, लाइव्ह तिकीट मिळवतात आणि आपली प्रतीक्षा जाणून घेतात. दुकानदार संपूर्ण रांग एकाच डॅशबोर्डवरून चालवतात.",
  },
  "language.label": {
    en: "Language",
    hi: "भाषा",
    mr: "भाषा",
  },
  "common.back": {
    en: "← Back to dashboard",
    hi: "← डैशबोर्ड पर वापस जाएँ",
    mr: "← डॅशबोर्डवर परत जा",
  },
  "common.checkingSession": {
    en: "Checking your session…",
    hi: "आपका सत्र जाँचा जा रहा है…",
    mr: "तुमचे सत्र तपासले जात आहे…",
  },
  "common.oneMoment": {
    en: "One moment…",
    hi: "एक पल…",
    mr: "एक क्षण…",
  },
  "common.loading": {
    en: "Loading…",
    hi: "लोड हो रहा है…",
    mr: "लोड होत आहे…",
  },
  "common.notYourShop": {
    en: "This isn't your shop",
    hi: "यह आपकी दुकान नहीं है",
    mr: "ही तुमची दुकान नाही",
  },
  "common.notYourShopBody": {
    en: "You're logged in, but this business belongs to a different account.",
    hi: "आप लॉग इन हैं, लेकिन यह व्यवसाय किसी दूसरे खाते का है।",
    mr: "तुम्ही लॉग इन आहात, पण हा व्यवसाय दुसऱ्या खात्याचा आहे.",
  },
  "common.businessNotFound": {
    en: "We couldn't find that business",
    hi: "हमें वह व्यवसाय नहीं मिला",
    mr: "तो व्यवसाय आम्हाला सापडला नाही",
  },
  "common.minutesShort": {
    en: "{n} min",
    hi: "{n} मिनट",
    mr: "{n} मिनिटे",
  },
  "common.minutesLong": {
    en: "{n} minutes",
    hi: "{n} मिनट",
    mr: "{n} मिनिटे",
  },
  "common.minAbbr": {
    en: "min",
    hi: "मिनट",
    mr: "मि.",
  },
  "common.disabled": {
    en: "(disabled)",
    hi: "(बंद)",
    mr: "(बंद)",
  },
  "common.dismiss": {
    en: "Dismiss",
    hi: "बंद करें",
    mr: "बंद करा",
  },
  "common.add": { en: "Add", hi: "जोड़ें", mr: "जोडा" },
  "common.adding": { en: "Adding…", hi: "जोड़ा जा रहा है…", mr: "जोडत आहे…" },
  "common.saving": { en: "Saving…", hi: "सहेजा जा रहा है…", mr: "जतन करत आहे…" },
  "common.saved": { en: "Saved.", hi: "सहेज लिया गया।", mr: "जतन केले." },
  "common.categoryLabel": { en: "Category", hi: "श्रेणी", mr: "श्रेणी" },
  "category.Salon": { en: "Salon", hi: "सैलून", mr: "सलून" },
  "category.Clinic": { en: "Clinic", hi: "क्लिनिक", mr: "क्लिनिक" },
  "category.Repair shop": {
    en: "Repair shop",
    hi: "मरम्मत की दुकान",
    mr: "दुरुस्तीचे दुकान",
  },
  "category.Service counter": {
    en: "Service counter",
    hi: "सर्विस काउंटर",
    mr: "सर्व्हिस काउंटर",
  },
  "category.Other": { en: "Other", hi: "अन्य", mr: "इतर" },

  // Backend error messages (matched by exact English text; see apiErrors.ts)
  "err.duplicateEmail": {
    en: "A business is already registered with this email.",
    hi: "इस ईमेल से एक व्यवसाय पहले ही पंजीकृत है।",
    mr: "या ईमेलवर एक व्यवसाय आधीच नोंदणीकृत आहे.",
  },
  "err.duplicatePhone": {
    en: "A business is already registered with this phone number.",
    hi: "इस फ़ोन नंबर से एक व्यवसाय पहले ही पंजीकृत है।",
    mr: "या फोन नंबरवर एक व्यवसाय आधीच नोंदणीकृत आहे.",
  },
  "err.duplicateAccount": {
    en: "This account already has a business registered to it.",
    hi: "इस खाते में पहले से एक व्यवसाय पंजीकृत है।",
    mr: "या खात्यावर आधीच एक व्यवसाय नोंदणीकृत आहे.",
  },
  "err.rateLimit": {
    en: "Too many requests — please slow down and try again shortly.",
    hi: "बहुत ज़्यादा अनुरोध — कृपया थोड़ा रुककर फिर कोशिश करें।",
    mr: "खूप जास्त विनंत्या — कृपया थोडे थांबून पुन्हा प्रयत्न करा.",
  },
  "err.noChanges": {
    en: "No changes provided",
    hi: "कोई बदलाव नहीं किया गया",
    mr: "कोणताही बदल केलेला नाही",
  },
  "err.servicesUnavailable": {
    en: "One or more services are unavailable",
    hi: "एक या अधिक सेवाएँ उपलब्ध नहीं हैं",
    mr: "एक किंवा अधिक सेवा उपलब्ध नाहीत",
  },
  "err.unknownService": {
    en: "Unknown service in allowed_service_ids",
    hi: "चुनी गई सेवाओं में एक अज्ञात सेवा है",
    mr: "निवडलेल्या सेवांमध्ये एक अज्ञात सेवा आहे",
  },
  "err.invalidSession": {
    en: "Invalid session",
    hi: "सत्र मान्य नहीं है",
    mr: "सत्र वैध नाही",
  },
  "err.missingToken": {
    en: "Missing bearer token",
    hi: "लॉगिन जानकारी नहीं मिली",
    mr: "लॉगिन माहिती सापडली नाही",
  },
  "err.notOwner": {
    en: "Not this business's owner",
    hi: "आप इस व्यवसाय के मालिक नहीं हैं",
    mr: "तुम्ही या व्यवसायाचे मालक नाही",
  },
  "err.businessNotFound": {
    en: "Business not found",
    hi: "व्यवसाय नहीं मिला",
    mr: "व्यवसाय सापडला नाही",
  },
  "err.counterNotFound": {
    en: "Counter not found",
    hi: "काउंटर नहीं मिला",
    mr: "काउंटर सापडला नाही",
  },
  "err.noBusinessForOwner": {
    en: "No business found for this owner",
    hi: "इस मालिक के लिए कोई व्यवसाय नहीं मिला",
    mr: "या मालकासाठी कोणताही व्यवसाय सापडला नाही",
  },
  "err.serviceNotFound": {
    en: "Service not found",
    hi: "सेवा नहीं मिली",
    mr: "सेवा सापडली नाही",
  },
  "err.tokenNotFound": {
    en: "Token not found",
    hi: "टिकट नहीं मिला",
    mr: "तिकीट सापडले नाही",
  },
  "err.counterBusy": {
    en: "This counter is already serving someone",
    hi: "यह काउंटर पहले से किसी को सेवा दे रहा है",
    mr: "हा काउंटर आधीच एखाद्याला सेवा देत आहे",
  },
  "err.counterBusy2": {
    en: "This counter is currently serving a customer",
    hi: "यह काउंटर अभी एक ग्राहक को सेवा दे रहा है",
    mr: "हा काउंटर सध्या एका ग्राहकाला सेवा देत आहे",
  },
  "err.counterDisabled": {
    en: "This counter is disabled",
    hi: "यह काउंटर बंद है",
    mr: "हा काउंटर बंद आहे",
  },
  "err.queuePaused": {
    en: "This queue is paused right now",
    hi: "यह कतार अभी रुकी हुई है",
    mr: "ही रांग सध्या थांबवलेली आहे",
  },
  "err.counterCantServe": {
    en: "This counter can't serve this ticket's services",
    hi: "यह काउंटर इस टिकट की सेवाएँ नहीं दे सकता",
    mr: "हा काउंटर या तिकिटाच्या सेवा देऊ शकत नाही",
  },
  "err.server": {
    en: "Something went wrong on our side. Please try again.",
    hi: "हमारी तरफ़ से कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।",
    mr: "आमच्या बाजूने काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
  },
  "err.backendDown": {
    en: "Couldn't reach the server. Check that the backend is running and try again.",
    hi: "सर्वर तक नहीं पहुँच सके। जाँचें कि बैकएंड चालू है और फिर कोशिश करें।",
    mr: "सर्व्हरशी संपर्क होऊ शकला नाही. बॅकएंड चालू आहे का ते तपासा आणि पुन्हा प्रयत्न करा.",
  },
} satisfies Record<string, Message>;
