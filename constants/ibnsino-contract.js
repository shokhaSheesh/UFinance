export const getIbnSinoContractHtml = (data = {}) => {
  const {
    contractNumber = '___',
    contractDate = '____-__-__',
    academicYear = '2025-2026',
    directorName = 'Ganiyeva Guzalhon Batirovna',
    guardianName = '________________________',
    studentName = '________________________',
    className = '___',
    language = "O'zbek tili",
    validFrom = '____-__-__',
    validTo = '____-__-__',
    admissionPayment = '1 000 000',
    guardianPassport = '________________________',
    guardianPassportIssuedBy = '________________________',
    guardianPhone1 = '________________________',
    guardianPhone2 = '________________________',
    guardianAddress = '________________________',
    guardianPinfl = '________________________',
    thirdPartyName = '________________________',
    thirdPartyPinfl = '________________________',
  } = data

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title></title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Roboto', 'Times New Roman', serif;
    font-size: 13px;
    line-height: 1.6;
    color: #1a1a1a;
    background: #fff;
    padding: 20px 0;
    max-width: 210mm;
    margin: 0 auto;
  }

  h1 {
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  h2 {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  h3 {
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    margin: 20px 0 10px;
    text-transform: uppercase;
  }

  .subtitle {
    text-align: center;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .header-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
    padding: 6px 0;
    margin-bottom: 16px;
    font-size: 13px;
  }

  .intro-text {
    text-align: justify;
    margin-bottom: 16px;
    text-indent: 20px;
  }

  .section-title {
    text-align: center;
    font-weight: 700;
    font-size: 13.5px;
    margin: 22px 0 12px;
    text-transform: uppercase;
  }

  .article {
    text-align: justify;
    margin-bottom: 6px;
    text-indent: 20px;
  }

  .article-sub {
    text-align: justify;
    margin-bottom: 6px;
    padding-left: 20px;
    text-indent: 20px;
  }

  .bold { font-weight: 700; }
  .underline { text-decoration: underline; }
  .italic { font-style: italic; }

  ul.docs-list {
    margin: 6px 0 6px 40px;
    list-style: disc;
  }
  ul.docs-list li {
    margin-bottom: 3px;
  }

  .requisites-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }
  .requisites-table td {
    vertical-align: top;
    padding: 4px 10px;
    width: 50%;
    font-size: 12.5px;
    line-height: 1.7;
  }
  .requisites-table .label {
    font-weight: 700;
  }

  .signature-line {
    margin-top: 30px;
    border-top: 1px solid #333;
    width: 200px;
    display: inline-block;
  }

  .highlight {
    background: #fffde7;
    padding: 1px 4px;
    border-radius: 2px;
    font-weight: 500;
  }

  .deposit-notice {
    margin-top: 30px;
    padding: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fafafa;
  }

  .deposit-notice p {
    margin-bottom: 8px;
    text-align: justify;
  }

  .deposit-notice ul {
    margin: 6px 0 10px 30px;
  }

  @page {
    margin: 10mm 5mm;
  }

  @media print {
    body { padding: 0; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<h1>PULLIK TA'LIM XIZMATLARINI KO'RSATISH HAQIDA</h1>
<h2><em>No ${contractNumber}-SHARTNOMA</em></h2>
<div class="subtitle">(${academicYear} o'quv yili uchun)</div>

<div class="header-line">
  <span>Toshkent sh.</span>
  <span>${contractDate}</span>
</div>

<p class="intro-text">
  Nizom asosida ish olib boruvchi <span class="bold">"UNION SCHOOL SINO" MCHJ</span> maktabi direktori
  <span class="bold">${directorName}</span> bir tomondan (keyingi o'rinlarda "Bajaruvchi" xamda "Maktab" deb ataladi),
  o'quvchining qonuniy vakili (otasi yoki onasi) <span class="bold highlight">${guardianName}</span> ikkinchi
  tomondan (keyingi o'rinlarda "Buyurtmachi" deb ataladi), o'quvchi <span class="bold highlight">${studentName}</span>ni
  (keyingi o'rinlarda "o'quvchi" deb ataladi) davlat standartlari asosida o'rta
  maktab ta'limini olishi uchun mazkur shartnomani tuzdilar.
</p>

<div class="section-title">1. SHARTNOMA PREDMETI</div>

<p class="article">
  1.1. "Bajaruvchi" o'quvchini <span class="bold highlight">${className}-sinfga (${language})</span> o'qishga qabul qiladi va davlat ta'lim
  standartlariga mos bo'lgan sifatli ta'lim xizmatlarini ko'rsatadi. "Buyurtmachi" esa, ushbu ta'lim
  xizmatlari uchun haq to'laydi.
</p>

<p class="article">
  1.2. O'quvchining maktabda ta'lim olish muddati o'quv dasturi va maktab Nizomiga muvofiq
  (sinov muddati bilan) <span class="highlight">${validFrom}</span> dan <span class="highlight">${validTo}</span> yilgacha tashkil etiladi. Shartnoma uchun to'lov:
  Qabul uchun to'lov va haqiqiy xizmat ko'rsatish muddatiga mos ravishda to'lovlardan iborat.
</p>

<p class="article">
  Qabul uchun to'lovning maqsadi va miqdori: Tashkilot tomonidan ta'lim xizmatlari ko'rsatish,
  moddiy-texnik bazani takomillashtirish va rivojlantirish, Qabul komissiyasi tomonidan sinov imtihonlari
  va boshqa tashkiliy tadbirlarni amalga oshirish hamda ta'lim sifatini yaxshilash maqsadida, Mijoz
  (abituriyent yoki uning vakili) tomonidan <span class="bold highlight">${admissionPayment}</span> (bir million) so'm miqdorida oldindan to'lov amalga
  oshiriladi.
</p>

<p class="article"><span class="bold">1.3 To'lovning huquqiy maqomi</span></p>

<p class="article-sub">
  - Mazkur to'lov "Qabul uchun oldindan to'lov" hisoblanib, Shartnoma tuzilgan yil uchun amal qiladi.
</p>

<p class="article-sub">
  - Ushbu to'lov shartnoma imzolanishi bilan kuchga kiradi va qaytarib berilmasligi sharti bilan
  amalga oshiriladi.
</p>

<div class="section-title">2. MAKTABDA O'QUV JARAYONLARINI TASHKILLASHTIRISH</div>

<p class="article">
  2.1. Maktab o'quv jarayonini amalga oshirish va uni tashkillashtirishda Shartnomaga muvofiq
  ta'lim xizmatlarini Ota-ona (Vasiy/Homiy)lar tomonidan to'lanadigan haq to'lovlari asosida olib boradi
  va quyidagi xizmatlarni amalga oshiradi:
</p>

<p class="article-sub">
  2.1.1. "Bajaruvchi" tomonidan maktab O'zbekiston Respublikasining Davlat Ta'limi Standarti
  (keyingi o'rinlarda DTS-deb ataladi) va Maktab ichki metodikasiga asoslangan o'quv dasturi asosida
  ta'lim faoliyatini amalga oshirishda tegishli o'quv qo'llanma va darslik kitoblari bilan ta'minlanadi.
  O'quvchilarning bo'sh vaqtlaridan samarali foydalanish maqsadida qo'shimcha to'garaklar maktab
  ma'muriyati va ota-onalarrning takliflarini inobatga olgan holda tashkil etiladi.
</p>

<p class="article-sub">
  2.1.2. DTSga asosan Maktab o'quvchilarining bilim va ko'nikmalarini bosqichma-bosqich
  attestatsiyadan o'tkazish tartibi maktabning belgilangan mundarija va berilgan darslar hajmi hamda
  sinflar kesimida amalga oshiriladi. Shuningdek o'quvchilarni bilimini nazorat qilish maqsadida oraliq
  attestatsiyalar ham o'tkaziladi.
</p>

<p class="article-sub">
  2.1.3. "Bajaruvchi" o'quv jarayonini O'zbekiston Respublikasi fuqarolik kodeksi, "Xo'jalik
  yurutuvchi subektlar faoliyatining shartnomaviy-huquqiy bazasi to'g'risida"gi, "Ta'lim to'g'risidagi
  qonunlar, O'zbekiston Respublikasi Prezidentining 15.09.2017 yildagi № PQ-3276 sonli "Nodavlat
  ta'lim xizmatlari ko'rsatish faoliyatini yanada rivojlantirish chora-tadbirlari to'g'risidagi" qarori va
  O'zbekiston Respublikasi Vazirlar Mahkamasining 24.12.2019 yildagi №1028-sonli "Nodavlat ta'lim
  tashkilotlari faoliyatini takomillashtirish chora-tadbirlari to'g'risida" qarori hamda maktab nizomi, ichki
  tartib va odob-ahloq qoidalari va boshqa lokal xujjatlar asosida amalga oshiradi.
</p>

<p class="article-sub">
  2.1.4. O'n bir yillik majburiy umumiy o'rta ta'lim tizimiga izchil o'tishni ta'minlash,
  takomillashtirilgan davlat ta'lim standarti va o'quv dasturlari asosida maktab bitiruvchilariga Davlat
  namunasidagi Attestat (Shahodatnoma) beriladi.
</p>

<div class="section-title">3. MAKTABNING HUQUQLARI</div>

<p class="article">
  3.1. Maktab DTS va o'quv dasturi asosida ishlab chiqilgan ichki metodikasiga muvofiq o'quv
  qo'llanmalari va texnik vositalaridan keng foydalangan holda ta'lim va tarbiya berish hamda
  bosqichma-bosqich oraliq imtihonlarini o'quv reja asosida o'tkazadi.
</p>

<p class="article">
  3.2. Maktab ichki belgilangan tartib va qoidalarga ko'ra O'quvchining dars va to'garak jadvallarini,
  ta'til kunlarini, (bunda o'quvchiga tegishli yo'riqnoma va ilovalar hamda akademik kalendar taqdim
  etiladi), o'quvchining maktab formasi tartibini belgilaydi va bu haqda ota-onalarga e'lon qiladi.
</p>

<p class="article">
  3.3. Har bir o'quvchini maktab ruhshunosi va malakali o'qituvchi suhbati va imtihoni asosida
  maktabga qabul qiladi.
</p>

<p class="article">
  3.4. O'quvchiga davlat ta'lim standartlari talablariga muvofiq bo'lgan dastur asosida pullik ta'lim
  xizmati ko'rsatadi. Pullik ta'lim xizmatlarini bozor iqtisodiyoti va maktabning ichki moliyaviy holati
  bo'yicha erkin belgilash huquqiga ega.
</p>

<p class="article">
  3.5. O'quvchining maktabga kelish jarayonida yuqumli kasallik bilan kasallanganligi aniqlansa,
  o'quvchi davolanib to'liq tuzalganligi to'g'risida shifokor ma'lumotnomasi taqdim etguniga qadar,
  maktab ma'muriyati o'quvchini maktabga kiritilishini taqiqlashi mumkin.
</p>

<p class="article">
  3.6. Maktabda o'tkaziladigan har bir tadbir to'g'risida maktab ma'muriyati tomonidan maktab
  internet veb saytlariga joylashtirish, ijtimoiy tarmoqlarida yoritish va ota-onalarning mobil telefon
  raqamiga ma'lumotlarni yuboradi.
</p>

<p class="article">
  3.7. Maktab ma'muriyati "Buyurtmachi" tomonidan Mazkur shartnomaga muvofiq to'lovlarni
  ushbu shartnomaning 7.4-bandiga muvofiq o'z vaqtida amalga oshirmagan taqdirda o'quvchini
  darslarga kiritmaslik hamda ushbu shartnomaning 8.1 (4)-bandiga asosan Shartnomani bir
  tomonlama bekor qilish huquqiga ega.
</p>

<p class="article">
  3.8. Maktab ma'muriyati o'quvchi tomonidan maktab Nizomi, Ichki tartib va odob ahloq
  qoidalarida ko'rsatilgan tartib-intizomga rioya etmasa, Maktab ma'muriyati tomonidan tuzilgan jamoat
  kengashi qarori yoki Maktab direktorining buyrug'iga ko'ra maktabdan chetlashtirish huquqiga ega.
</p>

<p class="article">
  3.9. Maktabning ta'lim faoliyatiga putur yetadigan har qanday yolg'on axborot va ma'lumot
  (manipulyatsiya, provakatsiya, o'quvchining qonuniy vakillari yohud unga aloqador yaqin
  qarindoshlarining guruh-guruh bo'lib maktab faoliyatini obro'sizlantirish va Maktab ma'muriyati
  hodimlarini va o'qituvchilarini haqorat qilish, so'kish, va sha'ni va qadr-qimmatini kamsitilishi)ni ijtimoiy
  tarmoqlarda tarqatilishida ishtirok etgan shaxslar ustidan tegishli organlariga murojaat qilish huquqiga ega.
</p>

<p class="article">
  3.10. Mazkur Shartnomaning 3.9-bandida ko'rsatilgan holatlar o'quvchining ota-onalari yoki uning
  qonuniy vakillari tomonidan sodir etilgan taqdirda Maktab, o'quvchining ota-onasi yoki qonuniy
  vakillari bilan tuzilgan shartnomani bir tomonlama bekor qilish huquqiga ega.
</p>

<p class="article">
  3.11. Maktab pullik ta'lim xizmat ko'rsatish uchun o'zining moliyaviy, marketing va raqobat
  siyosatidan kelib chiqgan holda Shartnomaga muvofiq mijozlar uchun chegirmalar e'lon qilishi mumkin.
</p>

<div class="section-title">4. MAKTABNING MAJBURIYATLARI</div>

<p class="article">
  4.1. Maktab tegishli suhbat va imtihonlar orqali o'quvchini qabul qiladigan bo'lsa O'quvchining
  ota-onasi yoki qonuniy vakillari bilan tuziladigan Shartnoma uchun quyidagi hujjatlar:
</p>
<ul class="docs-list">
  <li>Ota-ona tomonidan farzadini maktabga qabul qilinishi to'g'risidagi arizasi,</li>
  <li>O'quvchining emlanganligi to'g'risidagi ma'lumotnomasi,</li>
  <li>O'quvchining tug'ilganlik to'g'risidagi guvohnoma yoki pasport nusxasi,</li>
  <li>O'quvchining 086 shaklidagi shifokor ma'lumotnomasi,</li>
  <li>O'quvchining oxirgi tahsil olgan o'quv muassasasidan shaxsiy hujjatlar jamlanmasi,</li>
  <li>O'quvchi ota-onasining pasport nusxasi,</li>
  <li>O'quvchining turar joyidan mahalla dalolatnomasi. (Toshkent shahrida doimiy ro'yxatda turuvchilar bundan mustasno) jamlanmasi ilova qilingandan so'ng, Maktab direktorining buyrug'i asosida maktabning o'quvchilar ro'yxatiga kiritadi.</li>
</ul>

<p class="article">
  4.2. Har bir o'quvchini maktab ruhshunosi va malakali o'qituvchi suhbati va imtihoni asosida
  maktabga qabul qilish jarayonini tashkillashtiradi.
</p>

<p class="article">
  4.3. O'quvchiga davlat ta'lim standartlari talablariga muvofiq bo'lgan dastur asosida pullik ta'lim
  xizmati ko'rsatishda o'ziga qo'yilgan talablarni bajaradi.
</p>

<p class="article">
  4.4. Maktab tomonidan darslarni o'tkazish uchun sanitar va gigienik talablarga javob beradigan,
  yong'in xavfsizligi qoidalariga amal qilingan va ta'lim jarayoni uchun talab etilgan majburiy me'yoriy
  qoidalarga javob beradigan sinf xonalari bilan ta'minlanadi.
</p>

<p class="article">
  4.5. Maktab sinflarda o'quvchilar sonini yigirma to'rt (24) kishidan oshmagan holda dars
  jarayonini tashkillashtiradi.
</p>

<p class="article">
  4.6. Maktab tomonidan o'quvchilarga birinchi tibbiy xizmat ko'rsatish (bunda o'quvchi jarohat
  olganda birinchi tibbiy yordam ko'rsatiladi va o'quvchining ota-onasi habordor qilinadi. Agarda
  Ota-ona (Vasiy/Homiy) o'z vaqtida maktab binosiga etib kelmasa Maktab 103 ishonch telefoniga
  murojaat qiladi. O'quvchilarning yillik emlash ishlari ota-ona (Vasiy/Homiy) zimmasida qoladi va
  amalga oshiriladi.
</p>

<p class="article">
  4.7. Mazkur Shartnoma bo'yicha faqat o'quvchi betob bo'lganda, davolanayotgan hollarda,
  darslarga qatnasha olmagan umumiy kunlari soni uzluksiz bir oy va undan ortiq bo'lsa, qoldirilgan
  darslari uchun tegishli tibbiy ma'lumotnoma taqdim etgan taqdirida shartnoma bo'yicha belgilangan
  to'lovning bir oylik miqdori chegirib tashlanadi.
</p>

<p class="article">
  4.8. O'quvchining mazkur Shartnomaning 4.7-bandiga asosan Tibbiyot birlashmasi yoki
  davolangan muassasadan kasalligi to'g'risidagi Tibbiy ma'lumotnomasini olgan kundan 2 (ikki) ish
  kuni davomida maktab Bosh ma'muriy idorasi, shartnomalar bilan ishlash bo'limi mutaxassisiga
  topshirishi lozim.
</p>

<p class="article">
  4.9. Ota-ona (vasiy) tomonidan yuqorida bandda ko'rsatilgan muddatda farzandining kasalligi
  yoki davolanganligi to'g'risidagi Tibbiy ma'lumotnomani o'z vaqtida topshirilmasligi, farzandining
  o'qishi uchun to'langan to'lovlar bo'yicha qayta hisob-kitob qilinishi va chegirib qolinishini rad etish
  uchun asos bo'ladi.
</p>

<p class="article">
  4.10. Maktabning belgilangan tizimi orqali o'quvchining muvaffaqiyatlari va muammolari haqida
  Sinf rahbari/ masul xodim orqali har chorakda bir marta o'quvchining qonuniy vakillariga xabar berib
  boradi.
</p>

<p class="article">
  4.11. Maktab tomonidan ushbu shartnomaga o'zgartirish va qo'shimchalar kiritish to'g'risida
  "Buyurtmachi"ni o'zgarish va qo'shimchalar to'g'risida yozma ravishda 3 kunlik muddatda
  ogohlantiradi.
</p>

<p class="article">
  4.12. Maktabda o'quvchilar xavfsizligini ta'minlash maqsadida qo'riqlash xizmati tashkil etiladi.
</p>

<div class="section-title">5. O'QUVCHINING OTA-ONASI VA QONUNIY VAKILI (VASIY/HOMIY)NING HUQUQLARI</div>

<p class="article">
  5.1. Ota-ona(Vasiy/Homiy) maktabning har bir ichki xujjatlari (maktab Nizomi, ichki tartib va
  odob-axloq qoidalari, maktab shartnomasi hamda maktab faoliyatini tashkil etish bilan bog'liq
  litsenziya (guvohnoma), qo'shimcha xizmatlar va maktab faoliyati) bilan tanishib chiqish huquqiga ega.
</p>

<p class="article">
  5.2. Ota-ona(Vasiy/Homiy) maktab ma'muriyatidan maktab faoliyati, o'quv jarayoni, shartnoma
  bo'yicha xizmat ko'rsatish masalalari, farzandining bilimi, hulqi to'g'risida ma'lumot olish huquqiga ega.
</p>

<p class="article">
  5.3. Ota-ona(Vasiy/Homiy) Maktab ma'muriyatining pedagogik kengashlarida ishtirok etish, zarur
  hollarda t'alim masalalari bo'yicha o'z takliflarini maktab ma'muriyatiga kiritadi.
</p>

<p class="article">
  5.4. Ota-ona (Vasiy/Homiy) maktabning xisob raqamiga xayriya (Homiylik) pullarini qo'shish.
</p>

<div class="section-title">6. O'QUVCHINING OTA-ONASI VA QONUNIY VAKILI (VASIY/HOMIY)NING MAJBURIYATLARI</div>

<p class="article">
  6.1. Ota-ona (Vasiy/Homiy) o'quvchining Maktabda ta'lim olishi uchun to'lovlarni o'z vaqtida
  amalga oshirishi.
</p>

<p class="article">
  6.2. Maktabda o'quvchining xatti-xarakati uchun maktab ichki tartib va odob-ahloq qoidalarida
  belgilangan qoidlari doirasida javobgar bo'ladi.
</p>

<p class="article">
  6.3. O'quvchining maktabdan tashqaridagi harakatini ota-onaning o'zi nazorat qiladi.
</p>

<p class="article">
  6.4. Farzandining harakati bilan maktab mulkiga zarar etsa, moddiy yoki nomoddiy zarar
  etkazgan holatlar uchun ota-ona javobgarlikni o'z zimmasiga oladi hamda maktabga yetkazilgan
  moddiy zararni to'liq qoplaydi.
</p>

<p class="article">
  6.5. Maktab tomonidan chiqarilgan darsliklarning yaroqligini ta'minlash, darsliklar yaroqsiz holga
  kelgan taqdirda ularning to'liq narxini qoplash.
</p>

<p class="article">
  6.6. O'quvchining uy vazifalarini doimiy ravishda kuzatib borish, shuningdek o'qituvchilarning
  talablari va tavsiyalariga rioya qilish xatti-harakatlari haqida maktab ma'muriyatiga habar berish.
</p>

<p class="article">
  6.7. Farzandining shubhali xatti-harakatlari haqida maktab ma'muriyatiga o'z vaqtida habar
  berishi mumkin.
</p>

<p class="article">
  6.8. Ota-ona(Vasiy/Homiy) o'z farzandiga maktab qonun-qoidalari bilan tanishtirishi, uning ijrosini
  ta'minlashi, maktabning barcha ishchi xodimlariga hurmat va odob bilan muomalada bo'lishi hamda
  tahdidiy va tajovuzkorona munosabatdan yiroq bo'lishi.
</p>

<p class="article">
  6.9. Har bir ota-ona(Vasiy/Homiy) maktab ma'muriyati, ishchi xodimlari, o'qituvchilari va boshqa
  ota-onalarning shaxsiyatiga, oilaviy sharoiti va muammolariga aralashmasligi.
</p>

<p class="article">
  6.10. Har bir ota-ona agar ularning yashash manzili, bankdagi hisob raqami yoki rekviziti, elektron
  manzili xamda telefon raqami o'zgarsa, 48-soat ichida ta'lim olayotgan maktab ma'muriyatiga yozma
  ravishda ma'lumot berishi.
</p>

<p class="article">
  6.11. Ota-ona(Vasiy/Homiy) farzandini maktabga kim tomonidan olib kelinishi va olib ketilishi
  hamda, ba'zi bir sabablarga ko'ra maktabga kela olmasligi to'g'risida maktab ma'muriyatiga yozma
  ravishda ma'lumot berishi.
</p>

<p class="article">
  6.12. Ota-ona(Vasiy/Homiy) farzandini maktab nizomida belgilab quygan soatda maktabga o'z
  vaqtida olib kelishi (soat 8.30 dan kech qolmagan holda) va olib ketishini (soat 17.00) ta'minlash
  (maktab transportidan foydalanuvchilar bundan mustasno).
</p>

<p class="article">
  6.13. Ota-ona(Vasiy/Homiy) quyidagilar to'g'risida maktab ma'muriyatiga yozma ravshida
  ma'lumot berishi kerak:
</p>
<ul class="docs-list">
  <li>O'quvchining kasalligi, qanday dorilarga allergiya yoki reaktsiyasi borligi,</li>
  <li>O'quvchi qaysi fanlardan o'zlashtirishi pastligi yoki ta'lim jarayonida tahsil olishda bo'layotgan muammolar (sog'lig'i tufayli yoki boshqa sabablar) to'g'risida;</li>
  <li>O'quvchining ijtimoiy oilaviy sharoti to'g'risida to'liq ma'lumot berish.</li>
</ul>

<div class="section-title">7. XISOB-KITOB QILISH TARTIBI</div>

<p class="article">
  7.1. Shartnomaga muvofiq (ta'lim xizmatlariga) kelishilgan to'lov miqdori bir o'quv yili uchun
  belgilanadi. To'lovni oyma-oy bo'lib to'lashga yo'l qo'yiladi.
</p>

<p class="article">
  7.2. Maktabga o'quvchini qabul qilish jarayonida mazkur Shartnoma uchun oldindan
  <span class="bold highlight">${admissionPayment}</span> so'm miqdorida mijozlar tomonidan to'lanadi. Mazkur summa joriy o'quv yili sentyabr oyi uchun
  qo'shimcha to'lov bo'ladi (Shartnoma predmetining 1.2. bandi: Qabul uchun to'lovning maqsadi va miqdori).
</p>

<p class="article">
  7.3. Mazkur Shartnomaning 7.1-bandiga asosan Ota-ona (Vasiy/Homiy)lar tomonidan
  o'quvchining ta'lim olishi uchun to'qqiz oylik to'lov amalga oshiriladi.
</p>

<p class="article">
  7.4. "Buyurtmachi" har oy uchun to'lovni, oy boshlanishidan kamida 5 (besh) kun avval to'lashni
  o'z zimmasiga oladi. (bunda keyingi oy uchun to'lovlar joriy oyning 25 sanasigacha avvaldan
  to'lanishi lozim "misol uchun - oktyabr oyi uchun to'lovlar o'tgan sentyabr oyining 25 sanasigacha
  to'liq to'langan bo'lishi nazarda tutiladi").
</p>

<p class="article">
  7.5. "Buyurtmachi" tomonidan ushbu shartnomaning 7.4-bandida ko'rsatilgan muddat buzilsa,
  o'quvchini darslarga kiritmaslik yoki maktabdan chetlashtirish choralari ko'rilishiga sabab bo'ladi.
</p>

<p class="article">
  7.6. Ta'lim xizmatlari uchun to'lov maktab g'aznasiga yoki "Bajaruvchi"ning bankdagi hisob
  raqamiga to'lanadi.
</p>

<p class="article">
  7.7. Shartnoma 3 tomonlama tuzilgan xollarda "Buyurtmachi" uchun to'lovni "Uchinchi shaxs"
  tomonidan amalga oshirishga mazkur shartnoma va qonun hujjatlariga muvofiq yo'l qo'yiladi.
</p>

<p class="article">
  7.8. Mazkur shartnoma imzolanga kundan boshlab 3 (uch) bank ish kuni davomida "Buyurtmachi"
  tomonidan to'lov to'liq miqdorda amalga oshirilmasa, bir tomonlama shartnoma bekor qilinishi mumkin.
</p>

<p class="article">
  7.9. Buyurtmachi "Bajaruvchi"ning o'quvchiga ta'lim xizmatini ta'minlash xarajatlari 3 oy avvaldan
  rejalashtirilganligiga o'z roziligini bildiradi va o'quvchini maktab tashabbusi bilan maktabdan
  chetlashtirilgan taqdirda, to'lov summasi shartnomaning 7.10. bandiga asosan qaytarib beriladi.
</p>

<p class="article">
  7.10. Mazkur shartnoma tomonlarning kelishuviga ko'ra muddatidan oldin yoki "Bajaruvchi"
  tomonidan bir tomonlama bekor qilingan taqdirda, Pul mablag'larini qaytarish (shartnoma uchun to'lov
  puli bundan mustasno) mazkur shartnomaga asosan joriy o'quv yilining yakuni bo'yicha 25 Iyun kuni
  amalga oshiriladi. "Buyurtmachi" tomonidan amalga oshirilgan to'lovning, qanday shaklda
  to'langanidan qat'iy nazar naqd pulda qaytarilmaydi.
</p>

<p class="article">
  7.11. O'quvchi Maktab ichki tartib qoidalarini qo'pol tarzda buzishi (Mushtlashish, Chekish, Milliy
  qadriyatatlarga mos kelmagan video materiallarni ko'rish, olib yurish va x/k) sababli yohud
  Buyurtmachining tashabbusi bilan Shartnoma bekor qilinsa "Bajaruvchi" tomonidan shartnomaga
  muvofiq pul mablag'larini "Buyurtmachiga" 90 bank ish kuni mobaynida to'liq qaytarib beriladi.
</p>

<p class="article">
  7.12. O'quvchi Maktabga sababli yoki sababsiz kelmagan taqdirda to'lov summasida hech
  qanday chegirma va qayta hisoblash yuzaga kelmaydi.
</p>

<p class="article">
  7.13. Ota-ona (Vasiy/Homiy) farzandining ta'lim olishi bo'yicha shartnoma bekor qilinish vaqtida
  farzandining boshqa maktabga qabul qilinishi bo'yicha "Qabul qilish" talonini elektron yoki yozma
  nusxasini Maktab ma'muriyati Shartnomalar bilan ishlash bo'limi mutaxassisiga topshirishi shart.
</p>

<p class="article">
  7.14. Mazkur Shartnomaning 7.13.-bandiga asosan Ota-ona (Vasiy/Homiy) tomonidan "Qabul
  qilish" talonining o'z vaqtida topshirilmasligi tegishli tartibda Maktab ma'muriyati tomonidan voyaga
  yetmaganlar ishlari bo'yicha tuman (shahar) komissiyasi yoki Tuman IIBga murojaat qilishga asos bo'ladi.
</p>

<div class="section-title">8. SHARTNOMANI BEKOR QILISH SHARTLARI</div>

<p class="article">
  8.1. Mazkur shartnomani quyidagi holatlarda muddatidan oldin bekor qilish mumkin:
  Tomonlarni o'zaro kelishuviga muvofiq;
  Buyurtmachining arizasiga muvofiq (bunda o'quvchi choraklik baholarini yopgan bo'lishi shart);
  O'zbekiston Respublikasining amaldagi qonunchiligida nazarda tutilgan asoslarda tomonlardan
  birining tashabbusiga ko'ra.
</p>

<p class="article">
  8.2. Mazkur shartnomaning 7.4-bandi ko'rsatilgan muddatlarda "Ota-onalar yoki uning qonuniy"
  vakillari tomonidan shartnoma bo'yicha to'lovlar to'liq amalga oshirilmaganda 3 (uch) bank ish kuni
  davomida "Bajaruvchi" tomonidan shartnoma bir tomonlama bekor qilinishi mumkin.
</p>

<p class="article">
  8.3. Bundan tashqari "Bajaruvchi" quyidagi holatlarda tegishli ogohlantirishdan so'ng mazkur
  shartnoma shartlarini bajarishni rad qilishi mumkin:
  Agar "Buyurtmachi" shartnomada ko'rsatilgan xizmatlar uchun to'lov muddatini belgilangan
  muddatlardan ortiq kechiktirgan bo'lsa;
  "Bajaruvchi" qaroriga ko'ra, O'quvchi bir necha bor intizom buzishi sababli maktabdan chetlashtirilishi mumkin.
  Agar ota-ona farzandining sog'lig'idagi jiddiy muammolarni, turli hil ruhiy kasalliklar (epelepsiya,
  autizm, o'ta asabiylik)ni bilib turib yashirgan bo'lsa, shatnomani bir tomonlama bekor qilish uchun asos bo'ladi.
</p>

<p class="article">
  8.4. Mazkur shartnoma bo'yicha ta'lim xizmatlarini ko'rsatish "Bajaruvchi" tomonidan
  "Buyurtmachi"ni xizmat ko'rsatishini bekor qilish haqida yozma ravishda xabardor qilgan kundan
  boshlab, 3 kun o'tgandan so'ng bekor bo'lgan hisoblanadi.
</p>

<p class="article">
  8.5. "Buyurtmachi" "Bajaruvchi"ning amalda qilgan xarajatlarini to'lab berish sharti bilan istalgan
  paytdan shartnomani bekor qilishi mumkin.
</p>

<p class="article">
  8.6. Mazkur Shartnomani bekor qilish uchun o'quvchining ota-onasi/qonuniy vakillari farzandining
  boshqa maktabda tahsil olishi bo'yicha ushbu maktabdan qabul qilish talonini olib kelish shart.
</p>

<div class="section-title">9. FORS-MOJOR HOLATLARI</div>

<p class="article">
  9.1. Taraflar shartnomasi fors-major holatlari, ya'ni yengib bo'lmaydigan kuch, favqulotda va
  muayyan sharoitlarda oldini olib bo'lmaydigan vaziyatlar (zilzila, qo'rg'oqchilik, suv toshqini, yong'in,
  sel, do'l, jala, kuchaytirilgan karantin, ommaviy epidemiya va boshqa tabiiy ofatlar) tufayli majburiyatlarni
  bajarmagan yoki lozim darajada bajarmaganligini isbotlansa, javobgar bo'lmaydilar.
</p>

<p class="article">
  9.2. Sodir bo'lgan fors-major holatlari to'g'risida taraflar bir-birlarini ushbu holatlar yuz bergan
  holda zudlik bilan yozma yoki og'zaki tartibda xabardor qilishlari shart.
</p>

<p class="article">
  9.3. Mazkur shartnoma bo'yicha majburiyatlarni bajarish muddati yengib bo'lmaydigan kuch
  holatlarini davomiyligini hisobga olib, shartnomani amal qilish muddatini uzaytirishlari mumkin.
</p>

<div class="section-title">10. TOMONLARNING JAVOBGARLIGI</div>

<p class="article">
  10.1. Tomonlar o'z majburiyatlarini bajarmagan yoki tegishli ravishda bajarmagan taqdirda
  O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq javobgar hisoblanadilar. Shartnoma
  shartlari yuzasidan nizo va kelishmovchliklar tomonlar o'rtasida o'zaro xal qilinadi.
</p>

<p class="article">
  10.2. Nizo va kelishmovchiliklarni muzokara yo'li bilan hal etishning imkoni bo'lmasa, qonun
  hujjatlariga muvofiq O'zbekiston Respublikasi fuqarolik ishlari bo'yicha tumanlar aro sudida ko'rib chiqiladi.
</p>

<p class="article">
  10.3. Ushbu shartnomada belgilanmagan boshqa shartlar, O'zbekiston Respublikasining
  amaldagi qonunchiligi bilan tartibga solinadi.
</p>

<table class="requisites-table">
  <tr>
    <td>
      <div class="label">Bajaruvchi:</div>
      <div class="label">"UNION SCHOOL SINO" MCHJ</div>
      <div><span class="label">Manzil:</span> Toshkent sh. Olmazor tumani Islom ota MFY, Qora-Qamish 1/2 dahasi, 34/2-uy</div>
      <div><span class="label">Bank:</span> Toshkent "ASIA ALLIANCE BANK" AT BANKI</div>
      <div><span class="label">X/r:</span> 20208000807128891001</div>
      <div><span class="label">MFO:</span> 01095</div>
      <div><span class="label">STIR:</span> 311553445</div>
      <br/>
      <div><span class="label">Direktor:</span> ${directorName}</div>
      <div class="signature-line"></div>
      <div style="margin-top: 6px;">M.O'</div>
    </td>
    <td>
      <div class="label">Buyurtmachi:</div>
      <div><span class="label">F.I.Sh.</span> <span class="bold highlight">${guardianName}</span></div>
      <div><span class="label">Yashash manzili:</span> <span class="highlight">${guardianAddress}</span></div>
      <div><span class="label">Pasport S/R:</span> <span class="highlight">${guardianPassport}</span></div>
      <div><span class="label">Kim tomonidan berilgan:</span> <span class="highlight">${guardianPassportIssuedBy}</span></div>
      <div><span class="label">PINFL:</span> <span class="highlight">${guardianPinfl}</span></div>
      <div><span class="label">Tel:</span> <span class="highlight">${guardianPhone1}</span> ; <span class="highlight">${guardianPhone2}</span></div>
      <br/>
      <div>O'quvchi: <span class="bold highlight">${studentName}</span></div>
      <div class="signature-line"></div>
    </td>
  </tr>
</table>

<div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #ccc;">
  <div class="label" style="font-size: 13.5px; margin-bottom: 10px;">Uchinchi shaxs:</div>
  <div style="font-size: 12.5px; line-height: 1.7;">
    <div>Fuqaro: <span class="bold highlight">${thirdPartyName}</span></div>
    <div>PINFL: <span class="highlight">${thirdPartyPinfl}</span></div>
    <div style="margin-top: 20px;" class="signature-line"></div>
  </div>
</div>

<div class="page-break"></div>

<div class="deposit-notice">
  <p class="bold">Hurmatli ota-ona,</p>
  <p>
    Union School'da sifatli ta'lim, zamonaviy muhit va farzandingizning har tomonlama rivoji
    uchun katta resurslar va tayyorgarlik talab etiladi.
  </p>
  <p>
    Shu sababli, biz o'quvchini ro'yxatdan o'tkazishda shartnomaning 7.2. bandiga asosan
    <span class="bold">${academicYear}</span> o'quv yili uchun shartnoma summasini <span class="bold">${admissionPayment} (bir million so'm)</span> deb belgiladik.
  </p>
  <p>
    Bu to'lov, umumiy farzandingiz uchun joyni kafolatlaydi yani, o'qituvchilar, dars materiallari
    va boshqa zarur tayyorgarlik xarajatlarini qoplashga yordam beradi.
    <span class="bold italic">Shartnoma bekor qilingan taqdirda ham, bu mablag' sarflanib bo'lgani uchun qaytarilmaydi.</span>
    Bu xalqaro amaliyotda ham keng qo'llaniladi va maktabda sifatni barqaror saqlash imkonini beradi.
  </p>
  <p class="underline">Shu bilan birgalikda:</p>
  <p class="italic">Resurslar oldindan tayyorlanadi:</p>
  <p>
    O'quvchi ro'yxatdan o'tgach, o'qituvchining yuklamasi, darsliklar, sinfdagi o'rni, va boshqa
    infratuzilma unga moslab rejalashtiriladi.
  </p>
  <p class="italic">· Joyni band qilish kafolati:</p>
  <p>
    Maktabdagi har bir joy cheklangan. Depozit bu joyni boshqa o'quvchilar uchun yopib qo'yadi.
    Agar o'sha joy bo'sh qolsa, bu boshqa talabaning imkoniyatini yo'qqa chiqaradi.
  </p>
  <p class="italic">· Ma'muriy xarajatlar:</p>
  <p>
    Har bir o'quvchi uchun shartnoma tuzish, hujjatlar yuritish, tizimga kiritish kabi ishlar mablag'
    va vaqt talab qiladi.
  </p>
  <p class="italic">· O'qituvchilar va kurslar rejalashtiriladi:</p>
  <p>
    Depozit asosida sinflar shakllantiriladi. Keyin bekor qilish - butun guruh tuzilmasiga zarar yetkazadi.
  </p>
  <p class="bold" style="margin-top: 16px;">Sharnoma "Depozit" to'lovi bilan tanishdim!</p>

  <table style="width: 100%; margin-top: 30px;">
    <tr>
      <td style="text-align: center; border-top: 1px solid #333; padding-top: 6px;">
        <span class="italic">To'liq ismi sharifi</span><br/>
        <span class="bold highlight">${guardianName}</span>
      </td>
      <td style="text-align: center; border-top: 1px solid #333; padding-top: 6px;">
        <span class="italic">Sana</span><br/>
        <span class="highlight">${contractDate}</span>
      </td>
      <td style="text-align: center; border-top: 1px solid #333; padding-top: 6px;">
        <span class="italic">Imzo</span>
      </td>
    </tr>
  </table>
</div>

</body>
</html>`
}
