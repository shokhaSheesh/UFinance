export const getAdStellasContractHtml = (data = {}) => {
  const {
    contractNumber = '___',
    contractDate = '____-__-__',
    contractEndDate = '____-__-__',
    directorName = 'Rizayeva S.X',
    childName = '________________________',
    childBirthDate = '____-__-__',
    parentName = '________________________',
    parentPassport = '________________________',
    parentAddress = '________________________',
    monthlyPayment = '4 050 000',
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

  .sub-title {
    font-weight: 700;
    margin: 12px 0 6px;
    text-indent: 5px;
  }

  p.article { text-align: justify; margin-bottom: 6px; text-indent: 5px; }

  .bold { font-weight: 700; }
  .highlight { background: #fffde7; padding: 1px 4px; border-radius: 2px; }

  table.requisites { width: 100%; border-collapse: collapse; margin-top: 20px; }
  table.requisites td { vertical-align: top; padding: 6px 10px; width: 50%; }

  .signature-line {
    margin-top: 24px;
    border-top: 1px solid #333;
    width: 200px;
    display: inline-block;
  }

  .acknowledgement {
    margin-top: 30px;
    padding: 10px 0;
    border-top: 1px solid #ccc;
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

<h1>"AD STELLAS" MCHJ<br/>
maktabgacha ta'lim tashkiloti va ota-ona o'rtasidagi tuzilgan</h1>
<h2>SHARTNOMA № ${contractNumber}</h2>

<div class="header-line">
  <span>${contractDate}</span>
  <span>Toshkent shahar</span>
</div>

<p class="intro">
  <span class="bold">"AD STELLAS" MCHJ</span> maktabgacha ta'lim tashkiloti (keyingi o'rinlarda —
  Bajaruvchi) nomidan ustav asosida faoliyat yurituvchi direktor <span class="bold">${directorName}</span> bir
  tarafdan va <span class="bold highlight">${parentName}</span> (keyingi o'rinlarda – Buyurtmachi)
  ikkinchi tarafdan mazkur shartnoma quyidagilar haqida tuzildi.
</p>

<!-- ==================== 1. SHARTNOMA PREDMETI ==================== -->
<div class="section-title">1. Shartnoma predmeti</div>

<p class="article">
  1.1. Tashkilot mazkur shartnoma shartlariga asosan <span class="highlight">${childBirthDate}</span> sanada tug'ilgan
  <span class="bold highlight">${childName}</span> (keyingi o'rinlarda — Tarbiyalanuvchi)ning barcha huquqlarini ta'minlagan
  holda unga sifatli ta'lim-tarbiya berish, sog'liqni muhofaza qilish va mustahkamlash,
  intellektual, axloqiy, estetik va jismoniy rivojlanishi uchun shart-sharoit yaratib berish
  majburiyatini oladi.
</p>
<p class="article">
  1.2. Buyurtmachi esa tarbiyalanuvchini belgilangan kunlarda va belgilangan vaqt oralig'ida
  tashkilotga topshirish, shartnoma shartlariga muvofiq to'lovni o'z vaqtida amalga oshirishi va
  Tashkilotning ichki tartib-qoidalariga rioya qilish majburiyatini oladi.
</p>

<!-- ==================== 2. TARAFLARNING HUQUQLARI ==================== -->
<div class="section-title">2. Taraflarning huquqlari va majburiyatlari</div>

<p class="sub-title">Tashkilot quyidagi huquqlarga ega:</p>

<p class="article">2.1. Tashkilot xodimlarining qonuniy huquq va manfaatlarini, qadr-qimmati va qiziqishlarini himoya qilish;</p>
<p class="article">2.2. Tashkilot ustavida belgilangan tartibda Buyurtmachining istaklari, tarbiyalanuvchilarning yosh xususiyatiga ko'ra bolani guruhiga taqsimlash;</p>
<p class="article">2.3. Tarbiyalanuvchining Tashkilotda bo'lishini tasdiqlovchi tibbiy xulosa bo'lmagan taqdirda, uni Tashkilotga (vaqtincha) qabul qilmaslik;</p>
<p class="article">2.4. Tarbiyalanuvchining Tashkilotda bo'lgan davri uchun to'lanadigan badal to'lovi shartnomaning 3.2-bandida belgilangan muddatda to'lanmagan taqdirda, Tarbiyalanuvchini Tashkilotga qabul qilmaslik;</p>
<p class="article">2.5. Shartnoma bekor qilingan hollarda Tashkilot bola qatnovini tiklashni yangi qabul qilingan bolalar uchun belgilangan tartibda amalga oshirish;</p>
<p class="article">2.6. Tarbiyalanuvchini oilada tarbiyalash bo'yicha tavsiya berish;</p>
<p class="article">2.7. Tibbiyot hamshirasi tomonidan tarbiyalanuvchilarni ertalabki filtratsiyadan o'tkazish jarayonida bolaning kasalligi aniqlangan hollarda tashkilotga qabul qilmaslik;</p>

<p class="sub-title">Tashkilotning majburiyatlari:</p>

<p class="article">2.8. Tarbiyalanuvchining yoshi, individual, psixologik va jismoniy xususiyatlari, iste'dodi hamda qobiliyatini inobatga olgan holda ta'lim-tarbiya jarayonini tashkillashtirish va nazorat qilish;</p>
<p class="article">2.9. Tarbiyalanuvchining hayotini muhofaza qilish, jismoniy hamda psixologik sog'ligini ta'minlash, rivojlanishidagi nuqson (oddiy) va kamchiliklarni bartaraf etish, ijodiy qobiliyatlari hamda qiziqishlarini rivojlantirish, rivojlanish xususiyatlarini inobatga olgan holda, uning shaxsiga alohida yondashishni ta'minlash, bola huquqlari to'g'risidagi Konvensiyaga rioya qilish;</p>
<p class="article">2.10. Pedagog axloq-odobiga rioya qilish, bola va Buyurtmachining qadr-qimmatini hurmat qilish, bolalarni turli tazyiqlardan himoya qilish, ularni mehnatga, ota-onaga hurmat, atrof-muhitga ehtiyotkorlik bilan munosabatda bo'lish ruhida tarbiyalash;</p>
<p class="article">2.11. Tarbiyalanuvchilarning rivojlanishi va maktab ta'limiga tayyorlashga oid bilim, malaka va ko'nikmalarga ega bo'lishlarida Buyurtmachiga ko'maklashish;</p>
<p class="article">2.12. Ilg'or xorijiy tajribani hisobga olgan holda bolalarni har taraflama intellektual, axloqiy, estetik va jismoniy rivojlantirish bo'yicha zarur bo'lgan shart-sharoitlarni yaratish;</p>
<p class="article">2.13. Tarbiyalanuvchilarga yuqori professional darajada ta'lim-tarbiya berish orqali maktabgacha ta'lim sifatini oshirish va maktab ta'limiga sifatli tayyorlash imkoniyatini yaratish;</p>
<p class="article">2.14. Tarbiyalanuvchini tashkilotda xodimlarning qo'pol munosabatlari, bolaning ruhiyatiga salbiy ta'sir ko'rsatadigan muammolarning turli ko'rinishlaridan himoya qilishni ta'minlash;</p>
<p class="article">2.15. Pedagog va Buyurtmachining bola manfaati yo'lidagi hamkorlik usullarini ustuvor ravishda qo'llash;</p>
<p class="article">2.16. Tarbiyalanuvchiga tibbiy xizmat ko'rsatishni tashkil etish, davolanuvchi-profilaktik tadbirlar, reja asosida profilaktik, sog'liqni saqlash organlari bilan hamkorlikda tor mutaxassislar tarafidan tibbiy ko'riklarni o'z vaqtida o'tkazish;</p>
<p class="article">2.17. Tarbiyalanuvchida o'qishga intilish hissini o'rgatish, ularni xalqimizning boy madaniy-tarixiy merosi va umumbashariy qadriyatlari asosida ma'naviy-axloqiy jihatdan tarbiyalash;</p>
<p class="article">2.18. Buyurtmachidan bola ehtiyoji uchun zarur bo'lgan narsalar (kanstovar va dori vositalari)ga majburiy tarzda pul yig'maslik;</p>
<p class="article">2.19. Tarbiyalanuvchini Buyurtmachi bilan Chet-el va viloyatlarga yoki boshqa har qanday ish bilan safarga chiqishi hamda buning natijasida tarbiyalanuvchining Tashkilotga kelmagan har bir kuni uchun mazkur Shartnomaning 3.9-bandida ko'rsatilgan to'lovlarni to'lashdan ozod etmaydi.</p>
<p class="article">2.20. Belgilangan sanitariya qoidalari, normalari va gigiena normativlari asosida sifatli oziq-ovqat mahsulotlari bilan ta'minlash;</p>
<p class="article">2.21. Tarbiyalanuvchiga tegishli bo'lgan narsa va buyumlarni to'laligicha saqlash;</p>
<p class="article">2.22. Buyurtmachi yoki ularning qonuniy vakillaridan tarbiyalanuvchini qabul qilib olish va ularga topshirish;</p>
<p class="article">2.23. Buyurtmachini tashkilot ustavi, kun tartibi, ta'lim-tarbiya dasturlari, Tashkilotning manzili va telefoni hamda ta'limni boshqaruv idorasi bilan tanishtirish.</p>

<p class="sub-title">Ota-ona quyidagi huquqlarga ega:</p>

<p class="article">2.24. Tarbiyalanuvchining qonuniy huquq va qiziqishlarini himoya qilish;</p>
<p class="article">2.25. Tashkilotning ustavi bilan tanishish;</p>
<p class="article">2.26. Mavsumiy cheklov (karantin) va xavfsizlik choralari kuchaytirilgan vaqtlardan tashqari vaqtda Tashkilotning turli tadbirlarida farzandi bilan birgalikda ishtirok etish (bayram ertaliklari, ko'riklar, ko'ngilochar soatlar, yakuniy hamda ochiq mashg'ulotlar va x.k.);</p>
<p class="article">2.27. Tashkilotda bolalar bilan olib boriladigan ta'lim-tarbiya ishlarini yaxshilash bo'yicha takliflar kiritish;</p>
<p class="article">2.28. Tashkilotda bolalarga ta'lim-tarbiya berish uchun zarur shart-sharoitlar yaratishini hamda bolalarning shaxsga nisbatan hurmat bilan munosabatda bo'lish, shartnomada belgilangan shartlar bo'yicha bolaga ta'lim-tarbiya berilishini talab qilish;</p>
<p class="article">2.29. Tashkilotning kun tartibi davomida Bolalarni Tashkilotdan olib ketish boshlanish vaqtidan olib ketishning yakuniy vaqtigacha bo'lgan davrda yoki o'ziga qulay bo'lgan vaqtda sababi ko'rsatilgan holda yozma bildirish asosida bolalarni Tashkilotdan olib ketish;</p>
<p class="article">2.30. Tashkilot rahbariyatini Shartnomani muddatidan oldin bekor qilishni bir hafta oldin yozma ravishda xabardor qilgan holda shartnomani muddatidan avval bir taraflama bekor qilish.</p>

<p class="sub-title">Buyurtmachining majburiyati:</p>

<p class="article">2.31. Tashkilot ustavi hamda mazkur shartnoma talablariga qat'iy rioya qilish;</p>
<p class="article">2.32. Pedagoglar bilan kelishmovchiliklar yuzaga kelgan taqdirda, tarbiyalanuvchilarni aralashtirmay turib, zudlik bilan Tashkilot rahbariyati bilan muammoni hal qilish;</p>
<p class="article">2.33. Tarbiyalanuvchini Tashkilotga joylashtirganda, tegishli hujjatlar va Buyurtmachi haqidagi ma'lumotlarni (telefon raqami, yashash va ish joyi haqida ma'lumotnoma) taqdim etish;</p>
<p class="article">2.34. Tarbiyalanuvchi kasallangan taqdirda, zudlik bilan tashkilot ma'muriyati yoki tibbiy xodimlariga xabar berish va tarbiyalanuvchi sog'aygandan so'ng, tibbiy ma'lumotnomani taqdim etish;</p>
<p class="article">2.35. Tarbiyalanuvchining Tashkilotdagi ta'minoti uchun Buyurtmachi to'lovini o'z vaqtida tijorat banklari orqali naqd pul yoki naqd pulsiz (bank plastik kartochkalari orqali va pul o'tkazish yo'li bilan) shaklda to'lash hamda to'lovning amalga oshirilganligini tasdiqlovchi hujjat nusxasini Tashkilotga taqdim etish;</p>
<p class="article">2.36. Mazkur shartnoma imzolangandan keyin tarbiyalanuvchining qonuniy vakillari shartnomada ko'rsatilgan to'lovni 3 kun ichida to'lash;</p>
<p class="article">2.37. Tashkilot ishchi xodimlari va boshqa ota-onalarni hurmat qilish;</p>
<p class="article">2.38. Tarbiyalanuvchini to'laqonli ovqatlanishini, ularda shaxsiy gigiena ko'nikmalarni shakllantirilishini qat'iy kuzatib borish hamda tarbiyalanuvchini tashkilotga ozoda kiyingan holda olib kelish;</p>
<p class="article">2.39. Tarbiyalanuvchining tug'ilgan kuni va tadbirlarni nishonlash uchun uy sharoitida tayyorlangan oziq-ovqat mahsulotlari hamda pishiriqlarni tashkilotga olib kirmaslik;</p>
<p class="article">2.40. Tashkilotga bolani har qanday qimmatbaho taqinchoqlar, uyali aloqa vositalari va boshqa texnika vositalari bilan olib kelmaslik;</p>
<p class="article">2.41. Yashash joyi yoki telefon raqami o'zgargan taqdirda, Tashkilot rahbariyati va guruh tarbiyachisiga bu haqda xabar berish;</p>
<p class="article">2.42. Bolani oilada tarbiyalash uchun zarur shart-sharoitlarni ta'minlash;</p>
<p class="article">2.43. Bolani tashkilotdan olib ketishni begona shaxslarga topshirmaslik;</p>
<p class="article">2.44. Ertalabdan bolada kasallik holatlari kuzatilgan taqdirda, muassasaga olib bormasdan shifokor ko'rigidan o'tkazish;</p>
<p class="article">2.45. Buyurtmachining oldindan bergan yozma arizasiga asosan, bolaning maktabgacha ta'lim tashkilotiga qatnashi butunlay to'xtatilgan taqdirda, to'lov to'liq bo'lmagan oy uchun, ya'ni bola amalda maktabgacha ta'lim tashkilotiga qatnagan kunlar uchun to'lanadi.</p>

<!-- ==================== 3. TO'LOV TARTIBI ==================== -->
<div class="section-title">3. To'lov (hisob-kitob) tartibi</div>

<p class="article">3.1. Shartnomaga asosan 1 oylik xizmat ko'rsatish bahosi <span class="bold highlight">${monthlyPayment} so'm</span>ni tashkil qiladi. Oylik xizmat ko'rsatish vaqti har oyning birinchi kunidan oxirgi kunigacha bo'lgan muddatni qamrab oladi.</p>
<p class="article">3.2. Tarbiyalanuvchining Tashkilotdagi ta'minoti uchun to'lovni har bir kelasi oy uchun joriy oyning oxirgi sanasigacha amalga oshirish lozim (masalan, 2025 yil aprel oyi uchun 2025 yil 31 martga qadar to'lanadi).</p>
<p class="article">3.3. Bir yil (12 oy) uchun oldindan to'lov qilinganda umumiy summaga nisbatan <span class="bold">10 foiz chegirma beriladi.</span></p>
<p class="article">3.4. Yarim yil (6 oy) uchun oldindan to'lov qilinganda umumiy summaga nisbatan <span class="bold">5 foiz chegirma beriladi.</span></p>
<p class="article">3.5. Bir yil yoki olti oy uchun oldindan to'lov qilinganda ushbu muddat tugamasdan turib shartnoma bekor qilinsa to'lov uchun qo'llangan imtiyoz bekor qilinib, o'tgan davr uchun to'lovlar chegirmani olib tashlagan holda qayta hisob-kitob qilinadi.</p>
<p class="article">3.6. Tarbiyalanuvchi sababsiz Tashkilotga kelmagan hollarda to'lovlar umumiy asoslarda to'lanadi.</p>
<p class="article">3.7. To'lov belgilangan muddatdan 10 (o'n) kun kechiktirilsa Tarbiyalanuvchi 11-kundan boshlab to'lov joriy oy uchun to'liq amalga oshirilmagunga qadar Tashkilotga qabul qilinmaydi.</p>
<p class="article">3.8. Mazkur shartnoma tomonlarning kelishuviga ko'ra muddatidan oldin bekor qilingan taqdirda oldindan amalga oshirilgan to'lov ushbu shartnomaning 5.4-bandiga ko'ra hisob-kitob qilinadi. Qaytariladigan mablag' shartnoma bekor qilingan kunidan boshlab 30 (o'ttiz) ish kuni ichida Buyurtmachining bankdagi hisob raqami yoki shaxsiy bank kartasiga naqdsiz shaklda to'lab beriladi.</p>
<p class="article">3.9. Tarbiyalanuvchi faqatgina kasal bo'lganligi sababli Tashkilotga uzluksiz 10 kun muddatdan ortiq qatnamagan taqdirda Buyurtmachining arizasi va tegishli oilaviy poliklinika tomonidan berilgan tasdiqlovchi hujjat asli taqdim etilgan hollarda bola amalda Tashkilotga kelmagan kunlar uchun to'lov undirilmaydi.<br/>
Tarbiyalanuvchining boshqa sabablar bilan (chet el safariga chiqishi, qarindoshini uyiga ketishi, dam olishga borishi va hokazo) Tashkilotga kelmasligi oylik to'lovlarni to'lashdan ozod etmaydi.</p>

<!-- ==================== 4. JAVOBGARLIK ==================== -->
<div class="section-title">4. Taraflarning javobgarligi</div>

<p class="article">4.1. Taraflar ushbu shartnoma shartlarini bajarmagan yoki lozim darajada bajarmagan holatlarda, ular O'zbekiston Respublikasining amaldagi qonun hujjatlariga muvofiq javobgar bo'ladilar.</p>

<!-- ==================== 5. O'ZGARTIRISH VA BEKOR QILISH ==================== -->
<div class="section-title">5. Shartnomani o'zgartirish va bekor qilish</div>

<p class="article">5.1. Taraflar shartnomani o'zgartirish va bekor qilish mazkur taraflarning roziligi bilan amalga oshiriladi. Mazkur shartnomaga kiritilgan barcha qo'shimcha va o'zgartirishlar yozma ravishda tuzilib, taraflar imzolagan taqdirda haqiqiy hisoblanadi.</p>
<p class="article">5.2. Shartnomani o'zgartirish yoki bekor qilish haqidagi qarori haqida bir taraf kamida 10 ish kuni avval ikkinchi tarafni yozma xabardor qilishi shart.</p>
<p class="article">5.3. Shartnoma bajarilishini bir taraflama rad etishga yoki shartnoma shartlarini bir taraflama o'zgartirishga faqat qonun hujjatlariga asosan yo'l qo'yiladi.</p>
<p class="article">5.4. Mazkur Shartnoma muddatidan avval tugatilgan taqdirda shartnomada ko'rsatilgan barcha imtiyoz va chegirmalar bekor qilingan hisoblanadi. Tarbiyalanuvchining qonuniy vakili yoki "Uchinchi shaxs" tomonidan amalga oshirilgan barcha to'lovlar o'tgan davr uchun imtiyoz va chegirmasiz Shartnomaning 3.2-bandida ko'rsatilgan umumiy summadan qayta hisob-kitob qilingan holda qolgan summa qaytarib beriladi va (yoki) tarbiyalanuvchining qonuniy vakili tomonidan qo'shimcha to'lov amalga oshiriladi (bunda Tashkilot tomonidan belgilangan bir oylik tarif narxidan kelib chiqqan holda hisob-kitob qilinadi).</p>

<!-- ==================== 6. NIZOLAR ==================== -->
<div class="section-title">6. Nizolarni hal qilish tartibi</div>

<p class="article">6.1. Ushbu shartnoma bo'yicha nizolar kelib chiqqan taqdirda, taraflar, qoidaga ko'ra, ularni sudgacha hal etish choralarini ko'radilar. Nizo o'zaro hal qilinmagan taqdirda fuqarolik ishlari bo'yicha tegishli tumanlararo sudda hal qilinadi.</p>
<p class="article">6.2. Mazkur shartnomada ko'zda tutilmagan holatlar amaldagi qonunchilik normalari asosida amalga oshiriladi.</p>

<!-- ==================== 7. FORS-MAJOR ==================== -->
<div class="section-title">7. Fors-major holatlari</div>

<p class="article">7.1. Majburiyatlar fors-major holatlari, ya'ni yengib bo'lmaydigan kuch, favqulodda va muayyan sharoitlarda oldini olib bo'lmaydigan vaziyatlar (zilzila, qurg'oqchilik, suv toshqini, yong'in, sel, do'l, jala, kuchaytirilgan karantin, ommaviy epidemiya va boshqa tabiiy ofatlar) tufayli bajarilmagan yoki lozim darajada bajarilmaganligini isbotlansa, taraflar javobgar bo'lmaydilar.</p>
<p class="article">7.2. Sodir bo'lgan fors-major holatlari to'g'risida taraflar bir-birlarini ushbu holatlar yuz bergan holda zudlik bilan yozma yoki og'zaki tartibda xabardor qilishlari shart.</p>
<p class="article">7.3. Mazkur shartnoma bo'yicha majburiyatlarni bajarish muddati yengib bo'lmaydigan kuch holatlarini davomiyligini hisobga olib, shartnomani amal qilish muddatini uzaytirishlari mumkin.</p>

<!-- ==================== 8. YAKUNIY QOIDALAR ==================== -->
<div class="section-title">8. Yakuniy qoidalar</div>

<p class="article">8.1. Mazkur shartnoma imzolagan kundan boshlab kuchga kiradi va ${contractEndDate} sanaga qadar amal qiladi.</p>
<p class="article">8.2. Mazkur shartnoma ikki nusxada tuziladi, ikkala nusxa ham bir xil yuridik kuchga ega, tashkilot hamda Buyurtmachida bir nusxadan saqlanadi.</p>

<!-- ==================== 9. REKVIZITLAR ==================== -->
<div class="section-title">9. Taraflarni manzillari va rekvezitlari</div>

<table class="requisites">
  <tr>
    <td>
      <div class="bold">MCHJ "AD STELLAS"</div>
      <div>Manzil: G'ani A'zamov MFY, Qichqiriq ko'chasi, 9a-uy</div>
      <div>Tel: +99897 730-65-56</div>
      <div>Bank: "HAMKORBANK" AT BANKI, Olmazor filiali</div>
      <div>X/r: 2020 8000 9073 5375 2001</div>
      <div>MFO: 00083</div>
      <div>STIR: 312 563 360</div>
      <br/>
      <div>Direktor: ${directorName}</div>
      <div style="margin-top: 6px;">M.O'</div>
      <div class="signature-line"></div>
      <div>${directorName}</div>
    </td>
    <td>
      <div class="bold">Ota-ona</div>
      <div>Yashash manzil: <span class="highlight">${parentAddress}</span></div>
      <br/>
      <div>Pasport seriyasi: <span class="highlight">${parentPassport}</span></div>
      <br/><br/>
      <div class="signature-line"></div>
      <div><span class="bold highlight">${parentName}</span></div>
    </td>
  </tr>
</table>

<div class="acknowledgement">
  <p class="article">Shaxsan shartnomaning 1-nusxasini oldim va Tashkilot ichki tartib qoidalari bilan tanishdim</p>
  <p style="margin-top: 16px;">
    <span class="bold highlight">${parentName}</span>
    <span class="signature-line" style="margin-left: 20px;"></span> (imzo)
  </p>
</div>

</body>
</html>`
}