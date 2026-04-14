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
<title>''</title>
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
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
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

  ul { margin: 6px 0 6px 40px; }
  ul li { margin-bottom: 3px; }

  table.requisites { width: 100%; border-collapse: collapse; margin-top: 20px; }
  table.requisites td { vertical-align: top; padding: 6px 10px; width: 50%; }

  .signature-line {
    margin-top: 24px;
    border-top: 1px solid #333;
    width: 200px;
    display: inline-block;
  }

  .deposit {
    margin-top: 30px;
    padding: 16px;
    border-radius: 4px;
  }
  .deposit p { margin-bottom: 8px; text-align: justify; }

  @page {
    size: A4;
    margin: 0;
  }
  @media print {
    body { padding: 10mm 15mm; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<h1>PULLIK TA'LIM XIZMATLARINI KO'RSATISH HAQIDA</h1>
<h2>№ ${contractNumber}-SHARTNOMA</h2>
<div class="subtitle">(${academicYear} o'quv yili uchun)</div>

<div class="header-line">
  <span>Toshkent sh.</span>
  <span>${contractDate}</span>
</div>

<p class="intro">
  Nizom asosida ish olib boruvchi <span class="bold">"UNION SCHOOL SINO" MCHJ</span> maktabi direktori
  <span class="bold">${directorName}</span> bir tomondan ("Bajaruvchi"), o'quvchining qonuniy vakili
  <span class="bold highlight">${guardianName}</span> ikkinchi tomondan ("Buyurtmachi"), o'quvchi
  <span class="bold highlight">${studentName}</span>ning ta'lim olishi uchun mazkur shartnomani tuzdilar.
</p>

<div class="section-title">1. Shartnoma predmeti</div>

<p class="article">
  1.1. “Bajaruvchi” o’quvchini ${className}-sinfga (${language}) o’qishga qabul qiladi va davlat ta’lim
  “Buyurtmachi” esa, ushbu ta’lim standartlariga mos bo’lgan sifatli ta’lim xizmatlarini ko’rsatadi.
  xizmatlari uchun haq to’laydi.
</p>

<p class="article">
  1.2. Ta'lim muddati: <span class="highlight">${validFrom}</span> dan <span class="highlight">${validTo}</span> gacha.
  Shartnoma uchun to'lov: Qabul uchun to'lov va haqiqiy xizmat muddatiga mos ravishda amalga oshiriladi.
</p>

<p class="article">
  1.3. Qabul uchun oldindan to'lov — <span class="bold highlight">${admissionPayment} so'm</span>. Ushbu to'lov
  shartnoma imzolanishi bilan kuchga kiradi va qaytarib berilmaydi.
</p>

<div class="section-title">2. Maktabning majburiyatlari</div>

<p class="article">2.1. DTS va o'quv dasturi asosida ta'lim xizmatlari ko'rsatish hamda darslik va qo'llanmalar bilan ta'minlash.</p>
<p class="article">2.2. Sanitar-gigienik va xavfsizlik talablariga javob beruvchi sinf xonalari bilan ta'minlash.</p>
<p class="article">2.3. Sinflarda o'quvchilar soni 24 kishidan oshmasligini ta'minlash.</p>
<p class="article">2.4. Birinchi tibbiy yordam ko'rsatish xizmatini ta'minlash.</p>
<p class="article">2.5. Har chorakda o'quvchining muvaffaqiyatlari haqida ota-onaga xabar berib borish.</p>
<p class="article">2.6. Bitiruvchilarga Davlat namunasidagi Attestat (Shahodatnoma) topshirish.</p>

<div class="section-title">3. Maktabning huquqlari</div>

<p class="article">3.1. Dars jadvalini, ta'til kunlarini, maktab formasi tartibini belgilash.</p>
<p class="article">3.2. Ta'lim xizmati narxini erkin belgilash.</p>
<p class="article">3.3. Yuqumli kasallik aniqlansa, shifokor ma'lumotnomasi taqdim etilguniga qadar o'quvchini darsga kiritmaslik.</p>
<p class="article">3.4. To'lov o'z vaqtida amalga oshirilmasa, o'quvchini darslarga kiritmaslik va shartnomani bir tomonlama bekor qilish.</p>
<p class="article">3.5. Intizom buzilgan taqdirda o'quvchini maktabdan chetlashtirish.</p>

<div class="section-title">4. Ota-ona / qonuniy vakilning huquqlari</div>

<p class="article">4.1. Maktab nizomi va ichki hujjatlari bilan tanishish huquqi.</p>
<p class="article">4.2. Farzandining o'quv jarayoni va bilimi to'g'risida ma'lumot olish huquqi.</p>
<p class="article">4.3. Pedagogik kengashlarda ishtirok etish huquqi.</p>

<div class="section-title">5. Ota-ona / qonuniy vakilning majburiyatlari</div>

<p class="article">5.1. To'lovlarni o'z vaqtida amalga oshirish.</p>
<p class="article">5.2. Farzandining maktab ichki tartib qoidalariga rioya qilishini ta'minlash.</p>
<p class="article">5.3. Maktab mulkiga etkazilgan moddiy zararni to'liq qoplash.</p>
<p class="article">5.4. Farzandini 8:30 gacha maktabga olib kelish va 17:00 da olib ketish.</p>
<p class="article">5.5. Manzili, telefoni yoki bank rekvizitlari o'zgarsa, 48 soat ichida maktabga xabar berish.</p>
<p class="article">5.6. Farzandining kasalliklari, allergiyasi va o'ziga xos ehtiyojlari haqida maktabga yozma xabar berish.</p>

<div class="section-title">6. Hisob-kitob tartibi</div>

<p class="article">6.1. Oylik to'lovlar oyma-oy amalga oshiriladi. To'qqiz oylik to'lov jadvaliga rioya qilinadi.</p>
<p class="article">6.2. Qabul uchun oldindan to'lov: <span class="bold highlight">${admissionPayment} so'm</span> (sentyabr oyi uchun qo'shimcha to'lov).</p>
<p class="article">6.3. "Buyurtmachi" har oy uchun to'lovni avvalgi oyning 25-sanasigacha amalga oshirishi shart.</p>
<p class="article">6.4. To'lov muddati buzilsa, o'quvchi darslarga kiritilmaydi yoki maktabdan chetlashtiriladi.</p>
<p class="article">6.5. To'lov pul mablag'larini naqd pulda qaytarish amalga oshirilmaydi.</p>
<p class="article">6.6. Sababli yoki sababsiz dars qoldirilganda to'lovda chegirma yoki qayta hisoblash amalga oshirilmaydi.</p>

<div class="section-title">7. Shartnomani bekor qilish</div>

<p class="article">7.1. Tomonlarning o'zaro kelishuvi bo'yicha yoki qonunchilikda nazarda tutilgan holatlarda bekor qilish mumkin.</p>
<p class="article">7.2. To'lovlar amalga oshirilmasa, 3 bank ish kuni ichida "Bajaruvchi" tomonidan bir tomonlama bekor qilinadi.</p>
<p class="article">7.3. Intizom qo'pol buzilsa, o'quvchi chetlashtiriladi va pul mablag'lari 90 bank ish kuni ichida qaytariladi.</p>
<p class="article">7.4. Bekor qilish uchun ota-ona boshqa maktabdan "Qabul qilish" talonini olib kelishi shart.</p>

<div class="section-title">8. Fors-major holatlari</div>

<p class="article">
  8.1. Zilzila, yong'in, suv toshqini, karantin, epidemiya va boshqa tabiiy ofatlar tufayli
  majburiyatlarni bajarmaslik isbotlansa, taraflar javobgar bo'lmaydilar.
</p>

<div class="section-title">9. Tomonlarning javobgarligi</div>

<p class="article">9.1. Tomonlar O'zbekiston Respublikasi qonunchiligiga muvofiq javobgar hisoblanadi.</p>
<p class="article">9.2. Nizo hal etilmasa, fuqarolik ishlari bo'yicha tumanlar aro sudda ko'rib chiqiladi.</p>

<table class="requisites">
  <tr>
    <td>
      <div class="bold">Bajaruvchi:</div>
      <div class="bold">"UNION SCHOOL SINO" MCHJ</div>
      <div>Manzil: Toshkent sh. Olmazor tumani, Qora-Qamish 1/2, 34/2-uy</div>
      <div>Bank: "ASIA ALLIANCE BANK" AT BANKI</div>
      <div>X/r: 20208000807128891001</div>
      <div>MFO: 01095</div>
      <div>STIR: 311553445</div>
      <br/>
      <div>Direktor: ${directorName}</div>
      <div class="signature-line"></div>
      <div style="margin-top: 6px;">M.O'</div>
    </td>
    <td>
      <div class="bold">Buyurtmachi:</div>
      <div>F.I.Sh.: <span class="bold highlight">${guardianName}</span></div>
      <div>Manzil: <span class="highlight">${guardianAddress}</span></div>
      <div>Pasport: <span class="highlight">${guardianPassport}</span></div>
      <div>Berilgan: <span class="highlight">${guardianPassportIssuedBy}</span></div>
      <div>PINFL: <span class="highlight">${guardianPinfl}</span></div>
      <div>Tel: <span class="highlight">${guardianPhone1}</span> ; <span class="highlight">${guardianPhone2}</span></div>
      <br/>
      <div>O'quvchi: <span class="bold highlight">${studentName}</span></div>
      <div class="signature-line"></div>
    </td>
  </tr>
</table>
<br/>
<br/>
<br/>
<br/>
<div class="deposit">
  <p class="bold">Hurmatli ota-ona,</p>
  <p>
    Union School'da sifatli ta'lim va farzandingizning rivoji uchun katta resurslar talab etiladi.
  </p>
  <p>
    Shartnomaning 1.3-bandiga asosan <span class="bold">${academicYear}</span> o'quv yili uchun qabul to'lovi
    <span class="bold">${admissionPayment} so'm</span> etib belgilandi.
  </p>
  <p>
    Bu to'lov o'qituvchilar, dars materiallari va boshqa tayyorgarlik xarajatlarini qoplaydi hamda
    farzandingiz uchun joyni kafolatlaydi. <span class="bold">Shartnoma bekor qilingan taqdirda ham, bu mablag' qaytarilmaydi.</span>
  </p>
  <p>Depozit quyidagilarni qamrab oladi:</p>
  <ul>
    <li>Resurslarni oldindan tayyorlash (o'qituvchi yuklamasi, darsliklar, sinfdagi o'rni).</li>
    <li>Joyni band qilish kafolati — cheklangan joylarni boshqa o'quvchilardan yopib qo'yadi.</li>
    <li>Ma'muriy xarajatlar — shartnoma tuzish, hujjatlar yuritish, tizimga kiritish.</li>
    <li>Sinflarni va kurslarni rejalashtirish.</li>
  </ul>
  <p class="bold" style="margin-top: 16px;">Shartnoma "Depozit" to'lovi bilan tanishdim!</p>

  <table style="width: 100%; margin-top: 30px;">
    <tr>
      <td style="text-align: center; border-top: 1px solid #333; padding-top: 6px;">
        <em>To'liq ismi sharifi</em><br/>
        <span class="bold highlight">${guardianName}</span>
      </td>
      <td style="text-align: center; border-top: 1px solid #333; padding-top: 6px;">
        <em>Sana</em><br/>
        <span class="highlight">${contractDate}</span>
      </td>
      <td style="text-align: center; border-top: 1px solid #333; padding-top: 6px;">
        <em>Imzo</em>
      </td>
    </tr>
  </table>
</div>

</body>
</html>`
}
