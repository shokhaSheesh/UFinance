export const getSergeliContractHtml = (data = {}) => {
  const {
    contractNumber = '___',
    contractDate = '____-__-__',
    academicYear = '2025-2026',
    directorName = 'DADASHEVA ZIYODAOY SHAVKAT QIZI',
    guardianName = '________________________',
    studentName = '________________________',
    className = '___',
    language = "O'zbek tili",
    validFrom = '____-__-__',
    validTo = '____-__-__',
    monthlyPayment = '3,600,000',
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
  Nizom asosida ish olib boruvchi "FAIR SCHOOL" MCHJ maktabi nomidan direktori
  <span class="bold">${directorName}</span> bir tomondan (keyingi o'rinlarda "Bajaruvchi"
  xamda "Maktab" deb ataladi), o'quvchining qonuniy vakili <span class="bold highlight ">${guardianName}</span> Ikkinchi
  tomondan (keyingi o'rinlarda "Buyurtmachi" deb ataladi), o'quvchi <span class="bold highlight ">${studentName}</span>ni
  (keyingi o'rinlarda "o'quvchi" deb ataladi) davlat standartlari asosida o'rta
  maktab ta'limini olishi uchun mazkur shartnomani tuzdilar.
</p>

<div class="section-title">1. SHARTNOMA PREDMETI</div>

<p class="article">
  1.1. "Bajaruvchi" o'quvchini <span class="bold highlight ">${className} ${language}</span>-sinfga o'qishga qabul qiladi va davlat
  ta'lim standartlariga mos bo'lgan sifatli ta'lim xizmatlarini ko'rsatadi. "Buyurtmachi" esa,
  ushbu ta'lim xizmatlari uchun haq to'laydi.
</p>

<p class="article">
  1.2. O'quvchining maktabda ta'lim olish muddati o'quv dasturi va maktab Nizomiga
  muvofiq (1 oy sinov muddati bilan) <span class=" highlight ">${validFrom}</span> dan <span class=" highlight ">${validTo}</span> yilgacha tashkil etiladi.
  Shartnoma uchun to'lov haqiqiy xizmat ko'rsatish muddatiga mos ravishda hisob-kitob qilinadi.
</p>

<p class="article">
  1.3. Ta'lim sifati va davomiyligini ta'minlash maqsadida, 10 oy davomida o'quv jarayoni
  tashkil ettiriladi, ya'ni iyun oyi ham o'quv davriga kiradi.
</p>

<div class="section-title">2. MAKTABDA O'QUV JARAYONLARINI TASHKILLASHTIRISH</div>

<p class="article">
  2.1. Maktab o'quv jarayonini amalga oshirish va uni tashkillashtirishda Shartnomaga
  muvofiq ta'lim xizmatlarini Ota-ona (Vasiy/Homiy)lar tomonidan to'lanadigan haq to'lovlari
  asosida olib boradi va quyidagi xizmatlarni amalga oshiradi:
</p>

<p class="article-sub">
  2.1.1. "Bajaruvchi" tomonidan maktab O'zbekiston Respublikasining Davlat Ta'limi
  Standarti (keyingi o'rinlarda DTS-deb ataladi) va Maktab ichki metodikasiga asoslangan o'quv
  dasturi asosida ta'lim faoliyatini amalga oshirishda tegishli o'quv qo'llanma va darslik
  kitoblari bilan ta'minlanadi.
</p>

<p class="article-sub">
  2.1.2. DTSga asosan Maktab o'quvchilarining bilim va ko'nikmalarini bosqichma-bosqich
  attestatsiyadan o'tkazish tartibi maktabning belgilangan mundarija va berilgan darslar hajmi
  hamda sinflar kesimida amalga oshiriladi.
</p>

<p class="article-sub">
  2.1.3. "Bajaruvchi" o'quv jarayonini O'zbekiston Respublikasi fuqarolik kodeksi va tegishli
  qonun hujjatlari asosida amalga oshiradi.
</p>

<p class="article-sub">
  2.1.4. O'n bir yillik majburiy umumiy o'rta ta'lim tizimiga izchil o'tishni ta'minlash,
  takomillashtirilgan davlat ta'lim standarti va o'quv dasturlari asosida maktab bitiruvchilariga
  Davlat namunasidagi Attestat (Shahodatnoma) beriladi.
</p>

<div class="section-title">3. MAKTABNING HUQUQLARI</div>

<p class="article">
  3.1. Maktab DTS va o'quv dasturi asosida ishlab chiqilgan ichki metodikasiga muvofiq
  o'quv qo'llanmalari va texnik vositalaridan keng foydalangan holda ta'lim va tarbiya berish
  hamda bosqichma-bosqich oraliq imtihonlarini o'quv reja asosida o'tkazadi.
</p>

<p class="article">
  3.2. Maktab ichki belgilangan tartib va qoidalarga ko'ra O'quvchining dars va to'garak
  jadvallarini, ta'til kunlarini, o'quvchining maktab formasi tartibini belgilaydi.
</p>

<p class="article">
  3.3. Har bir o'quvchini maktab ruhshunosi va malakali o'qituvchi suhbati va imtihoni
  asosida maktabga qabul qiladi.
</p>

<p class="article">
  3.4. O'quvchiga davlat ta'lim standartlari talablariga muvofiq bo'lgan dastur asosida pullik
  ta'lim xizmati ko'rsatadi. Pullik ta'lim xizmatlarini bozor iqtisodiyoti va maktabning ichki
  moliyaviy holati bo'yicha erkin belgilash huquqiga ega.
</p>

<p class="article">
  3.5. O'quvchining maktabga kelish jarayonida yuqumli kasallik bilan kasallanganligi
  aniqlansa, tegishli shifokor ma'lumotnomasi taqdim etguniga qadar, maktab ma'muriyati
  o'quvchini maktabga kiritilishini taqiqlashi mumkin.
</p>

<p class="article">
  3.6. Maktabda o'tkaziladigan har bir tadbir to'g'risida maktab ma'muriyati tomonidan
  ota-onalarni xabardor qiladi.
</p>

<p class="article">
  3.7. Maktab ma'muriyati "Buyurtmachi" tomonidan to'lovlarni o'z vaqtida amalga
  oshirmagan taqdirda o'quvchini darslarga kiritmaslik hamda Shartnomani bir tomonlama bekor
  qilish huquqiga ega.
</p>

<p class="article">
  3.8. Maktab ma'muriyati o'quvchi tomonidan maktab nizomi, Ichki tartib va odob ahloq
  qoidalarida ko'rsatilgan tartib-intizomga rioya etmasa, maktabdan chetlashtirish huquqiga ega.
</p>

<div class="section-title">4. MAKTABNING MAJBURIYATLARI</div>

<p class="article">
  4.1. Maktab tegishli suhbat va imtihonlar orqali o'quvchini qabul qiladigan bo'lsa
  O'quvchining ota-onasi yoki qonuniy vakillari bilan tuziladigan Shartnoma uchun quyidagi
  hujjatlar:
</p>
<ul class="docs-list">
  <li>Ota-ona tomonidan farzadini maktabga qabul qilinishi to'g'risidagi arizasi</li>
  <li>O'quvchining emlanganligi to'g'risidagi ma'lumotnomasi</li>
  <li>O'quvchining tug'ilganlik to'g'risidagi guvohnoma yoki pasport nusxasi</li>
  <li>O'quvchining 086 shaklidagi shifokor ma'lumotnomasi</li>
  <li>O'quvchining oxirgi tahsil olgan o'quv muassasasidan shaxsiy hujjatlar jamlanmasi</li>
  <li>O'quvchi ota-onasining pasport nusxasi</li>
  <li>O'quvchining turar joyidan mahalla dalolatnomasi</li>
</ul>

<p class="article">
  4.2. Har bir o'quvchini maktab ruhshunosi va malakali o'qituvchi suhbati va imtihoni
  asosida maktabga qabul qilish jarayonini tashkillashtiradi.
</p>

<p class="article">
  4.3. O'quvchiga davlat ta'lim standartlari talablariga muvofiq bo'lgan dastur asosida pullik
  ta'lim xizmati ko'rsatishda o'ziga qo'yilgan talablarni bajaradi.
</p>

<p class="article">
  4.4. Maktab tomonidan darslarni o'tkazish uchun sanitar va gigienik talablarga javob
  beradigan sinf xonalari bilan ta'minlanadi.
</p>

<p class="article">
  4.5. Maktab sinflarda o'quvchilar sonini yigirma ikki (24) kishidan oshmagan holda dars
  jarayonini tashkillashtiradi.
</p>

<p class="article">
  4.6. Maktab tomonidan o'quvchilarga birinchi tibbiy xizmat ko'rsatish ta'minlanadi.
</p>

<p class="article">
  4.7. O'quvchi betob bo'lganda, darslarga qatnasha olmagan umumiy kunlari soni uzluksiz bir oy
  va undan ortiq bo'lsa, tegishli tibbiy ma'lumotnoma taqdim etgan taqdirida shartnoma bo'yicha
  belgilangan to'lovning bir oylik miqdori chegirib tashlanadi.
</p>

<div class="section-title">5. O'QUVCHINING OTA-ONASI VA QONUNIY VAKILI (VASIY/HOMIY) NING HUQUQLARI</div>

<p class="article">
  5.1. Ota-ona(Vasiy/Homiy) maktabning har bir ichki xujjatlari bilan tanishib chiqish huquqiga ega.
</p>

<p class="article">
  5.2. Ota-ona(Vasiy/Homiy) maktab ma'muriyatidan maktab faoliyati, o'quv jarayoni,
  farzandining bilimi to'g'risida ma'lumot olish huquqiga ega.
</p>

<p class="article">
  5.3. Ota-ona(Vasiy/Homiy) Maktab ma'muriyatining pedagogik kengashlarida ishtirok
  etish huquqiga ega.
</p>

<div class="section-title">6. O'QUVCHINING OTA-ONASI VA QONUNIY VAKILI (VASIY/HOMIY) NING MAJBURIYATLARI</div>

<p class="article">
  6.1. Ota-ona (Vasiy/Homiy) o'quvchining Maktabda ta'lim olishi uchun to'lovlarni o'z
  vaqtida amalga oshirishi.
</p>

<p class="article">
  6.2. Maktabda o'quvchining xatti-xarakati uchun maktab ichki tartib va odob-ahloq
  qoidalarida belgilangan qoidlari doirasida javobgar bo'ladi.
</p>

<p class="article">
  6.3. O'quvchining maktabdan tashqaridagi harakatini ota-onaning o'zi nazorat qiladi.
</p>

<p class="article">
  6.4. Farzandining harakati bilan maktab mulkiga zarar etsa, ota-ona javobgarlikni o'z
  zimmasiga oladi hamda maktabga yetkazilgan moddiy zararni to'liq qoplaydi.
</p>

<div class="section-title">7. XISOB-KITOB QILISH TARTIBI</div>

<p class="article">
  7.1. Shartnomaga muvofiq (ta'lim xizmatlariga) kelishilgan to'lov miqdori bir o'quv yili
  har oy uchun <span class="bold highlight ">${monthlyPayment} so'm</span> to'lovni tashkil qiladi. To'lovni har oy to'lashga yo'l qo'yiladi.
</p>

<p class="article">
  7.2. Maktabga o'quvchini qabul qilish jarayonida mazkur Shartnoma uchun oldindan
  kelasi oy uchun mijoz tomonidan to'lanadi.
</p>

<p class="article">
  7.3. Ota-ona (Vasiy/Homiy)lar tomonidan o'quvchining 10 oylik ta'lim olishi uchun oylik
  to'lov amalga oshiriladi.
</p>

<p class="article">
  7.4. "Buyurtmachi" har oy uchun to'lovni, oy boshlanishidan kamida 5 (besh) kun avval
  to'lashni o'z zimmasiga oladi.
</p>

<p class="article">
  7.5. "Buyurtmachi" tomonidan muddat buzilsa, o'quvchini darslarga kiritmaslik yoki
  maktabdan chetlashtirish choralari ko'rilishiga sabab bo'ladi.
</p>

<div class="section-title">8. SHARTNOMANI BEKOR QILISH SHARTLARI</div>

<p class="article">
  8.1. Mazkur shartnomani quyidagi holatlarda muddatidan oldin bekor qilish mumkin:
  Tomonlarni o'zaro kelishuviga muvofiq; O'zbekiston Respublikasining amaldagi qonunchiligida
  nazarda tutilgan asoslarda tomonlardan birining tashabbusiga ko'ra.
</p>

<p class="article">
  8.2. To'lovlar to'liq amalga oshirilmaganda 3 (uch) bank ish kuni davomida "Bajaruvchi"
  tomonidan shartnoma bir tomonlama bekor qilinishi mumkin.
</p>

<div class="section-title">9. FORS-MOJOR HOLATLARI</div>

<p class="article">
  9.1. Taraflar shartnomasi fors-major holatlari (zilzila, qo'rg'oqchilik, suv toshqini, yong'in,
  sel, do'l, jala, kuchaytirilgan karantin, ommaviy epidemiya va boshqa tabiiy ofatlar) tufayli
  majburiyatlarni bajarmagan yoki lozim darajada bajarmaganligini isbotlansa, javobgar bo'lmaydilar.
</p>

<div class="section-title">10. TOMONLARNING JAVOBGARLIGI</div>

<p class="article">
  10.1. Tomonlar o'z majburiyatlarini bajarmagan yoki tegishli ravishda bajarmagan taqdirda
  O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq javobgar hisoblanadilar.
</p>

<p class="article">
  10.2. Nizo va kelishmovchiliklarni muzokara yo'li bilan hal etishning imkoni bo'lmasa,
  O'zbekiston Respublikasi fuqarolik ishlari bo'yicha tumanlar aro sudida ko'rib chiqiladi.
</p>

<div class="section-title">11. TARIFLARNING YURIDIK MANZILLARI VA REKVIZITLARI</div>

<table class="requisites-table">
  <tr>
    <td>
      <div class="label">MChJ "FAIR SCHOOL"</div>
      <div><span class="label">Yuridik manzili:</span> Toshkent shaxar Sergeli tumani, Nilufar MFY, Sergeli 2 mavzesi, 38-b-uy</div>
      <div><span class="label">Tel.:</span> +998 95 011 00 08</div>
      <div><span class="label">Bank:</span> TOShKENT Sh., "ASIA ALLIANCE BANK" AT BANKI</div>
      <div><span class="label">X/p:</span> 20208000107245424001</div>
      <div><span class="label">MFO:</span> 01095</div>
      <div><span class="label">STIR:</span> 312 135 774</div>
      <br/>
      <div><span class="label">Direktor:</span> Dadasheva Z.Sh.</div>
      <div class="signature-line"></div>
    </td>
    <td>
      <div class="label">BUYURTMACHI</div>
      <div><span class="label">Yashash manzili:</span> <span class=" highlight ">${guardianAddress}</span></div>
      <div><span class="label">Pasport seriyasi va raqami:</span> <span class=" highlight ">${guardianPassport}</span></div>
      <div><span class="label">Kim tomonidan berilgan:</span> <span class=" highlight ">${guardianPassportIssuedBy}</span></div> 
      <div><span class="label">Tel. raqami:</span> <span class=" highlight ">${guardianPhone1}</span> ; <span class=" highlight ">${guardianPhone2}</span></div>
      <br/>
      <div>Fuqaro: <span class="bold highlight ">${studentName}</span></div>
      <div class="signature-line"></div>
    </td>
  </tr>
</table>

<div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #ccc;">
  <div class="label" style="font-size: 13.5px; margin-bottom: 10px;">Uchinchi shaxs:</div>
  <div style="font-size: 12.5px; line-height: 1.7;">
    <div>Fuqaro: <span class="bold highlight ">${thirdPartyName}</span></div>
    <div>PINFL: <span class=" highlight ">${thirdPartyPinfl}</span></div>
    <div style="margin-top: 20px;" class="signature-line"></div>
  </div>
</div>

</body>
</html>`
}
