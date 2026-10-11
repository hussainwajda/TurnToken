import type { Message } from "./types";

export const tour = {
  "tour.start": { en: "Take a tour", hi: "टूर देखें", mr: "टूर पहा" },
  "tour.next": { en: "Next", hi: "आगे", mr: "पुढे" },
  "tour.back": { en: "Back", hi: "पीछे", mr: "मागे" },
  "tour.skip": { en: "Skip tour", hi: "टूर छोड़ें", mr: "टूर वगळा" },
  "tour.done": { en: "Got it", hi: "समझ गया", mr: "समजले" },
  "tour.close": { en: "Close tour", hi: "टूर बंद करें", mr: "टूर बंद करा" },
  "tour.progress": {
    en: "Step {n} of {total}",
    hi: "चरण {n} / {total}",
    mr: "पायरी {n} / {total}",
  },

  "tour.welcome.title": {
    en: "Welcome to your dashboard",
    hi: "आपके डैशबोर्ड में स्वागत है",
    mr: "तुमच्या डॅशबोर्डमध्ये स्वागत आहे",
  },
  "tour.welcome.body": {
    en: "This is where you run your queue. It takes about a minute to see how everything works — you can leave any time and restart from the “Take a tour” button.",
    hi: "यहीं से आप अपनी कतार चलाते हैं। सब कुछ कैसे काम करता है, यह देखने में लगभग एक मिनट लगेगा — आप कभी भी बाहर निकल सकते हैं और “टूर देखें” बटन से दोबारा शुरू कर सकते हैं।",
    mr: "येथून तुम्ही तुमची रांग चालवता. सर्व काही कसे चालते हे पाहण्यासाठी सुमारे एक मिनिट लागेल — तुम्ही कधीही बाहेर पडू शकता आणि “टूर पहा” बटणावरून पुन्हा सुरू करू शकता.",
  },
  "tour.counters.title": {
    en: "Your counters",
    hi: "आपके काउंटर",
    mr: "तुमचे काउंटर",
  },
  "tour.counters.body": {
    en: "Each card is one service desk. Press “Call next” to bring the next waiting customer to that counter. When they are being served, tap “Mark served” when done, or “Skip” if they didn't show up.",
    hi: "हर कार्ड एक सर्विस डेस्क है। अगले प्रतीक्षारत ग्राहक को उस काउंटर पर बुलाने के लिए “अगला बुलाएँ” दबाएँ। सेवा पूरी होने पर “सेवा पूरी करें” दबाएँ, या ग्राहक न आए तो “छोड़ें” दबाएँ।",
    mr: "प्रत्येक कार्ड म्हणजे एक सेवा डेस्क. प्रतीक्षेतील पुढच्या ग्राहकाला त्या काउंटरवर बोलवण्यासाठी “पुढचा बोलवा” दाबा. सेवा झाल्यावर “सेवा पूर्ण करा” दाबा, किंवा ग्राहक आला नाही तर “वगळा” दाबा.",
  },
  "tour.pause.title": {
    en: "Pause the queue",
    hi: "कतार रोकें",
    mr: "रांग थांबवा",
  },
  "tour.pause.body": {
    en: "Going on a break? Pause the queue so no new customers can join. People already waiting keep their place. Resume whenever you're ready.",
    hi: "ब्रेक पर जा रहे हैं? कतार रोक दें ताकि नए ग्राहक न जुड़ सकें। पहले से इंतज़ार कर रहे लोगों की जगह बनी रहती है। तैयार होने पर फिर शुरू करें।",
    mr: "ब्रेकवर जात आहात? रांग थांबवा म्हणजे नवीन ग्राहक सामील होऊ शकणार नाहीत. आधीच थांबलेल्या लोकांची जागा कायम राहते. तयार झाल्यावर पुन्हा सुरू करा.",
  },
  "tour.waiting.title": {
    en: "The waiting list",
    hi: "प्रतीक्षा सूची",
    mr: "प्रतीक्षा यादी",
  },
  "tour.waiting.body": {
    en: "Everyone in line, in order, with an estimated wait. You can cancel a ticket here. Customers you skipped appear in a separate “Skipped” list, where you can restore them.",
    hi: "कतार में लगे सभी लोग, क्रम से, अनुमानित प्रतीक्षा समय के साथ। यहाँ से आप टिकट रद्द कर सकते हैं। जिन्हें आपने छोड़ा, वे अलग “छोड़े गए” सूची में दिखते हैं, जहाँ से उन्हें वापस जोड़ सकते हैं।",
    mr: "रांगेतील सर्वजण, क्रमाने, अंदाजे प्रतीक्षा वेळेसह. येथून तुम्ही तिकीट रद्द करू शकता. तुम्ही वगळलेले ग्राहक वेगळ्या “वगळलेले” यादीत दिसतात, तिथून त्यांना परत जोडता येते.",
  },
  "tour.stats.title": {
    en: "Today at a glance",
    hi: "आज एक नज़र में",
    mr: "आज एका नजरेत",
  },
  "tour.stats.body": {
    en: "See how many people are waiting, how many you've served today, the average wait, your busiest hour and your most popular services. It updates live.",
    hi: "देखें कितने लोग इंतज़ार कर रहे हैं, आज कितनों को सेवा दी, औसत प्रतीक्षा, सबसे व्यस्त घंटा और सबसे लोकप्रिय सेवाएँ। यह लाइव अपडेट होता है।",
    mr: "किती लोक थांबले आहेत, आज किती जणांना सेवा दिली, सरासरी प्रतीक्षा, सर्वात व्यस्त तास आणि सर्वात लोकप्रिय सेवा पहा. हे लाइव्ह अपडेट होते.",
  },
  "tour.services.title": {
    en: "Services",
    hi: "सेवाएँ",
    mr: "सेवा",
  },
  "tour.services.body": {
    en: "Add what customers can queue for — a haircut, a consultation, a repair. Give each service its own typical time so waiting estimates stay accurate.",
    hi: "वे सेवाएँ जोड़ें जिनके लिए ग्राहक कतार में लग सकें — जैसे बाल कटवाना, परामर्श, मरम्मत। हर सेवा का अपना सामान्य समय दें ताकि प्रतीक्षा का अनुमान सही रहे।",
    mr: "ग्राहक ज्यासाठी रांगेत उभे राहू शकतात त्या सेवा जोडा — केस कापणे, सल्लामसलत, दुरुस्ती. प्रत्येक सेवेसाठी तिचा सामान्य वेळ द्या म्हणजे प्रतीक्षेचा अंदाज अचूक राहील.",
  },
  "tour.countersPage.title": {
    en: "Manage counters",
    hi: "काउंटर प्रबंधित करें",
    mr: "काउंटर व्यवस्थापित करा",
  },
  "tour.countersPage.body": {
    en: "Add or switch off counters, and choose which services each one handles. Customers are only offered to counters that can serve them.",
    hi: "काउंटर जोड़ें या बंद करें, और चुनें कि हर काउंटर कौन-सी सेवाएँ संभालता है। ग्राहक केवल उन्हीं काउंटरों को दिखाए जाते हैं जो उन्हें सेवा दे सकते हैं।",
    mr: "काउंटर जोडा किंवा बंद करा आणि प्रत्येक काउंटर कोणत्या सेवा हाताळतो ते निवडा. ग्राहक फक्त त्यांना सेवा देऊ शकणाऱ्या काउंटरकडेच दाखवले जातात.",
  },
  "tour.settings.title": {
    en: "Settings",
    hi: "सेटिंग",
    mr: "सेटिंग्ज",
  },
  "tour.settings.body": {
    en: "Tune how your queue behaves — the grace timer for called customers, how long a skipped customer can still return, and your default service time.",
    hi: "अपनी कतार का व्यवहार तय करें — बुलाए गए ग्राहक के लिए ग्रेस टाइमर, छोड़ा गया ग्राहक कितनी देर तक लौट सकता है, और सामान्य सेवा समय।",
    mr: "तुमची रांग कशी चालेल ते ठरवा — बोलावलेल्या ग्राहकासाठी ग्रेस टायमर, वगळलेला ग्राहक किती वेळ परत येऊ शकतो आणि सामान्य सेवा वेळ.",
  },
  "tour.poster.title": {
    en: "QR poster",
    hi: "QR पोस्टर",
    mr: "QR पोस्टर",
  },
  "tour.poster.body": {
    en: "Print this poster and put it at your entrance. Customers scan the QR code with their phone to join the queue and track their turn — no app needed.",
    hi: "यह पोस्टर प्रिंट करके अपनी दुकान के प्रवेश पर लगाएँ। ग्राहक अपने फ़ोन से QR कोड स्कैन करके कतार में जुड़ते हैं और अपनी बारी देखते हैं — किसी ऐप की ज़रूरत नहीं।",
    mr: "हे पोस्टर प्रिंट करून तुमच्या प्रवेशद्वारावर लावा. ग्राहक फोनने QR कोड स्कॅन करून रांगेत सामील होतात आणि त्यांचा नंबर पाहतात — ॲपची गरज नाही.",
  },
  "tour.finish.title": {
    en: "You're all set",
    hi: "आप तैयार हैं",
    mr: "तुम्ही तयार आहात",
  },
  "tour.finish.body": {
    en: "A good first step: add your services and counters, then print the QR poster. You can replay this tour any time with the “Take a tour” button.",
    hi: "शुरुआत के लिए: अपनी सेवाएँ और काउंटर जोड़ें, फिर QR पोस्टर प्रिंट करें। “टूर देखें” बटन से आप यह टूर कभी भी दोबारा देख सकते हैं।",
    mr: "सुरुवातीसाठी: तुमच्या सेवा आणि काउंटर जोडा, मग QR पोस्टर प्रिंट करा. “टूर पहा” बटणाने तुम्ही हा टूर कधीही पुन्हा पाहू शकता.",
  },
} satisfies Record<string, Message>;
