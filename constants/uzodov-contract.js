export const getDonoSchoolContractHtml = (data = {}) => {
  const {
    contractNumber = '___',
    contractDate = '____-__-__',
    contractEndDate = '31.08.2026',
    directorName = 'Sharipova D.A',
    childName = '________________________',
    guardianName = '________________________',
    guardianRelation = 'qonuniy vakili',
    guardianPassport = '________________________',
    premiumPayment = '3 400 000',
    standardPayment = '3 200 000',
    siblingDiscount = '200 000',
    guardianPassportIssuedBy = '________________________',
    guardianPhone1 = '________________________',
    guardianPhone2 = '________________________',
    guardianAddress = '________________________',
    guardianPinfl = '________________________',
    guardianType = '',
    yearlyPayment = "38070000",
    monthlyPayment = "3,807,000",
    studentName = "",
    studentBirthday
  } = data

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Shartnoma</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Times New Roman', serif;
    font-size: 13px;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 20px 0px;
  }

  h1 { text-align: center; font-size: 15px; text-transform: uppercase; margin-bottom: 6px; }
  h2 { text-align: center; font-size: 14px; margin-bottom: 4px; }
  .subtitle { text-align: center; margin-bottom: 16px; }

  .header-line {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    margin-bottom: 16px;
  }

  .intro { text-align: justify; margin-bottom: 16px; text-indent: 20px; }

  .section-title {
    text-align: center;
    font-weight: 700;
    margin: 20px 0 10px;
    text-transform: uppercase;
  }

  p.article { text-align: justify; margin-bottom: 6px; text-indent: 5px; }

  .bold { font-weight: 700; }
  .highlight { background: #fffde7; padding: 1px 4px; border-radius: 2px; }

  ul { margin: 10px 0 10px 40px; }
  ul li { margin-bottom: 8px; line-height: 2; }

  table.requisites { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #333; }
  table.requisites td { vertical-align: top; padding: 6px 10px; border: 1px solid #333; }

  .requisites label {
   font-weight:600
  }

  .signature-line {
    margin-top: 24px;
    border-top: 1px solid #333;
    width: 200px;
    display: inline-block;
  }

  @page {
    size: A4;
    margin: 12mm 20mm;
  }
  @media print {
    body { padding: 20px; margin: 10px; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<h1>Maktabgacha ta'lim xizmat ko'rsatish shartnomasi</h1>
<h2 class=" highlight ">№ ${contractNumber}</h2>

<div class="header-line">
  <span class=" highlight ">${contractDate}</span>
  <span>Toshkent sh.</span>
</div>

<p class="intro">
  Nizom asosida ish olib boruvchi "DONO SCHOOL" MCHJ maktabi direktori SHARIPOVA D.A bir tomondan (keyingi o'rinlarda "Bajaruvchi" hamda "Maktab" deb ataladi), o'quvchining qonuniy vakili <span class=" highlight ">${guardianType}</span> <span class=" highlight "> ${guardianName}</span>  ikkinchi tomondan (keyingi o'rinlarda "Buyurtmachi" deb ataladi), o'quvchi <span class=" highlight "> ${studentName} (${studentBirthday})</span> ni (keyingi o'rinlarda "o'quvchi" deb ataladi) davlat standartlari asosida o'rta maktab ta'limini olishi uchun mazkur shartnomani tuzdilar.
</p>

<!-- ==================== 1. SHARTNOMA PREDMETI ==================== -->
<div class="section-title">1. SHАRTNOMА PREDMETI</div>

<p class="article">1.1. "Bajaruvchi" o'quvchini 1A RUS-sinfga (Rus tili) o'qishga qabul qiladi va davlat ta'lim standartlariga mos bo'lgan sifatli ta'lim xizmatlarini ko'rsatadi. "Buyurtmachi" esa, ushbu ta'lim xizmatlari uchun haq to'laydi.</p>
<p class="article">1.2. O'quvchining maktabda ta'lim olish muddati o'quv dasturi va maktab Nizomiga muvofiq (sinov muddati bilan) 2026-09-01 dan 2027-06-30 yilgacha tashkil etiladi. Shartnoma uchun to'lov haqiqiy xizmat ko'rsatish muddatiga mos ravishda hisob-kitob qilinadi.</p>
<p class="article">1.3. Ta'lim sifati va davomiyligini ta'minlash maqsadida, 9+1 oy davomida o'quv jarayoni tashkil ettiriladi, ya'ni iyun oyi ham o'quv davriga kiradi.</p>

<!-- ==================== 2. MAKTABDA O'QUV JARAYONLARINI TASHKILLLASHTIRISH ==================== -->
<div class="section-title">2. MАKTАBDА O'QUV JАRАYONLАRINI TАSHKILLАSHTIRISH</div>

<p class="article">2.1. Maktab o'quv jarayonini amalga oshirish va uni tashkillashtirishda Shartnomaga muvofiq ta'lim xizmatlarini Ota-ona (Vasiy/Homiy)lar tomonidan to'lanadigan haq to'lovlari asosida olib boradi va quyidagi xizmatlarni amalga oshiradi:</p>
<p class="article">2.1.1. "Bajaruvchi" tomonidan maktab O'zbekiston Respublikasining Davlat Ta'limi Standarti (keyingi o'rinlarda DTS-deb ataladi) va Maktab ichki metodikasiga asoslangan o'quv dasturi asosida ta'lim faoliyatini amalga oshirishda tegishli o'quv qo'llanma va darslik kitoblari bilan ta'minlanadi. O'quvchilarning bo'sh vaqtlaridan samarali foydalanish maqsadida qo'shimcha to'garaklar maktab ma'muriyati va ota-onalarning takliflarini inobatga olgan holda tashkil etiladi.</p>
<p class="article">2.1.2. DTSga asosan Maktab o'quvchilarining bilim va ko'nikmalarini bosqichma-bosqich attestatsiyadan o'tkazish tartibi maktabning belgilangan mundarija va berilgan darslar hajmi hamda sinflar kesimida amalga oshiriladi. Shuningdek o'quvchilarni bilimini nazorat qilish maqsadida oraliq attestatsiyalar ham o'tkaziladi.</p>
<p class="article">2.1.3. "Bajaruvchi" o'quv jarayonini O'zbekiston Respublikasi fuqarolik kodeksi, "Xo'jalik yurutuvchi subektlar faoliyatining shartnomaviy-huquqiy bazasi to'g'risida"gi, "Ta'lim to'g'risidagi qonunlar, O'zbekiston Respublikasi Prezidentining 15.09.2017yildagi № PQ- 3276 sonli "Nodavlat ta'lim xizmatlari ko'rsatish faoliyatini yanada rivojlantirish chora- tadbirlari to'g'risidagi" qarori va O'zbekiston Respublikasi Vazirlar Mahkamasining 24.12.2019 yildagi №1028-sonli "Nodavlat ta'lim tashkilotlari faoliyatini takomillashtirish chora-tadbirlari to'g'risida" qarori hamda maktab nizomi, ichki tartib va odob-ahloq qoidalari va boshqa lokal hujjatlar asosida amalga oshiradi.</p>
<p class="article">2.1.4. O'n bir yillik majburiy umumiy o'rta ta'lim tizimiga izchil o'tishni ta'minlash, takomillashtirilgan davlat ta'lim standarti va o'quv dasturlari asosida maktab bitiruvchilariga Davlat namunasidagi Attestat (Shahodatnoma) beriladi.</p>

<!-- ==================== 3. MAKTABNING HUQUQLARI ==================== -->
<div class="section-title">3. Maktabning huquqlari</div>

<p class="article">3.1. Maktab DTS va o'quv dasturi asosida ishlab chiqilgan ichki metodikasiga muvofiq o'quv qo'llanmalari va texnik vositalaridan keng foydalangan holda ta'lim va tarbiya berish hamda bosqichma-bosqich oraliq imtihonlarini o'quv reja asosida o'tkazadi.</p>
<p class="article">3.2. Maktab ichki belgilangan tartib va qoidalarga ko'ra O'quvchining dars va to'garak jadvallarini, ta'til kunlarini, (bunda o'quvchiga tegishli yo'riqnoma va ilovalar hamda akademik kalendar taqdim etiladi), o'quvchining maktab formasi tartibini belgilaydi va bu haqda ota-onalarga e'lon qiladi.</p>
<p class="article">3.3. Har bir o'quvchini maktab ruhshunosi va malakali o'qituvchi suhbati va imtihoni asosida maktabga qabul qiladi.</p>
<p class="article">3.4. O'quvchiga davlat ta'lim standartlari talablariga muvofiq bo'lgan dastur asosida pullik ta'lim xizmati ko'rsatadi. Pullik ta'lim xizmatlarini bozor iqtisodiyoti va maktabning ichki moliyaviy holati bo'yicha erkin belgilash huquqiga ega.</p>
<p class="article">3.5. O'quvchining maktabga kelish jarayonida yuqumli kasallik bilan kasallanganligi aniqlansa, o'quvchi davolanib to'liq tuzalganligi to'g'risida shifokor ma'lumotnomasi taqdim etguniga qadar, maktab ma'muriyati o'quvchini maktabga kiritilishini taqiqlashi mumkin.</p>
<p class="article">3.6. Maktabda o'tkaziladigan har bir tadbir to'g'risida maktab ma'muriyati tomonidan maktab internet veb saytlariga joylashtirish, ijtimoiy tarmoqlarida yoritish va ota-onalarning mobil telefon raqamiga ma'lumotlarni yuboradi.</p>
<p class="article">3.7. Maktab ma'muriyati "Buyurtmachi" tomonidan Mazkur shartnomaga muvofiq to'lovlarni ushbu shartnomaning 7.4-bandiga muvofiq o'z vaqtida amalga oshirmagan taqdirda o'quvchini darslarga kiritmaslik hamda ushbu shartnomaning 8.1 (4)-bandiga asosan Shartnomani bir tomonlama bekor qilish huquqiga ega. (Bunday hollarda "Buyurtmachi" tomonidan e'tirozlar bildirilmaydi va barcha javobgarlikni o'z zimmasiga oladi.)</p>
<p class="article">3.8. Maktab ma'muriyati o'quvchi tomonidan maktab Nizomi, Ichki tartib va odob-ahloq qoidalarida ko'rsatilgan tartib-intizomga rioya etmasa, Maktab ma'muriyati tomonidan tuzilgan jamoat kengashi qarori yoki Maktab direktorining buyrug'iga ko'ra maktabdan chetlashtirish huquqiga ega.</p>
<p class="article">3.9. Maktabning ta'lim faoliyatiga putur yetadigan har qanday yolg'on axborot va ma'lumot (manipulyatsiya, provokatsiya, o'quvchining qonuniy vakillari yohud unga aloqador yaqin qarindoshlarining guruh-guruh bo'lib maktab faoliyatini obro'sizlantirish va Maktab ma'muriyati xodimlarini va o'qituvchilarini haqorat qilish, so'kish, va sha'ni va qadr-qimmatini kamsitilishi)ni ijtimoiy tarmoqlarda tarqatilishida ishtirok etgan shaxslar ustidan tegishli organlariga murojaat qilish huquqiga ega.</p>
<p class="article">3.10. Mazkur Shartnomaning 3.9-bandida ko'rsatilgan holatlar o'quvchining ota-onalari yoki uning qonuniy vakillari tomonidan sodir etilgan taqdirda Maktab, o'quvchining ota-onasi yoki qonuniy vakillari bilan tuzilgan shartnomani bir tomonlama bekor qilish huquqiga ega.</p>
<p class="article">3.11. Maktab pullik ta'lim xizmat ko'rsatish uchun o'zining moliyaviy, marketing va raqobat siyosatidan kelib chiqgan holda Shartnomaga muvofiq mijozlar uchun chegirmalar e'lon qilishi mumkin.</p>

<!-- ==================== 4. MAKTABNING MAJBURIYATLARI ==================== -->
<div class="section-title">4. Maktabning majburiyatlari</div>

<p class="article">4.1. Maktab tegishli suhbat va imtihonlar orqali o'quvchini qabul qiladigan bo'lsa O'quvchining ota-onasi yoki qonuniy vakillari bilan tuziladigan Shartnoma uchun quyidagi hujjatlar:</p>
<ul>
  <li>Ota-ona tomonidan farzandini maktabga qabul qilinishi to'g'risidagi arizasi,</li>
  <li>O'quvchining emlanganligi to'g'risidagi ma'lumotnomasi,</li>
  <li>O'quvchining tug'ilganlik to'g'risidagi guvohnoma yoki pasport nusxasi,</li>
  <li>O'quvchining 086 shaklidagi shifokor ma'lumotnomasi,</li>
  <li>O'quvchining oxirgi tahsil olgan o'quv muassasasidan shaxsiy hujjatlar jamlanmasi,</li>
  <li>O'quvchi ota-onasining pasport nusxasi,</li>
  <li>O'quvchining turar joyidan mahalla dalolatnomasi. (Toshkent shahrida doimiy ro'yxatda turuvchilar bundan mustasno) jamlanmasi ilova qilingandan so'ng, Maktab direktorining buyrug'i asosida maktabning o'quvchilar ro'yxatiga kiritadi.</li>
</ul>
<p class="article">4.2. Har bir o'quvchini maktab ruhshunosi va malakali o'qituvchi suhbati va imtihoni asosida maktabga qabul qilish jarayonini tashkillashtiradi.</p>
<p class="article">4.3. O'quvchiga davlat ta'lim standartlari talablariga muvofiq bo'lgan dastur asosida pullik ta'lim xizmati ko'rsatishda o'ziga qo'yilgan talablarni bajaradi.</p>
<p class="article">4.4. Maktab tomonidan darslarni o'tkazish uchun sanitar va gigienik talablarga javob beradigan, yong'in xavfsizligi qoidalariga amal qilingan va ta'lim jarayoni uchun talab etilgan majburiy me'yoriy qoidalarga javob beradigan sinf xonalari bilan ta'minlanadi.</p>
<p class="article">4.5. Maktab sinflarda o'quvchilar sonini yigirma ikki  kishidan oshmagan holda dars jarayonini tashkillashtiradi.</p>
<p class="article">4.6. Maktab tomonidan o'quvchilarga birinchi tibbiy xizmat ko'rsatish (bunda o'quvchi jarohat olganda birinchi tibbiy yordam ko'rsatiladi va o'quvchining ota-onasi xabardor qilinadi. Agarda Ota-ona (Vasiy/Homiy) o'z vaqtida maktab binosiga etib kelmasa Maktab 103 ishonch telefoniga murojaat qiladi. O'quvchilarning yillik emlash ishlari ota-ona (Vasiy/Homiy) zimmasida qoladi va amalga oshiriladi.</p>
<p class="article">4.7. Mazkur Shartnoma bo'yicha faqat o'quvchi betob bo'lganda, davolanayotgan hollarda, darslarga qatnasha olmagan umumiy kunlari soni uzluksiz bir oy va undan ortiq bo'lsa, qoldirilgan darslari uchun tegishli tibbiy ma'lumotnoma taqdim etgan taqdirida shartnoma bo'yicha belgilangan to'lovning bir oylik miqdori chegirib tashlanadi. (bunda o'quvchi maktabga 1 (bir) oydan kam muddat kelmagan bo'lsa to'lovlarni qayta hisob-kitob qilinishiga va chegirib qolinishiga yo'l qo'yilmaydi), (o'quvchilarning uzluksiz sababsiz dars qoldirishlari, ota-onasi bilan chet-el safarlariga ketishlari bundan mustasno, ushbu holatda ota-onalar tomonidan o'quvchining ta'lim hizmatlari uchun to'lovlar so'zsiz amalga oshiriladi);</p>
<p class="article">4.8. O'quvchining mazkur Shartnomaning 4.7-bandiga asosan Tibbiyot birlashmasi yoki davolangan muassasadan kasalligi to'g'risidagi Tibbiy ma'lumotnomasini olgan kundan 2 (ikki) ish kuni davomida maktab Bosh ma'muriy idorasi, shartnomalar bilan ishlash bo'limi mutaxassisiga topshirishi lozim.</p>
<p class="article">4.9. Ota-ona (vasiy) tomonidan yuqorida bandda ko'rsatilgan muddatda farzandining kasalligi yoki davolanganligi to'g'risidagi Tibbiy ma'lumotnomani o'z vaqtida topshirilmasligi, farzandining o'qishi uchun to'langan to'lovlar bo'yicha qayta hisob-kitob qilinishi va chegirib qolinishini rad etish uchun asos bo'ladi.</p>
<p class="article">4.10. Maktabning belgilangan tizimi orqali o'quvchining muvaffaqiyatlari va muammolari haqida Sinf rahbari/masul xodim orqali har chorakda bir marta o'quvchining qonuniy vakillariga xabar berib boradi.</p>
<p class="article">4.11. Maktab tomonidan ushbu shartnomaga o'zgartirish va qo'shimchalar kiritish to'g'risida "Buyurtmachi"ni yozma ravishda 3 kunlik muddatda ogohlantiradi.</p>
<p class="article">4.12. Maktabda o'quvchilar xavfsizligini ta'minlash maqsadida qo'riqlash xizmati tashkil etiladi.</p>

<!-- ==================== 5. OTA-ONA HUQUQLARI ==================== -->
<div class="section-title">5. O'quvchining ota-onasi va qonuniy vakili (vasiy/homiy)ning huquqlari</div>

<p class="article">5.1. Ota-ona(Vasiy/Homiy) maktabning har bir ichki hujjatlari (maktab Nizomi, ichki tartib va odob-axloq qoidalari, maktab shartnomasi hamda maktab faoliyatini tashkil etish bilan bog'liq litsenziya (guvohnoma), qo'shimcha xizmatlar va maktab faoliyati) bilan tanishib chiqish huquqiga ega.</p>
<p class="article">5.2. Ota-ona(Vasiy/Homiy) maktab ma'muriyatidan maktab faoliyati, o'quv jarayoni, shartnoma bo'yicha xizmat ko'rsatish masalalari, farzandining bilimi, hulqi to'g'risida ma'lumot olish huquqiga ega.</p>
<p class="article">5.3. Ota-ona(Vasiy/Homiy) Maktab ma'muriyatining pedagogik kengashlarida ishtirok etish, zarur hollarda ta'lim masalalari bo'yicha o'z takliflarini maktab ma'muriyatiga kiritadi.</p>
<p class="article">5.4. Ota-ona (Vasiy/Homiy) maktabning hisob raqamiga xayriya (Homiylik) pullarini qo'shish.</p>

<!-- ==================== 6. OTA-ONA MAJBURIYATLARI ==================== -->
<div class="section-title">6. O'quvchining ota-onasi va qonuniy vakili (vasiy/homiy)ning majburiyatlari</div>

<p class="article">6.1. Ota-ona (Vasiy/Homiy) o'quvchining Maktabda ta'lim olishi uchun to'lovlarni o'z vaqtida amalga oshirishi.</p>
<p class="article">6.2. Maktabda o'quvchining xatti-harakati uchun maktab ichki tartib va odob-ahloq qoidalarida belgilangan qoidlari doirasida javobgar bo'ladi.</p>
<p class="article">6.3. O'quvchining maktabdan tashqaridagi harakatini ota-onaning o'zi nazorat qiladi.</p>
<p class="article">6.4. Farzandining harakati bilan maktab mulkiga zarar etsa, moddiy yoki nomoddiy zarar etkazgan holatlar uchun ota-ona javobgarlikni o'z zimmasiga oladi hamda maktabga yetkazilgan moddiy zararni to'liq qoplaydi.</p>
<p class="article">6.5. Maktab tomonidan chiqarilgan darsliklarning yaroqligini ta'minlash, darsliklar yaroqsiz holga kelgan taqdirda ularning to'liq narxini qoplash.</p>
<p class="article">6.6. O'quvchining uy vazifalarini doimiy ravishda kuzatib borish, shuningdek o'qituvchilarning talablari va tavsiyalariga rioya qilish xatti-harakatlari haqida maktab ma'muriyatiga xabar berish.</p>
<p class="article">6.7. Farzandining shubhali xatti-harakatlari haqida maktab ma'muriyatiga o'z vaqtida xabar berishi mumkin.</p>
<p class="article">6.8. Ota-ona(Vasiy/Homiy) o'z farzandiga maktab qonun-qoidalari bilan tanishtirishi, uning ijrosini ta'minlashi, maktabning barcha ishchi xodimlariga hurmat va odob bilan muomalada bo'lishi hamda tahdidiy va tajovuzkorona munosabatdan yiroq bo'lishi.</p>
<p class="article">6.9. Har bir ota-ona(Vasiy/Homiy) maktab ma'muriyati, ishchi xodimlari, o'qituvchilari va boshqa ota-onalarning shaxsiyatiga, oilaviy sharoiti va muammolariga aralashmasligi.</p>
<p class="article">6.10. Har bir ota-ona agar ularning yashash manzili, bankdagi hisob raqami yoki rekviziti, elektron manzili hamda telefon raqami o'zgarsa, 48-soat ichida ta'lim olayotgan maktab ma'muriyatiga yozma ravishda ma'lumot berishi.</p>
<p class="article">6.11. Ota-ona(Vasiy/Homiy) farzandini maktabga kim tomonidan olib kelinishi va olib ketilishi hamda, ba'zi bir sabablarga ko'ra maktabga kela olmasligi to'g'risida maktab ma'muriyatiga yozma ravishda ma'lumot berishi.</p>
<p class="article">6.12. Ota-ona(Vasiy/Homiy) farzandini maktab nizomida belgilab qo'ygan soatda maktabga o'z vaqtida olib kelishi (soat 8.30 dan kech qolmagan holda) va olib ketishini (soat 17.00) ta'minlash (maktab transportidan foydalanuvchilar bundan mustasno).</p>
<p class="article">6.13. Ota-ona(Vasiy/Homiy) quyidagilar to'g'risida maktab ma'muriyatiga yozma ravishda ma'lumot berishi kerak:</p>
<ul>
  <li>O'quvchining kasalligi, qanday dorilarga allergiya yoki reaktsiyasi borligi,</li>
  <li>O'quvchi qaysi fanlardan o'zlashtirishi pastligi yoki ta'lim jarayonida tahsil olishda bo'layotgan muammolar (sog'lig'i tufayli yoki boshqa sabablar) to'g'risida;</li>
  <li>O'quvchining ijtimoiy oilaviy sharoiti to'g'risida to'liq ma'lumot berish.</li>
</ul>

<!-- ==================== 7. HISOB-KITOB ==================== -->
<div class="section-title">7. Hisob-kitob qilish tartibi</div>

<p class="article">7.1. Shartnomaga muvofiq (ta'lim xizmatlariga) kelishilgan to'lov miqdori bir o'quv yili uchun <span class="bold highlight ">${yearlyPayment} so'm</span>ni tashkil qiladi. To'lovni oyma-oy bo'lib to'lashga yo'l qo'yiladi. Bunda bir oy uchun to'lov miqdori <span class="bold highlight ">${monthlyPayment} so'm</span>ni tashkil qiladi.</p>
<p class="article">7.2. Maktabga o'quvchini qabul qilish jarayonida mazkur Shartnoma uchun oldindan kelasi oy uchun mijoz tomonidan to'lanadi.</p>
<p class="article">7.3. Mazkur Shartnomaning 7.1-bandiga asosan Ota-ona (Vasiy/Homiy)lar tomonidan o'quvchining ta'lim olishi uchun o'n oylik to'lov amalga oshiriladi.</p>
<p class="article">7.4. "Buyurtmachi" har oy uchun to'lovni, oy boshlanishidan kamida 5 (besh) kun avval to'lashni o'z zimmasiga oladi. (bunda keyingi oy uchun to'lovlar joriy oyning 25 sanasigacha avvaldan to'lanishi lozim — misol uchun: oktyabr oyi uchun to'lovlar o'tgan sentyabr oyining 25 sanasigacha to'liq to'langan bo'lishi nazarda tutiladi).</p>
<p class="article">7.5. "Buyurtmachi" tomonidan ushbu shartnomaning 7.4-bandida ko'rsatilgan muddat buzilsa, o'quvchini darslarga kiritmaslik yoki maktabdan chetlashtirish choralari ko'rilishiga sabab bo'ladi.</p>
<p class="article">7.6. Ta'lim xizmatlari uchun to'lov maktab g'aznasiga yoki "Bajaruvchi"ning bankdagi hisob raqamiga to'lanadi.</p>
<p class="article">7.7. Shartnoma 3 tomonlama tuzilgan hollarda "Buyurtmachi" uchun to'lovni "Uchinchi shaxs" tomonidan amalga oshirishga mazkur shartnoma va qonun hujjatlariga muvofiq yo'l qo'yiladi.</p>
<p class="article">7.8. Mazkur shartnoma imzolangan kundan boshlab 3 (uch) bank ish kuni davomida "Buyurtmachi" tomonidan to'lov to'liq miqdorda amalga oshirilmasa, bir tomonlama shartnoma bekor qilinishi mumkin.</p>
<p class="article">7.9. "Buyurtmachi" "Bajaruvchi"ning o'quvchiga ta'lim xizmatini ta'minlash xarajatlari 3 oy avvaldan rejalashtirilganligiga o'z roziligini bildiradi va o'quvchini maktab tashabbusi bilan maktabdan chetlashtirilgan taqdirda, to'lov summasi shartnomaning 7.10-bandiga asosan qaytarib beriladi.</p>
<p class="article">7.10. Mazkur shartnoma tomonlarning kelishuviga ko'ra muddatidan oldin yoki "Bajaruvchi" tomonidan bir tomonlama bekor qilingan taqdirda, Pul mablag'larini qaytarish mazkur shartnomaga asosan joriy o'quv yilining yakuni bo'yicha 25 Iyun kuni amalga oshiriladi. "Buyurtmachi" tomonidan amalga oshirilgan to'lovning, qanday shaklda to'langanidan qat'iy nazar naqd pulda qaytarilmaydi.</p>
<p class="article">7.11. O'quvchi Maktab ichki tartib qoidalarini qo'pol tarzda buzishi (Mushtlashish, Chekish, Milliy qadriyatatlarga mos kelmagan video materiallarni ko'rish, olib yurish va x/k) sababli yoki og'ir kasallik va chet elga ko'chib ketishi sababli Shartnoma bekor qilinsa "Bajaruvchi" tomonidan shartnomaga muvofiq qayta hisoblangan pul mablag'larini "Buyurtmachiga" o'quv yili tugagandan so'ng iyul oyida qaytarib beriladi.</p>
<p class="article">7.12. Buyurtmachining tashabbusi bilan Shartnoma bekor qilinsa "Bajaruvchi" tomonidan shartnomaga muvofiq pul mablag'larini "Buyurtmachiga" qaytarib berilmaydi.</p>
<p class="article">7.13. Ota-ona (Vasiy/Homiy) farzandining ta'lim olishi bo'yicha shartnoma bekor qilinish vaqtida farzandining boshqa maktabga qabul qilinishi bo'yicha "Qabul qilish" talonini elektron yoki yozma nusxasini Maktab ma'muriyati Shartnomalar bilan ishlash bo'limi mutaxassisiga topshirishi shart.</p>
<p class="article">7.14. Mazkur Shartnomaning 7.13-bandiga asosan Ota-ona (Vasiy/Homiy) tomonidan "Qabul qilish" talonining o'z vaqtida topshirilmasligi tegishli tartibda Maktab ma'muriyati tomonidan voyaga yetmaganlar ishlari bo'yicha tuman (shahar) komissiyasi yoki Tuman IIBga murojaat qilishga asos bo'ladi.</p>

<!-- ==================== 8. BEKOR QILISH ==================== -->
<div class="section-title">8. Shartnomani bekor qilish shartlari</div>

<p class="article">8.1. Mazkur shartnomani quyidagi holatlarda muddatidan oldin bekor qilish mumkin: Tomonlarni o'zaro kelishuviga muvofiq; O'zbekiston Respublikasining amaldagi qonunchiligida nazarda tutilgan asoslarda tomonlardan birining tashabbusiga ko'ra.</p>
<p class="article">8.2. Mazkur shartnomaning 7.4-bandi ko'rsatilgan muddatlarda "Ota-onalar yoki uning qonuniy" vakillari tomonidan shartnoma bo'yicha to'lovlar to'liq amalga oshirilmaganda 3 (uch) bank ish kuni davomida "Bajaruvchi" tomonidan shartnoma bir tomonlama bekor qilinishi mumkin.</p>
<p class="article">8.3. Bundan tashqari "Bajaruvchi" quyidagi holatlarda tegishli ogohlantirishdan so'ng mazkur shartnoma shartlarini bajarishni rad qilishi mumkin: Agar "Buyurtmachi" shartnomada ko'rsatilgan xizmatlar uchun to'lov muddatini belgilangan muddatlardan ortiq kechiktirgan bo'lsa; "Bajaruvchi" qaroriga ko'ra, O'quvchi bir necha bor intizom buzishi sababli maktabdan chetlashtirilishi mumkin. Agar intizomiy choralar va pedagogik ta'sir choralari samara bermaganda va o'quvchining maktabda qolishi boshqa o'quvchilarga salbiy ta'sir ko'rsatsa, "Bajaruvchi" xodimlarining huquqlarini poymol qilsa, shuningdek, "Bajaruvchi" normal faoliyat ko'rsatishga to'sqinlik qilsa, O'quvchini maktabdan chetlashtirish chorasi qo'llaniladi. Agar ota-ona farzandining sog'lig'idagi jiddiy muammolarni, turli hil ruhiy kasalliklar (epelepsiya, autizm, o'ta asabiylik)ni bilib turib yashirgan bo'lsa, yil davomida ular namoyon bo'lib, atrofdagilarga zarar yetkazishi aniqlangan vaqtning o'zida shartnomani bir tomonlama bekor qilish uchun asos bo'ladi.</p>
<p class="article">8.4. Mazkur shartnoma bo'yicha ta'lim xizmatlarini ko'rsatish "Bajaruvchi" tomonidan "Buyurtmachi"ni xizmat ko'rsatishini bekor qilish haqida yozma ravishda xabardor qilgan kundan boshlab, 3 kun o'tgandan so'ng bekor bo'lgan hisoblanadi.</p>
<p class="article">8.5. "Buyurtmachi" "Bajaruvchi"ning amalda qilgan xarajatlarini to'lab berish sharti bilan istalgan paytdan shartnomani bekor qilishi mumkin.</p>
<p class="article">8.6. Mazkur Shartnomani bekor qilish uchun o'quvchining ota-onasi/qonuniy vakillari farzandining boshqa maktabda tahsil olishi bo'yicha ushbu maktabdan qabul qilish talonini olib kelish shart.</p>

<!-- ==================== 9. FORS-MAJOR ==================== -->
<div class="section-title">9. Fors-major holatlari</div>

<p class="article">9.1. Taraflar shartnomasi fors-major holatlari, ya'ni yengib bo'lmaydigan kuch, favqulodda va muayyan sharoitlarda oldini olib bo'lmaydigan vaziyatlar (zilzila, qo'rg'oqchilik, suv toshqini, yong'in, sel, do'l, jala, kuchaytirilgan karantin (hukumat yoki prezident qarorlari bilan tasdiqlangan kuchaytirilgan karantin holatlarida) ommaviy epidemiya va boshqa tabiiy ofatlar) tufayli majburiyatlarni bajarmagan yoki lozim darajada bajarmaganligini isbotlansa, javobgar bo'lmaydilar.</p>
<p class="article">9.2. Sodir bo'lgan fors-major holatlari to'g'risida taraflar bir-birlarini ushbu holatlar yuz bergan holda zudlik bilan yozma yoki og'zaki tartibda xabardor qilishlari shart.</p>
<p class="article">9.3. Mazkur shartnoma bo'yicha majburiyatlarni bajarish muddati yengib bo'lmaydigan kuch holatlarini davomiyligini hisobga olib, shartnomani amal qilish muddatini uzaytirishlari mumkin.</p>

<!-- ==================== 10. JAVOBGARLIK ==================== -->
<div class="section-title">10. Tomonlarning javobgarligi</div>

<p class="article">10.1. Tomonlar o'z majburiyatlarini bajarmagan yoki tegishli ravishda bajarmagan taqdirda O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq javobgar hisoblanadilar. Shartnoma shartlari yuzasidan nizo va kelishmovchliklar tomonlar o'rtasida o'zaro hal qilinadi.</p>
<p class="article">10.2. Nizo va kelishmovchiliklarni muzokara yo'li bilan hal etishning imkoni bo'lmasa, qonun hujjatlariga muvofiq O'zbekiston Respublikasi fuqarolik ishlari bo'yicha tumanlar aro sudida ko'rib chiqiladi.</p>
<p class="article">10.3. Ushbu shartnomada belgilanmagan boshqa shartlar, O'zbekiston Respublikasining amaldagi qonunchiligi bilan tartibga solinadi.</p>

<!-- ==================== 11. REKVIZITLAR ==================== -->
<div class="section-title">11. Taraflarning yuridik manzillari va rekvizitlari</div>

<table class="requisites">
  <tr>
    <td>
      <div class="bold">«DONO SCHOOL" МЧЖ</div>
      <div><span class="label">Адрес:</span> Jarariq MFY, Kichik halqa yo'li ko'chasi, 83-uy</div>
      <div><span class="label">Банк:</span> ТОШКЕНТ Ш., "ASIA ALLIANCE BANK" AT БАНКИ</div>
      <div><span class="label">МФО:</span> 01095</div>
      <div><span class="label">Х/Р:</span> 20208000307073516003</div>
      <div><span class="label">СТИР:</span> 311 335 541</div>
      <div><span class="label">ТЕЛ:</span> +998 95 904 00 08</div>
      <br/>
      <div><span class="label">Рахбар:</span> SHARIPOVA DILAFRUZ ABIDJANOVNA</div>
      <div style="margin-top: 6px;">М.У'</div>
      <div class="signature-line"></div>
    </td>
    <td>
      <div class="label">BUYURTMACHI</div>
      <div><span class="label">Yashash manzili:</span> <span class=" highlight " >${guardianAddress}</span></div>
      <div><span class="label">Pasport seriyasi va raqami:</span> <span class="  highlight  ">${guardianPassport}</span></div>
      <div><span class="label">PINFL:</span> <span class="  highlight  ">${guardianPinfl}</span></div>
      <div><span class="label">Kim tomonidan berilgan:</span> <span class="  highlight  ">${guardianPassportIssuedBy}</span></div>
      <div><span class="label">Tel. raqami:</span> <span class="  highlight  ">${guardianPhone1}</span> ; <span class="  highlight  ">${guardianPhone2}</span></div>
      <br/> 
      <div><span class="label">Vasiy turi:</span> <span class="  highlight  ">${guardianType}</span></div>
      <div><span class="label">Vasiy:</span> <span class="bold  highlight  ">${guardianName}</span></div>
      <div class="signature-line"></div>
    </td>
  </tr>
</table>
</body>
</html>`
}