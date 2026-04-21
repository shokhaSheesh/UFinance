export const getBigMoneyContractHtml = (data = {}) => {
  const {
    contractNumber = '___',
    contractDate = '____-__-__', 
    studentName = '________________________',
    guardianPassport = '________________________',
    guardianName = '________________________',
    guardianPassportIssuedBy = '________________________',
    guardianPhone1 = '________________________',
    guardianPhone2 = '________________________',
    guardianAddress = '________________________',
    guardianPinfl = '________________________',
    guardianType = '',
    monthlyPayment = '________________________',
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
    justify-content: flex-end;
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
  .highlight { background: #fffde7 !important; padding: 1px 4px; border-radius: 2px; }

  ul { margin: 10px 0 10px 40px; }
  ul li { margin-bottom: 4px; line-height: 1.8; }

  table.requisites { width: 100%; border-collapse: collapse; margin-top: 20px; }
  table.requisites td { vertical-align: top; padding: 6px 10px; width: 50%; }

  .requisites label {
    font-weight: 600;
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

<h1>"BIG MONEY ESTATE" MCHJ nodavlat maktabgacha ta'lim tashkiloti<br/>
va tarbiyalanuvchining ota-ona (yoki ota-ona o'rnini bosuvchi) o'rtasida<br/>
tuzilgan</h1>
<h2>№ ${contractNumber} - SHARTNOMA</h2>
<div class="header-line">
  <span>${contractDate}</span>
</div>

<p class="intro">
  <span class="bold">"BIG MONEY ESTATE" MCHJ</span> nodavlat maktabgacha ta'lim tashkiloti (bundan buyon
  matnda Tashkilot deb yuritiladi) nomidan Ustav asosida ish yurituvchi rahbar
  <span class="bold"> Baymuxammedova Lola Mirakbarovna </span> bir tarafdan va <span class="bold highlight ">${studentName}</span> (<span class="bold highlight ">${studentBirthday}</span>) ning
  (bundan buyon matnda Tarbiyalanuvchi deb yuritiladi) ${guardianType} yoki ularning o'rnini
  bosuvchi shaxs <span class="bold highlight ">${guardianName}</span> (bundan buyon matnda Ota-ona deb
  yuritiladi) ikkinchi tarafdan, birgalikda taraflar deb yuritiladi, mazkur shartnomani quyidagi
  mazmunda tuzdilar:
</p>

<!-- ==================== I. SHARTNOMA PREDMETI ==================== -->
<div class="section-title">I. Shartnoma predmeti</div>

<p class="article">
  1.1. Tashkilot mazkur shartnoma shartlariga asosan tarbiyalanuvchining barcha huquqlarini
  ta'minlagan holda unga sifatli ta'lim-tarbiya berish, sog'lig'ini muhofaza qilish va
  mustahkamlash, intellektual, axloqiy, estetik va jismoniy rivojlanishi uchun shart-sharoit
  yaratib berish majburiyatini oladi.
</p>
<p class="article">
  1.2. Ota-ona esa tarbiyalanuvchini tashkilotga topshirish, tarbiyalanuvchining tashkilotdagi
  ta'minoti uchun badal to'lovni o'z vaqtida amalga oshirish va tashkilotning ichki
  tartib-qoidalariga rioya qilish majburiyatini oladi.
</p>

<!-- ==================== II. TARAFLARNING HUQUQLARI ==================== -->
<div class="section-title">II. Taraflarning huquqlari va majburiyatlari</div>

<p class="article bold">Tashkilot quyidagi huquqlarga ega:</p>

<p class="article">2.1. Tashkilot xodimlarining qonuniy huquq va manfaatlarini, qadr-qimmatini va qiziqishlarini himoya qilish;</p>
<p class="article">2.2. Tashkilot ustavida belgilangan tartibda tarbiyalanuvchining yosh xususiyatidan kelib chiqib bolani guruhga taqsimlash;</p>
<p class="article">2.3. Tibbiy ko'rik va tarbiyalanuvchining kasallanishi natijasida uning tashkilotda bo'lishini taqiqlovchi hollar aniqlanganda shifokor tomonidan berilgan tegishli tibbiy xulosa berilgan vaqtlarda uni tashkilotga qabul qilishni rad etish;</p>
<p class="article">2.4. Tarbiyalanuvchining tashkilotda bo'lgan davri uchun to'lanadigan badal to'lovi har oyning 5-sanasidan keyin ikki hafta mobaynida uzrli sabablarsiz to'lanmagan taqdirda, ota-ona bilan tuzilgan shartnoma tashkilot tomonidan bir taraflama bekor qilish mumkin;</p>
<p class="article">2.5. Shartnoma bekor qilingan hollarda tashkilotga bola qatnovini tiklash (kelmagan kunlari uchun to'lov qoplangan taqdirda) yoki yangi qabul qilingan bolalar uchun belgilangan tartibda amalga oshirish;</p>
<p class="article">2.6. Tarbiyalanuvchini oila muhitida tarbiyalash bo'yicha tegishli takliflar, tavsiyalar, yo'nalishlar berish;</p>
<p class="article">2.7. Tashkilotdagi tibbiyot hamshirasi tomonidan tarbiyalanuvchini kunlik filtratsiyadan o'tkazish jarayonida bolada tashkilotda bo'lishni taqiqlaydigan kasallik aniqlanganda uni muassasaga qabul qilishini rad etish.</p>

<!-- ==================== III. TASHKILOTNING MAJBURIYATLARI ==================== -->
<div class="section-title">III. Tashkilotning majburiyatlari</div>

<p class="article">2.8. Bolaning tashkilotda bo'lgan davrida tarbiyalanuvchining hayotini muhofaza qilish, jismoniy hamda psixik sog'lig'ini ta'minlash, rivojlanishidagi nuqson va kamchiliklarni bartaraf etish, ijodiy qobiliyatlari va qiziqishlarini rivojlantirish, rivojlanish xususiyatlarini inobatga olgan holda, uning shaxsiga alohida yondashishni ta'minlash, bola huquqlari to'g'risidagi qonunchilik hujjatlariga rioya qilish;</p>
<p class="article">2.9. Pedagog kadrlar tomonidan odob-axloq qoidalariga qat'iy rioya qilishni ta'minlash, tarbiyalanuvchining qadr-qimmatini hurmat qilish, ularga ko'maklashish, tarbiyalanuvchini turli tazyiqlardan himoya qilish;</p>
<p class="article">2.10. Tashkilotda maktabgacha ta'limga qo'yiladigan davlat talablarining bajarilishini ta'minlash, O'zbekiston Respublikasi Maktabgacha ta'lim vazirligi tomonidan tasdiqlangan va qo'shimcha tavsiya etilgan dasturlar asosida maktab ta'limiga sifatli tayyorlash;</p>
<p class="article">2.11. Ilg'or xorijiy tajribani hisobga olgan holda bolalarni har tomonlama intellektual, axloqiy, estetik va jismoniy rivojlantirish bo'yicha zarur bo'lgan shart-sharoitlar yaratish;</p>
<p class="article">2.12. Tarbiyalanuvchiga tibbiy xizmat (birinchi tibbiy yordam) ko'rsatishni tashkil etish, davolanuvchi-profilaktik tadbirlar, reja asosida profilaktik, sog'liqni saqlash organlari bilan hamkorlikda tor mutaxassislar tarafidan tibbiy ko'riklarni o'z vaqtida o'tkazish;</p>
<p class="article">2.13. Tarbiyalanuvchida o'qishga intilish hissini uyg'otish, ularni xalqning boy madaniy-tarixiy merosi va umumbashariy qadriyatlari asosida ma'naviy-axloqiy jihatdan tarbiyalash;</p>
<p class="article">2.14. Tarbiyalanuvchi tashkilotga vaqtincha qatnamagan kunlari haqida tibbiy ma'lumotnoma (eng kamida ikki haftalik) taqdim etilgan hollarda badal to'lovlarni qayta hisob-kitob qilish; chet-el safarlari bundan mustasno;</p>
<p class="article">2.15. Belgilangan sanitariya qoidalari, normalari va gigiyena normativlari asosida sifatli oziq-ovqat mahsulotlari bilan ta'minlash;</p>
<p class="article">2.16. Tashkilotda tarbiyalanayotgan bolalarni belgilangan sanitariya qoidalari, normalari va gigiyena normativlari asosida kuniga 5 (besh) mahaldan ovqatlantirish;</p>
<p class="article">2.17. Tarbiyalanuvchiga tegishli bo'lgan narsa va buyumlarni to'laligicha saqlash;</p>
<p class="article">2.18. Ota-onalar yoki ularning qonuniy vakillaridan tarbiyalanuvchini qabul qilib olish va ularga topshirish;</p>
<p class="article">2.19. Ota-onalarni tashkilot ustavi, kun tartibi, ta'lim-tarbiya dasturlari, muassasaning manzili va telefoni hamda ta'limni boshqaruv idorasi bilan tanishtirish;</p>
<p class="article">2.20. Tashkilot bola va ota-ona haqidagi barcha ma'lumotlarni maxfiy saqlash majburiyatini oladi. Hech qanday ma'lumot uchinchi shaxsga berilmaydi.</p>

<!-- ==================== IV. OTA-ONA HUQUQLARI ==================== -->
<div class="section-title">IV. Ota-ona quyidagi huquqlarga ega</div>

<p class="article">2.21. Tarbiyalanuvchining qonuniy huquq va manfaatlarini himoya qilish;</p>
<p class="article">2.22. Tashkilotning kun tartibi bilan tanishish;</p>
<p class="article">2.23. Tashkilotning turli tadbirlarida farzandi bilan birgalikda ishtirok etish (bayram ertaliklari, ko'riklar, ko'ngilochar soatlar, yakuniy va ochiq mashg'ulotlar, sayohatlar va h.k.) mavsumiy cheklov (karantin) va xavfsizlik choralari kuchaytirilgan davrdan tashqari;</p>
<p class="article">2.24. Tashkilotda tarbiyalanuvchilar bilan olib boriladigan ta'lim-tarbiya ishlarini yaxshilash bo'yicha takliflar kiritish;</p>
<p class="article">2.25. Tashkilotda tarbiyalanuvchi ta'lim-tarbiya berish uchun zarur shart-sharoitlar yaratilishini hamda bolaning shaxsiga nisbatan hurmat bilan munosabatda bo'lish, shartnomada belgilangan shartlar bo'yicha bolaga sifatli ta'lim-tarbiya berishni talab qilish;</p>
<p class="article">2.26. Tashkilotning kun tartibi davomida soat 8:00 dan 18:00 soatgacha bo'lgan davrda yoki o'ziga qulay bo'lgan vaqtda sababi ko'rsatilgan holda yozma bildirish asosida tarbiyalanuvchini tashkilotdan olib ketish;</p>
<p class="article">2.27. Tashkilot rahbariyatini 10 kun oldin xabardor qilgan holda shartnomani muddatidan avval bir taraflama bekor qilish.</p>

<!-- ==================== V. OTA-ONA MAJBURIYATLARI ==================== -->
<div class="section-title">V. Ota-onaning majburiyatlari</div>

<p class="article">2.28. Mazkur shartnoma talablariga qat'iy rioya qilish;</p>
<p class="article">2.29. Pedagoglar bilan kelishmovchiliklar yuzaga kelganda, tarbiyalanuvchilar ishtirokisiz zudlik bilan tashkilot rahbariyati bilan muammoni hal qilish. Ijtimoiy tarmoqlarda bog'chaning sha'ni, qadr-qimmati va pedagoglar obro'siga salbiy ta'sir ko'rsatuvchi yolg'on yoki tekshirilmagan ma'lumotlar tarqatmaslik.</p>
<p class="article">2.30. Tarbiyalanuvchini tashkilotga joylashtirganda, tegishli hujjatlar va ota-onalar haqidagi to'liq ma'lumotlarni (telefon raqamlari, yashash va ish joyi haqida ma'lumotnomalar) taqdim etish;</p>
<p class="article">2.31. Tarbiyalanuvchi betob bo'lganda zudlik bilan tashkilot ma'muriyati yoki tibbiy hamshiraga xabar berish va tarbiyalanuvchi sog'ayganidan so'ng tibbiy ma'lumotnomani taqdim etish;</p>
<p class="article">2.32. Tarbiyalanuvchining tashkilotdagi ta'minoti uchun ota-onalar to'lovini o'z vaqtida to'lash hamda to'lovning amalga oshirilganligini tasdiqlovchi hujjat nusxasini tashkilotga taqdim etish;</p>
<p class="article">2.33. Agar tarbiyalanuvchi joriy oyning 15-sanasidan keyin tashkilotga kelgan taqdirda ta'minot uchun to'lovni u kelgan kundan boshlab 3 kun ichida to'lash;</p>
<p class="article">2.34. Tashkilot ishchi xodimlari va tarbiyalanuvchilar va ularning ota-onalariga nisbatan hurmat bilan munosabatda bo'lish;</p>
<p class="article">2.35. Tarbiyalanuvchining to'laqonli ovqatlanishini, ularda shaxsiy gigiyena ko'nikmalari shakllantirilishini qat'iy kuzatib borish hamda tarbiyalanuvchini tashkilotga toza-ozoda kiyingan holda olib kelish;</p>
<p class="article">2.36. Tashkilotga tarbiyalanuvchini har qanday qimmatbaho taqinchoqlar, uyali aloqa vositalari va boshqa texnika vositalari bilan olib kelmaslik, ushbu holatlar kuzatilganda tashkilot ma'muriyati ularning yo'qolishi oqibati yuzasidan javobgar bo'lmaydi;</p>
<p class="article">2.37. Yashash joyi yoki telefon raqamlari o'zgargan taqdirda, tashkilot rahbariyati va guruh tarbiyachisiga bu haqda xabar berish;</p>
<p class="article">2.38. Bolani tashkilotdan olib ketishni begona shaxslarga topshirmaslik.</p>

<!-- ==================== VI. TO'LOV TARTIBI ==================== -->
<div class="section-title">VI. To'lov (hisob-kitob) tartibi</div>

<p class="article">3.1. Tashkilotda tarbiyalanuvchining bo'lgan davri uchun bir oylik badal to'lovi <span class="bold highlight ">${monthlyPayment}</span> so'mni tashkil etadi.</p>
<p class="article">3.2. Agar tashkilotga bir oiladan ikki nafar yoki undan ortiq farzand qatnashsa, har bir bola uchun oylik to'lovga 5% chegirma beriladi. Chegirma faqat bir oydan ortiq davomiy ishtirok etilganda va farzandlar rasmiy ro'yxatdan o'tkazilgan taqdirda qo'llaniladi.</p>
<p class="article">3.3. Bir yil (12 oy) uchun oldindan to'lov qilinganda umumiy summaga nisbatan 10 foiz chegirma beriladi.</p>
<p class="article">3.4. Tarbiyalanuvchining tashkilotga uzrli sabablarga ko'ra kelmagan kunlariga to'lovni qayta hisoblash faqatgina yuqoridagi (2.14) holatlarni tasdiqlovchi hujjat taqdim etilganda amalga oshiriladi.</p>
<p class="article">3.5. Ota-onalardan birining ishdan (o'qishdan) bo'sh vaqti davrida yoki boshqa sabablarga ko'ra tarbiyalanuvchi tashkilotga kelmasligiga ota-onalardan birining sababi ko'rsatilgan holda tashkilot rahbariyati nomiga oldindan yozgan arizasi (bildirishnomasi) asos bo'lib hisoblanadi. Tarbiyalanuvchi sababsiz uyda qolgan holatlarda ota-ona tarafidan to'lovlar umumiy asoslarda to'lanadi.</p>
<p class="article">3.6. Tarbiyalanuvchi uchun to'lanadigan badal to'lovi oyning 5-sanasidan boshlab ikki hafta mobaynida uzrli sabablarsiz to'lanmagan taqdirda, shartnoma bekor qilinib, tarbiyalanuvchi tashkilotdan chetlashtiriladi;</p>
<p class="article">3.7. Yillik inflyatsiya, xizmatlar narxining o'zgarishi sababli oylik badal pulining o'zgarishi mumkin. Bu haqda ota-onalar yozma ravishda xabardor qilinadi.</p>
<p class="article">3.8. Shartnomani bir taraflama bekor qilinganda ota-ona to'lovi tarbiyalanuvchining tashkilotga amalda qatnagan kunlari uchun to'lanadi.</p>

<!-- ==================== VII. JAVOBGARLIK ==================== -->
<div class="section-title">VII. Taraflarning javobgarligi</div>

<p class="article">4.1. Taraflar ushbu shartnoma shartlarini bajarmagan yoki lozim darajada bajarmagan holatlarda, ular O'zbekiston Respublikasining amaldagi qonun hujjatlariga muvofiq javobgar bo'ladilar.</p>

<!-- ==================== VIII. O'ZGARTIRISH VA BEKOR QILISH ==================== -->
<div class="section-title">VIII. Shartnomani o'zgartirish va bekor qilish</div>

<p class="article">5.1. Taraflar shartnomani o'zgartirish va bekor qilishni mazkur shartnomada nazarda tutilgan hollarda va amaldagi qonunchilik asosida amalga oshirishi mumkin.</p>
<p class="article">5.2. Mazkur Shartnoma muddatidan avval tugatilgan taqdirda shartnomada ko'rsatilgan barcha imtiyoz va chegirmalar bekor qilingan hisoblanadi.</p>
<p class="article">5.3. Shartnoma bajarilishini bir taraflama rad etishga yoki shartnoma shartlarini bir taraflama o'zgartirishga faqat qonun hujjatlariga asosan yo'l qo'yiladi.</p>

<!-- ==================== IX. NIZOLARNI HAL QILISH ==================== -->
<div class="section-title">IX. Nizolarni hal qilish tartibi</div>

<p class="article">6.1. Mazkur shartnoma bir xil yuridik kuchga ega bo'lgan ikki nusxada tuzilib, taraflar tomonidan imzolangan vaqtdan boshlab kuchga kirgan hisoblanadi.</p>
<p class="article">6.2. Ushbu shartnoma bo'yicha nizolar kelib chiqqan taqdirda, taraflar, qoidaga ko'ra, ularni sudgacha hal etish choralarini ko'radilar.</p>
<p class="article">6.3. Mazkur shartnomada ko'zda tutilmagan holatlar amaldagi qonunchilik tartibida hal etiladi.</p>

<!-- ==================== X. FORS-MAJOR ==================== -->
<div class="section-title">X. Fors-major holatlari</div>

<p class="article">7.1. Taraflar shartnomani fors-major holatlari, ya'ni yengib bo'lmaydigan kuch, favqulodda va muayyan sharoitlarda oldini olib bo'lmaydigan vaziyatlar tufayli majburiyatlarni bajarmagan yoki lozim darajada bajarmaganligini isbotlasa, javobgar bo'lmaydilar.</p>
<p class="article">7.2. Sodir bo'lgan fors-major holatlari to'g'risida taraflar bir-birlarini ushbu holatlar yuz bergan holda zudlik bilan yozma yoki og'zaki tartibda xabardor qilishi shart.</p>
<p class="article">7.3. Mazkur shartnoma bo'yicha majburiyatlarni bajarish muddati yengib bo'lmaydigan kuch holatlarini davomiyligini hisobga olib shartnomani amal qilish muddatini uzaytirishlari mumkin.</p>

<!-- ==================== XI. YAKUNIY QOIDALAR ==================== -->
<div class="section-title">XI. Yakuniy qoidalar</div>

<p class="article">8.1. Mazkur shartnoma imzolangan kundan boshlab kuchga kiradi va maktabga ketgunga qadar amal qiladi.</p>
<p class="article">8.2. Mazkur shartnoma ikki nusxada tuzildi, ikki nusxa bir xil yuridik kuchga ega, tashkilot hamda ota-onalarda bir nusxadan saqlanadi.</p>

<!-- ==================== XII. REKVIZITLAR ==================== -->
<div class="section-title">XII. Taraflarning yuridik manzillari va rekvizitlari</div>

<table class="requisites">
  <tr>
    <td>
      <div class="bold">"BIG MONEY ESTATE" MCHJ</div>
      <div>INN: 311071792</div>
      <div>MFO: 01095</div>
      <div>BANK: "ASIA ALLIANCE BANK" ATB Chilonzor MBXO</div>
      <div>R/s: 20208000007001121002</div>
      <div>Manzil: Toshkent sh., Yunusobod tumani, MFY Turkiston, Moyqo'rg'on ko'chasi, 5-uy</div>
      <br/>
      <div>Direktor: Baymuxammedova Lola Mirakbarovna</div>
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