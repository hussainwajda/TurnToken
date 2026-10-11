import type { Message } from "./types";

export const auth = {
  // ── Login ──────────────────────────────────────────────────────────
  "login.title": { en: "Log in", hi: "लॉग इन", mr: "लॉग इन" },
  "login.subtitle": {
    en: "Get back to your queue dashboard.",
    hi: "अपने कतार डैशबोर्ड पर वापस जाएँ।",
    mr: "तुमच्या रांग डॅशबोर्डवर परत जा.",
  },
  "login.email": { en: "Email", hi: "ईमेल", mr: "ईमेल" },
  "login.password": { en: "Password", hi: "पासवर्ड", mr: "पासवर्ड" },
  "login.submit": { en: "Log in", hi: "लॉग इन", mr: "लॉग इन" },
  "login.submitting": { en: "Logging in…", hi: "लॉग इन हो रहा है…", mr: "लॉग इन होत आहे…" },
  "login.newHere": { en: "New here?", hi: "यहाँ नए हैं?", mr: "इथे नवीन आहात?" },
  "login.setup": { en: "Set up your shop", hi: "अपनी दुकान सेट करें", mr: "तुमची दुकान सेट करा" },
  "login.err.notConfigured": {
    en: "Supabase client is not configured. Check your environment settings.",
    hi: "Supabase क्लाइंट कॉन्फ़िगर नहीं है। अपनी एनवायरनमेंट सेटिंग जाँचें।",
    mr: "Supabase क्लायंट कॉन्फिगर केलेला नाही. तुमची एनव्हायर्नमेंट सेटिंग्ज तपासा.",
  },
  "login.err.generic": {
    en: "Could not log in.",
    hi: "लॉग इन नहीं हो सका।",
    mr: "लॉग इन करता आले नाही.",
  },
  "login.err.backend": {
    en: "Logged in, but couldn't reach the backend. Try again in a moment.",
    hi: "लॉग इन हो गया, लेकिन बैकएंड तक नहीं पहुँच सके। थोड़ी देर में फिर कोशिश करें।",
    mr: "लॉग इन झाले, पण बॅकएंडशी संपर्क होऊ शकला नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.",
  },
  "login.err.finishSetup": {
    en: "Your account is confirmed, but we couldn't finish setting up your business. Check that the backend is running and try again.",
    hi: "आपका खाता कन्फ़र्म हो गया है, लेकिन हम आपका व्यवसाय सेट नहीं कर सके। जाँचें कि बैकएंड चालू है और फिर कोशिश करें।",
    mr: "तुमचे खाते पक्के झाले आहे, पण आम्ही तुमचा व्यवसाय सेट करू शकलो नाही. बॅकएंड चालू आहे का ते तपासा आणि पुन्हा प्रयत्न करा.",
  },

  // ── Signup page ────────────────────────────────────────────────────
  "signup.title": { en: "Set up your shop", hi: "अपनी दुकान सेट करें", mr: "तुमची दुकान सेट करा" },
  "signup.subtitle": {
    en: "Two minutes, and you'll have a QR poster ready to print. You can change every setting here later.",
    hi: "बस दो मिनट, और आपका QR पोस्टर प्रिंट के लिए तैयार होगा। यहाँ की हर सेटिंग बाद में बदली जा सकती है।",
    mr: "फक्त दोन मिनिटे, आणि तुमचे QR पोस्टर प्रिंटसाठी तयार असेल. इथली प्रत्येक सेटिंग नंतर बदलता येते.",
  },
  "signup.section.shop": { en: "About your shop", hi: "आपकी दुकान के बारे में", mr: "तुमच्या दुकानाबद्दल" },
  "signup.name": { en: "Business name", hi: "व्यवसाय का नाम", mr: "व्यवसायाचे नाव" },
  "signup.namePlaceholder": { en: "Ruby Nails & Spa", hi: "रूबी नेल्स एंड स्पा", mr: "रुबी नेल्स अँड स्पा" },
  "signup.email": { en: "Contact email", hi: "संपर्क ईमेल", mr: "संपर्क ईमेल" },
  "signup.password": { en: "Password", hi: "पासवर्ड", mr: "पासवर्ड" },
  "signup.passwordPlaceholder": {
    en: "At least 6 characters",
    hi: "कम से कम 6 अक्षर",
    mr: "किमान 6 अक्षरे",
  },
  "signup.phone": { en: "Contact phone (optional)", hi: "संपर्क फ़ोन (वैकल्पिक)", mr: "संपर्क फोन (ऐच्छिक)" },
  "signup.phoneHelp": {
    en: "A WhatsApp-reachable number lets waiting customers opt into WhatsApp updates from their ticket page.",
    hi: "व्हाट्सऐप पर चालू नंबर देने से इंतज़ार कर रहे ग्राहक अपने टिकट पेज से व्हाट्सऐप अपडेट चुन सकते हैं।",
    mr: "व्हॉट्सअ‍ॅपवर चालू असलेला नंबर दिल्यास प्रतीक्षेतील ग्राहक त्यांच्या तिकीट पेजवरून व्हॉट्सअ‍ॅप अपडेट निवडू शकतात.",
  },
  "signup.submit": { en: "Create my queue", hi: "मेरी कतार बनाएँ", mr: "माझी रांग तयार करा" },
  "signup.submitting": { en: "Creating your queue…", hi: "आपकी कतार बन रही है…", mr: "तुमची रांग तयार होत आहे…" },
  "signup.haveShop": { en: "Already have a shop?", hi: "पहले से दुकान है?", mr: "आधीच दुकान आहे?" },
  "signup.login": { en: "Log in", hi: "लॉग इन करें", mr: "लॉग इन करा" },
  "signup.checkEmail.title": { en: "Check your email", hi: "अपना ईमेल देखें", mr: "तुमचा ईमेल तपासा" },
  "signup.checkEmail.body": {
    en: "We sent a confirmation link to {email}. Confirm your address, then come back and log in to finish setting up your shop.",
    hi: "हमने {email} पर एक कन्फ़र्मेशन लिंक भेजा है। अपना पता कन्फ़र्म करें, फिर वापस आकर लॉग इन करें और दुकान का सेटअप पूरा करें।",
    mr: "आम्ही {email} वर कन्फर्मेशन लिंक पाठवली आहे. तुमचा पत्ता पक्का करा, नंतर परत येऊन लॉग इन करा आणि दुकानाचे सेटअप पूर्ण करा.",
  },
  "signup.err.expired": {
    en: "Your session had expired. Please sign up again.",
    hi: "आपका सत्र समाप्त हो गया था। कृपया फिर से साइन अप करें।",
    mr: "तुमचे सत्र संपले होते. कृपया पुन्हा साइन अप करा.",
  },
  "signup.err.setup": {
    en: "Couldn't set up your business. Check that the backend is running and try again.",
    hi: "आपका व्यवसाय सेट नहीं हो सका। जाँचें कि बैकएंड चालू है और फिर कोशिश करें।",
    mr: "तुमचा व्यवसाय सेट होऊ शकला नाही. बॅकएंड चालू आहे का ते तपासा आणि पुन्हा प्रयत्न करा.",
  },
  "signup.err.exists": {
    en: "An account with this email already exists. Log in instead.",
    hi: "इस ईमेल से खाता पहले से है। इसके बजाय लॉग इन करें।",
    mr: "या ईमेलने खाते आधीच आहे. त्याऐवजी लॉग इन करा.",
  },
  "signup.err.accountCreated": {
    en: "Your account was created, but we couldn't set up your business. Check that the backend is running and try logging in.",
    hi: "आपका खाता बन गया, लेकिन व्यवसाय सेट नहीं हो सका। जाँचें कि बैकएंड चालू है और लॉग इन करके देखें।",
    mr: "तुमचे खाते तयार झाले, पण व्यवसाय सेट होऊ शकला नाही. बॅकएंड चालू आहे का ते तपासा आणि लॉग इन करून पहा.",
  },
  "signup.err.save": {
    en: "Couldn't save your changes. Try again.",
    hi: "आपके बदलाव सहेजे नहीं जा सके। फिर कोशिश करें।",
    mr: "तुमचे बदल जतन करता आले नाहीत. पुन्हा प्रयत्न करा.",
  },

  // ── Register a business (/admin) ──────────────────────────────────
  "register.eyebrow": { en: "Admin", hi: "एडमिन", mr: "अ‍ॅडमिन" },
  "register.title": { en: "Register a business", hi: "व्यवसाय दर्ज करें", mr: "व्यवसाय नोंदवा" },
  "register.subtitle": {
    en: "Create a queue for a new location. You can adjust these settings later from its dashboard.",
    hi: "किसी नई जगह के लिए कतार बनाएँ। ये सेटिंग आप बाद में उसके डैशबोर्ड से बदल सकते हैं।",
    mr: "नवीन ठिकाणासाठी रांग तयार करा. या सेटिंग्ज तुम्ही नंतर त्याच्या डॅशबोर्डवरून बदलू शकता.",
  },
  "register.superAdmin": { en: "Super Admin Hub →", hi: "सुपर एडमिन हब →", mr: "सुपर अ‍ॅडमिन हब →" },
  "register.home": { en: "Home", hi: "होम", mr: "मुख्यपृष्ठ" },
  "register.submit": { en: "Register business", hi: "व्यवसाय दर्ज करें", mr: "व्यवसाय नोंदवा" },
  "register.submitting": { en: "Registering business...", hi: "व्यवसाय दर्ज हो रहा है...", mr: "व्यवसाय नोंदवत आहे..." },
  "register.err": {
    en: "Could not register this business.",
    hi: "यह व्यवसाय दर्ज नहीं हो सका।",
    mr: "हा व्यवसाय नोंदवता आला नाही.",
  },

  // ── Queue settings explainer (signup + settings page) ─────────────
  "qs.title": { en: "Queue settings", hi: "कतार की सेटिंग", mr: "रांगेची सेटिंग्ज" },
  "qs.intro": {
    en: "These settings decide how your line behaves. Not sure what to pick? Leave the numbers as they are — they work well for most shops, and you can change them any time.",
    hi: "ये सेटिंग तय करती हैं कि आपकी लाइन कैसे चलेगी। समझ नहीं आ रहा क्या चुनें? नंबर जैसे हैं वैसे रहने दें — ज़्यादातर दुकानों के लिए वे ठीक काम करते हैं, और आप कभी भी बदल सकते हैं।",
    mr: "या सेटिंग्ज तुमची रांग कशी चालेल हे ठरवतात. काय निवडावे ते कळत नाही का? आकडे जसे आहेत तसेच ठेवा — बहुतेक दुकानांसाठी ते चांगले काम करतात, आणि तुम्ही ते केव्हाही बदलू शकता.",
  },
  "qs.flow.title": {
    en: "What happens to a customer, step by step",
    hi: "एक ग्राहक के साथ क्या होता है, कदम दर कदम",
    mr: "एका ग्राहकासोबत काय होते, पायरी पायरीने",
  },
  "qs.flow.1.title": { en: "Waiting", hi: "इंतज़ार में", mr: "प्रतीक्षेत" },
  "qs.flow.1.body": {
    en: "The customer scans your poster and gets a ticket number.",
    hi: "ग्राहक आपका पोस्टर स्कैन करके टिकट नंबर पाता है।",
    mr: "ग्राहक तुमचे पोस्टर स्कॅन करून तिकीट क्रमांक मिळवतो.",
  },
  "qs.flow.2.title": { en: "Called", hi: "बुलाया गया", mr: "बोलावले" },
  "qs.flow.2.body": {
    en: "You press “Call next”. The grace timer starts now.",
    hi: "आप “अगला बुलाएँ” दबाते हैं। छूट का टाइमर अभी से शुरू होता है।",
    mr: "तुम्ही “पुढचा बोलवा” दाबता. ग्रेस टायमर आता सुरू होतो.",
  },
  "qs.flow.3.title": { en: "Skipped", hi: "छोड़ दिया गया", mr: "वगळले" },
  "qs.flow.3.body": {
    en: "They didn't arrive in time. The next person is called. The hold window starts now.",
    hi: "वे समय पर नहीं पहुँचे। अगले व्यक्ति को बुलाया जाता है। होल्ड विंडो अभी से शुरू होती है।",
    mr: "ते वेळेवर पोहोचले नाहीत. पुढच्या व्यक्तीला बोलावले जाते. होल्ड विंडो आता सुरू होते.",
  },
  "qs.flow.4.title": { en: "Expired", hi: "समाप्त", mr: "कालबाह्य" },
  "qs.flow.4.body": {
    en: "Still no sign of them. The ticket is closed for good.",
    hi: "अब भी कोई खबर नहीं। टिकट हमेशा के लिए बंद हो जाता है।",
    mr: "अजूनही पत्ता नाही. तिकीट कायमचे बंद होते.",
  },
  "qs.infoAria": { en: "More about: {name}", hi: "इसके बारे में और जानें: {name}", mr: "याबद्दल अधिक: {name}" },
  "qs.flow.button": { en: "How the line works", hi: "लाइन कैसे चलती है", mr: "रांग कशी चालते" },
  "qs.exampleLabel": { en: "Example", hi: "उदाहरण", mr: "उदाहरण" },

  "qs.grace.label": { en: "Grace timer (minutes)", hi: "छूट का टाइमर / ग्रेस टाइमर (मिनट)", mr: "सवलतीचा टायमर / ग्रेस टायमर (मिनिटे)" },
  "qs.grace.short": { en: "How long you wait for a called customer to arrive.", hi: "बुलाए गए ग्राहक के आने का इंतज़ार कितनी देर करें।", mr: "बोलावलेल्या ग्राहकाची किती वेळ वाट पाहायची." },
  "qs.grace.what": {
    en: "After you call a customer, this is how long you wait for them to reach your counter. If they haven't come in time, the system moves them aside so the next person isn't kept waiting.",
    hi: "किसी ग्राहक को बुलाने के बाद, आप उसके काउंटर तक पहुँचने का इतना समय इंतज़ार करते हैं। अगर वह समय पर नहीं आया, तो सिस्टम उसे एक तरफ़ कर देता है ताकि अगले व्यक्ति को इंतज़ार न करना पड़े।",
    mr: "एखाद्या ग्राहकाला बोलावल्यानंतर, तो काउंटरपर्यंत पोहोचण्यासाठी तुम्ही इतका वेळ थांबता. तो वेळेत आला नाही तर सिस्टम त्याला बाजूला करते, म्हणजे पुढच्या व्यक्तीला थांबावे लागत नाही.",
  },
  "qs.grace.example": {
    en: "Set to 5: you call ticket 014 at 11:00. If they haven't reached the counter by 11:05, they are skipped and you can call 015.",
    hi: "5 रखने पर: आप 11:00 बजे टिकट 014 बुलाते हैं। अगर वे 11:05 तक काउंटर पर नहीं पहुँचे, तो उन्हें छोड़ दिया जाता है और आप 015 को बुला सकते हैं।",
    mr: "5 ठेवल्यास: तुम्ही 11:00 वाजता तिकीट 014 बोलावता. ते 11:05 पर्यंत काउंटरवर पोहोचले नाहीत तर त्यांना वगळले जाते आणि तुम्ही 015 ला बोलावू शकता.",
  },

  "qs.hold.label": { en: "Hold window (minutes)", hi: "होल्ड विंडो / रोके रखने का समय (मिनट)", mr: "होल्ड विंडो / राखून ठेवण्याची मुदत (मिनिटे)" },
  "qs.hold.short": { en: "How long a skipped customer can still be brought back.", hi: "छोड़े गए ग्राहक को कितनी देर तक वापस जोड़ा जा सकता है।", mr: "वगळलेल्या ग्राहकाला किती वेळ परत घेता येईल." },
  "qs.hold.what": {
    en: "A skipped customer isn't thrown out straight away. For this long, their ticket is kept safe. If they turn up late (stuck in traffic, stepped out for a moment), you can press “Restore” and put them back in the line. After this time, the ticket expires for good.",
    hi: "छोड़े गए ग्राहक को तुरंत बाहर नहीं किया जाता। इतने समय तक उसका टिकट सुरक्षित रखा जाता है। अगर वह देर से आ जाए (ट्रैफ़िक में फँस गया, ज़रा बाहर गया था), तो आप “वापस जोड़ें” दबाकर उसे फिर से लाइन में रख सकते हैं। इस समय के बाद टिकट हमेशा के लिए समाप्त हो जाता है।",
    mr: "वगळलेल्या ग्राहकाला लगेच बाहेर काढले जात नाही. इतका वेळ त्याचे तिकीट सुरक्षित ठेवले जाते. तो उशिरा आला (ट्रॅफिकमध्ये अडकला, क्षणभर बाहेर गेला) तर तुम्ही “परत घ्या” दाबून त्याला पुन्हा रांगेत ठेवू शकता. या वेळेनंतर तिकीट कायमचे कालबाह्य होते.",
  },
  "qs.hold.example": {
    en: "Set to 15: ticket 014 was skipped at 11:05. Until 11:20 you can restore them. After 11:20 they have to scan the poster again for a new ticket.",
    hi: "15 रखने पर: टिकट 014 को 11:05 पर छोड़ा गया। 11:20 तक आप उन्हें वापस जोड़ सकते हैं। 11:20 के बाद उन्हें नया टिकट पाने के लिए फिर से पोस्टर स्कैन करना होगा।",
    mr: "15 ठेवल्यास: तिकीट 014 ला 11:05 वाजता वगळले. 11:20 पर्यंत तुम्ही त्यांना परत घेऊ शकता. 11:20 नंतर नवीन तिकिटासाठी त्यांना पुन्हा पोस्टर स्कॅन करावे लागेल.",
  },

  "qs.counters.label": { en: "Active counters", hi: "चालू काउंटर", mr: "सुरू असलेले काउंटर" },
  "qs.counters.short": { en: "How many people you can serve at the same time.", hi: "एक साथ कितने लोगों को सेवा दे सकते हैं।", mr: "एकाच वेळी किती जणांना सेवा देऊ शकता." },
  "qs.counters.what": {
    en: "A counter is one place where a customer gets served at the same time as others: a salon chair, a doctor's room, a billing desk. More counters means the line moves faster and waits get shorter. You can add, switch off or remove counters later.",
    hi: "काउंटर वह जगह है जहाँ एक ग्राहक को दूसरों के साथ-साथ सेवा मिलती है: सैलून की कुर्सी, डॉक्टर का कमरा, बिलिंग डेस्क। जितने ज़्यादा काउंटर, लाइन उतनी तेज़ चलती है और इंतज़ार कम होता है। काउंटर आप बाद में जोड़ सकते हैं, बंद कर सकते हैं या हटा सकते हैं।",
    mr: "काउंटर म्हणजे अशी जागा जिथे इतरांसोबत एकाच वेळी एका ग्राहकाला सेवा मिळते: सलूनची खुर्ची, डॉक्टरची खोली, बिलिंग डेस्क. जास्त काउंटर म्हणजे रांग वेगाने सरकते आणि प्रतीक्षा कमी होते. काउंटर तुम्ही नंतर जोडू, बंद करू किंवा काढू शकता.",
  },
  "qs.counters.example": {
    en: "A salon with 3 chairs and 3 stylists working together: enter 3. A small clinic with 1 doctor: enter 1.",
    hi: "3 कुर्सियों और साथ काम करते 3 स्टाइलिस्ट वाला सैलून: 3 डालें। 1 डॉक्टर वाला छोटा क्लिनिक: 1 डालें।",
    mr: "3 खुर्च्या आणि एकत्र काम करणारे 3 स्टायलिस्ट असलेले सलून: 3 टाका. 1 डॉक्टर असलेले छोटे क्लिनिक: 1 टाका.",
  },

  "qs.service.label": { en: "Default service time (min)", hi: "सामान्य सेवा समय (मिनट)", mr: "सामान्य सेवा वेळ (मिनिटे)" },
  "qs.service.short": { en: "About how long one customer takes.", hi: "एक ग्राहक में लगभग कितना समय लगता है।", mr: "एका ग्राहकाला साधारण किती वेळ लागतो." },
  "qs.service.what": {
    en: "Roughly how long serving one customer takes. Until the system has served enough customers to learn your real speed, it uses this number to tell customers how long they will wait. After that, it switches to your actual average on its own.",
    hi: "एक ग्राहक को सेवा देने में लगभग कितना समय लगता है। जब तक सिस्टम इतने ग्राहक नहीं निपटा लेता कि आपकी असली गति सीख सके, वह ग्राहकों को इंतज़ार बताने के लिए इसी नंबर का उपयोग करता है। उसके बाद वह अपने आप आपका असली औसत इस्तेमाल करने लगता है।",
    mr: "एका ग्राहकाला सेवा देण्यास साधारण किती वेळ लागतो. तुमचा खरा वेग शिकण्याइतके ग्राहक सिस्टमने हाताळेपर्यंत, ग्राहकांना प्रतीक्षा सांगण्यासाठी हाच आकडा वापरला जातो. त्यानंतर तो आपोआप तुमची प्रत्यक्ष सरासरी वापरू लागतो.",
  },
  "qs.service.example": {
    en: "A haircut usually takes about 20 minutes: enter 20. Not sure? A rough guess is fine — it corrects itself.",
    hi: "हेयरकट में आमतौर पर लगभग 20 मिनट लगते हैं: 20 डालें। पक्का नहीं पता? मोटा अंदाज़ा चलेगा — यह अपने आप सुधर जाता है।",
    mr: "केस कापण्यास साधारण 20 मिनिटे लागतात: 20 टाका. नक्की माहीत नाही? ढोबळ अंदाज चालेल — तो आपोआप दुरुस्त होतो.",
  },

  "qs.almost.label": { en: "“Almost up” alert (people ahead)", hi: "“लगभग आपकी बारी” अलर्ट (आगे कितने लोग)", mr: "“जवळजवळ तुमची पाळी” अलर्ट (पुढे किती जण)" },
  "qs.almost.short": { en: "When to alert customers that their turn is near. 0 = off.", hi: "ग्राहकों को बारी पास आने का अलर्ट कब भेजें। 0 = बंद।", mr: "ग्राहकांना पाळी जवळ आल्याचा अलर्ट केव्हा पाठवायचा. 0 = बंद." },
  "qs.almost.what": {
    en: "A customer who has turned on alerts gets a phone notification when this many people (or fewer) are still ahead of them, so they can start heading to your shop. Set it to 0 to turn this alert off.",
    hi: "जिस ग्राहक ने अलर्ट चालू किया है, उसे तब फ़ोन नोटिफ़िकेशन मिलता है जब उसके आगे इतने (या इससे कम) लोग बचे हों, ताकि वह आपकी दुकान की ओर निकल सके। यह अलर्ट बंद करने के लिए 0 रखें।",
    mr: "ज्या ग्राहकाने अलर्ट चालू केले आहेत त्याला, त्याच्या पुढे इतके (किंवा त्याहून कमी) लोक उरले की फोनवर नोटिफिकेशन मिळते, म्हणजे तो तुमच्या दुकानाकडे निघू शकतो. हा अलर्ट बंद करायचा असल्यास 0 ठेवा.",
  },
  "qs.almost.example": {
    en: "Set to 2: when only 2 people are ahead of a customer, their phone buzzes with “Almost your turn”. If customers wait far away, pick a bigger number to give them more time to walk back.",
    hi: "2 रखने पर: जब किसी ग्राहक के आगे सिर्फ़ 2 लोग बचते हैं, तो उसके फ़ोन पर “लगभग आपकी बारी” का संदेश आता है। अगर ग्राहक दूर इंतज़ार करते हैं, तो बड़ा नंबर चुनें ताकि उन्हें लौटने का ज़्यादा समय मिले।",
    mr: "2 ठेवल्यास: एखाद्या ग्राहकाच्या पुढे फक्त 2 जण उरले की त्याच्या फोनवर “जवळजवळ तुमची पाळी” असा संदेश येतो. ग्राहक दूर थांबत असतील तर मोठा आकडा निवडा, म्हणजे त्यांना परत येण्यास जास्त वेळ मिळेल.",
  },
} satisfies Record<string, Message>;
