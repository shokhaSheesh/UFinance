export const getDonoAvlodContractHtml = (data = {}) => {
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

  table.requisites { width: 100%; border-collapse: collapse; margin-top: 20px; }
  table.requisites td { vertical-align: top; padding: 6px 10px; width: 50%; }

  .signature-line {
    margin-top: 24px;
    border-top: 1px solid #333;
    width: 200px;
    display: inline-block;
  }
  .requisites .label {
    font-weight: 700;
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
  <span class="bold">"DONO A VLOD MAKTABI" MCHJ</span> (bundan buyon –
  "Muassasa" deb ataladi) nomidan ustav asosida harakat
  qiluvchi direktor SHARIPOV A DILAFRUZ ABIDJANOVNA, bir tomondan, Muassasa tarbiyalanuvchisi <span class=" highlight ">${studentName} (${studentBirthday})</span> ning qonuniy vakili <span class=" highlight ">${guardianName}</span> (bundan buyon –
  "Buyurtmachi" yoki "Qonuniy vakil" deb
  ataladi) nomidan harakat qiluvchi ikkinchi tomondan birgalikda "Taraflar"
  , alohida esa "Таraf" deb ataluvchilar, mazkur
  shartnomani quyidagilar haqida tuzdilar:
</p>

<!-- ==================== 1. SHARTNOMA PREDMETI ==================== -->
<div class="section-title">1. SHARTNOMA PREDMETI</div>

<p class="article">
  1.1. Muassasa mazkur shartnoma shartlariga asosan tarbiyalanuvchining barcha huquqlarini taʼminlagan holda unga sifatli
  ta'lim – tarbiya berish, sogʻliqni muhofaza qilish va mustahkamlash, intellektual, axloqiy, estetik va jismoniy rivojlanishi
  uchun shart – sharoit yaratib berish majburiyatini, Ota-onalar esa tarbiyalanuvchini muassasaga topshirish,
  tarbiyalanuvchining muassasadagi taʼminoti uchun toʻlovni oʻz vaqtida amalga oshirish va Muassasaning ichki tartib - qoidalariga rioya qilish majburiyatini oladi.
</p>

<!-- ==================== 2. TARAFLARNING HUQUQLARI ==================== -->
<div class="section-title">2. TARAFLARNING HUQUQLARI V A MAJBURIYATLARI</div>

<p class="article bold">2.1. Muassasa quyidagi huquqlarga ega:</p>

<p class="article">2.1.1. Muassasa xodimlarining qonuniy huquq va manfaatlarini, qadr-qimmati va qiziqishlarini himoya qilish;</p>
<p class="article">2.1.2. Muassasa ustavida belgilangan tartibda Qonuniy vakil (ota-ona)ning istagidan hamda, tarbiyalanuvchining yosh hususiyatidan kelib chiqib bolani guruhga taqsimlash;</p>
<p class="article">2.1.3. Tibbiy ko'rik va tarbiyalanuvchining kasallanishi natijasida uning muassasada bo'lishini taqiqlovchi hollar aniqlanganda shifokor tomonidan berilgan tegishli tibbiy xulosa berilgan vaqtlarda uni muassasaga qabul qilishni rad etish;</p>
<p class="article">2.1.4. Tarbiyalanuvchining muassasada bo'lgan davri uchun to'lanadigan badal to'lovi har oyning 10-sanasidan keyin ikki hafta mobaynida uzrli sabablarsiz to'lanmagan taqdirda yoki shartnoma bo'yicha to'lov muddatini ikki marotabadan ortiq miqdorda kechiktirib to'lansa Qonuniy vakil (ota-ona) bilan tuzilgan shartnoma muassasa tomonidan bir taraflama bekor qilish mumkin;</p>
<p class="article">2.1.5. Shartnoma bekor qilingan hollarda muassasaga bola qatnovini tiklash (kelmagan kunlari uchun to'lov qoplangan taqdirda) yoki yangi qabul qilingan bolalar uchun belgilangan tartibda amalga oshirish;</p>
<p class="article">2.1.6. Tarbiyalanuvchini oila muhitida tarbiyalash bo'yicha tegishli takliflar berish;</p>
<p class="article">2.1.7. Muassasada zarur moddiy-texnik baza hamda malakali pedagog xodimlar mavjud bo'lgan taqdirda, asosiy ta'lim-tarbiya jarayoniga xalaqit bermagan holda qo'shimcha ta'lim turlarini amalga oshirish;</p>

<p class="article bold">2.2. Muassasaning majburiyatlari:</p>

<p class="article">2.2.1. Bolaning muassasada bo'lgan davrida tarbiyalanuvchining hayotini muhofaza qilish, jismoniy hamda psixik sog'lig'ini ta'minlash, rivojlanishidagi nuqson (oddiy) va kamchiliklarni bartaraf etish va qiziqishlarini rivojlantirish, rivojlanish hususiyatlarini inobatga olgan holda, uning shaxsiga alohida yondashishni ta'minlash, O'zbekiston Respublikasi "Bola huquqlarining kafolatlari to'g'risidagi qonun va boshqa hujjatlariga rioya qilish;</p>
<p class="article">2.2.2. Pedagog kadrlar tomonidan odob-axloq qoidalariga qat'iy rioya qilishni ta'minlash, tarbiyalanuvchi va Qonuniy vakil (ota-ona)ning qadr-qimmatini hurmat qilish, ularga ko'maklashish, tarbiyalanuvchini turli tazyiqlardan himoya qilish;</p>
<p class="article">2.2.3. Muassasada O'zbekiston Respublikasi Maktabgacha va maktab ta'lim vazirligi NTM tomonidan ishlab chiqilgan maktabgacha ta'limga qo'yiladigan davlat talablarining to'laqonli bajarilishini ta'minlash;</p>
<p class="article">2.2.4. Ilg'or xorijiy tajribani hisobga olgan holda bolalarni har tomonlama intellektual, axloqiy, estetik va jismoniy rivojlantirish bo'yicha zarur bo'lgan shart-sharoitlar yaratish;</p>
<p class="article">2.2.5. Tarbiyalanuvchida o'qishga intilish hissini uyg'otish, ularni xalqning boy madaniy-tarixiy merosi va umumbashariy qadriyatlari asosida ma'naviy-axloqiy jihatdan tarbiyalash;</p>
<p class="article">2.2.6. Belgilangan sanitariya qoidalari, normalari va gigiena normativlari asosida sifatli oziq-ovqat mahsulotlari bilan ta'minlash;</p>
<p class="article">2.2.7. Tarbiyalanuvchiga tegishli bo'lgan narsa va buyumlarni to'laligicha saqlash;</p>
<p class="article">2.2.8. Qonuniy vakil (ota-ona)lar yoki ularning o'rnini bosuvchilardan tarbiyalanuvchini qabul qilib olish va ularga topshirish;</p>
<p class="article">2.2.9. Qonuniy vakil (ota-ona)larni muassasani kun tartibi, ta'lim-tarbiya dasturlari ilova qilinadi, muassasasining manzili va telefoni hamda ta'limni boshqaruv idorasi bilan tanishtirish;</p>
<p class="article">2.2.10.Muassasaning barcha hodimlari tomonidan qo'pol muomalada bo'lmaslik hamda bolaning ruhiyatiga salbiy ta'sir ko'rsatadigan munosabatda bo'lmaslik;</p>
<p class="article">2.2.11.Tarbiyalanuvchilarga birinchi tibbiy xizmat ko'rsatish;</p>
<p class="article">2.2.12.Ota-onalardan yoki ularning qonuniy vakillaridan tarbiyalanuvchini qabul qilib olish va topshirish;</p>

<p class="article bold">2.3. Qonuniy vakil (ota-ona) quyidagi huquqlarga ega:</p>

<p class="article">2.3.1. Tarbiyalanuvchining qonuniy huquq va manfaatlarini himoya qilish;</p>
<p class="article">2.3.2. Muassasaning ustavi bilan tanishish;</p>
<p class="article">2.3.3. Muassasada tarbiyalanuvchilar bilan olib boriladigan ta'lim-tarbiya ishlarini yaxshilash bo'yicha takliflar kiritish;</p>
<p class="article">2.3.4. Muassasada bolasi uchun ta'lim berish tilini tanlash;</p>
<p class="article">2.3.5. Muassasada tarbiyalanuvchi ta'lim-tarbiya berish uchun zarur shart-sharoitlar yaratilishini, hamda bolaning shaxsiga nisbatan hurmat bilan munosabatda bo'lish, shartnomada belgilangan shartlar bo'yicha bolaga sifatli ta'lim-tarbiya berishni talab qilish;</p>
<p class="article">2.3.6. Muassasa rahbariyatini 7 kun oldin xabardor qilgan holda shartnomani muddatidan avval bir taraflama bekor qilish.</p>

<p class="article bold">2.4. Qonuniy vakil (ota-ona)ning majburiyatlari:</p>

<p class="article">2.4.1. Mazkur shartnoma talablariga qat'iy rioya qilish;</p>
<p class="article">2.4.2. Pedagoglar bilan kelishmovchiliklar yuzaga kelganda, tarbiyalanuvchilar ishtirokisiz zudlik bilan muassasa rahbariyati bilan muammoni hal qilish;</p>
<p class="article">2.4.3. Tarbiyalanuvchini muassasaga joylashtirganda, tegishli hujjatlar va Qonuniy vakil (ota-ona)lar haqidagi to'liq ma'lumotlarni (telefon raqamlari, yashash va ish joyi haqida ma'lumotnomalar) taqdim etish;</p>
<p class="article">2.4.4. Tarbiyalanuvchi betob bo'lganda, zudlik bilan muassasa ma'muriyati yoki tibbiy xamshiraga xabar berish va tarbiyalanuvchi sog'ayganidan so'ng tibbiy malumotnomani taqdim etish;</p>
<p class="article">2.4.5. Tarbiyalanuvchining muassasadagi ta'minoti uchun buyurtmachi to'lovini o'z vaqtida tijorat banklari orqali naqd pul yoki naqd pulsiz (bank plastik kartochkalari orqali va pul o'tkazish yo'li bilan) shaklda to'lash hamda to'lovning amalga oshirilganligini tasdiqlovchi hujjat nusxasini muassasaga taqdim etish;</p>
<p class="article">2.4.6. Mazkur shartnoma imzolangandan so'ng tarbiyalanuvchining qonuniy vakillari shartnomada ko'rsatilgan to'lovni 3 kun ichida to'lish;</p>
<p class="article">2.4.7. Muassasa ishchi xodimlari va tarbiyalanuvchilar va ularning Qonuniy vakil (ota-ona)lariga nisbatan hurmat bilan munosabatda bo'lish;</p>
<p class="article">2.4.8. Tarbiyalanuvchining to'laqonli ovqatlanishini, ularda shaxsiy gigiena ko'nikmalari shakllantirilishini qat'iy kuzatib borish hamda tarbiyalanuvchini muassasaga toza-ozoda kiyingan holda olib kelish;</p>
<p class="article">2.4.9. Muassasaga tarbiyalanuvchini har qanday qimmatbaho taqinchoqlar, uyali aloqa vositalari va boshqa texnika vositalari bilan olib kelmaslik, ushbu holatlar kuzatilganda muassasa ma'muriyati ularning yo'qolishi oqibati yuzasidan javobgar bo'lmaydi;</p>
<p class="article">2.4.10. Yashash joyi yoki telefon raqamlari o'zgargan taqdirda, muassasa rahbariyati va guruh tarbiyachisiga bu haqda xabar berish;</p>
<p class="article">2.4.11. Bolani muassasadan olib ketishni begona shaxslarga topshirmaslik;</p>
<p class="article">2.4.12. Ertalabdan bolada kasallik holatlari kuzatilgan taqdirda muassasaga olib bormasdan shifokor ko'rigidan o'tkazish.</p>
<p class="article">2.4.13. Tarbiyalanuvchinig tug'ilgan kuni va tadbirlarini nishonlash uchun uy sharoitida tayyorlangan oziq ovqat mahsulotlari hamda pishiriqlarini Muassasaga olib kirmaslik.</p>
<p class="article">2.4.14. Ota onaning oldindan bergan yozma arizasiga asosan, bolaning muassasaga qatnashi butunlay to'xtatilgan taqdirda, to'lov to'liq bo'lmagan oy uchun, yani bola amalda muassasaga qatnagan kunlar uchun qayta hisoblanib to'lov amalga oshiriladi.</p>

<!-- ==================== 3. TO'LOV TARTIBI ==================== -->
<div class="section-title">3. TO'LOV (HISOB-KITOB) TARTIBI</div>

<p class="article">3.1. Muassasa bolalar taʼminoti uchun toʻlanadigan tushumlar nazarda tutilgan mablagʻlari maqsadli tartibda
  tarbiyalanuvchilarni oziq – ovqat bilan taʼminlashni hamda Muassasaning moddiy texnik bazasini yaxshilashga, tarbiya
  jarayonini tashkillashtirishga, sanitariya – gigiyena vositalari va yumshoq inventarlar xarid qilishga maqsadli tartibda
  yoʻnaltiriladi.</p>
<p class="article">3.2 Shartnomaga asosan oylik to'lov miqdori ikki hil tarifda to'lov amalga oshirish mumkin:<br/>
  - "Premium" tarifi-bir haftada olti kunlik tarif bo'lib, 3 400 000 (uch million to'rt yuz ming )so'mni;<br/>
  - "Standart" tarifi-bir haftada besh kunlik tarif bo'lib, 3 200 000 (uch million ikki yuz ming)so'mni tashkil etadi.<br/>
  "Premium"va "Standart" tariflarida:bir ota-onaning ikki va undan ortiq farzandlari muassasaga qatnasa, har bir bola
  uchun 200 000 so'm chegirma belgilandi</p>
<p class="article">3.3. Tarbiyalanuvchining Muassasadagi taʼminoti uchun toʻlovni- har oyning 10-sanasigacha kechiktirmasdan amalga
  oshirilishi lozim.</p>
<p class="article">3.4. Tarbiyalanuvchi sababsiz uyda qolgan holatlarda ota – ona tarafidan toʻlovlar umumiy asoslarda toʻlanadi.</p>
<p class="article">3.5. Tarbiyalanuvchining Muassasadagi taʼminoti uchun toʻlovlar oyning toʻlov hisoblanish sanasidan boshlab 10 kun
  mobaynida toʻlov uzrli sabablarsiz toʻlanmagan taqdirda, shartnoma bir tomonlama bekor qilinib, tarbiyalanuvchi
  Muassasadan chetlashtiriladi.</p>
<p class="article">3.7. Muassasadan qarzdorlik paydo boʻlgan sanadan qarzdorlikni bartaraf etish uchun 10 kun mobaynida Muassasadagi
  bola taʼminoti uchun mavjud boʻlgan qarzdorlik qoplanganda, tarbiyalanuvchi ushbu Muassasaga tiklanadi. Koʻrsatilgan
  muddatdan oʻtib ketgan taqdirda Muassasaga bolani qabul qilish umumiy asoslarda amalga oshiriladi.</p>
<p class="article">3.8. Shartnomaning 1 va 3.2 bandida ko'rsatilgan oylik to'lovi miqdori Muassasaning ichki imkoniyatlari, ustavi va
  kelgusi davr harajatlarini inobatga olgan holda, Muassasa tomonidan o'zgartirilishi mumkin, bunda Muassasa buyurtmachini
  kamida yigirma kun oldin habardor qilgan holda amalga oshiriladi va mazkur shartnomaga qo'shimcha kelishuv qilinadi.</p>

<!-- ==================== 4. JAVOBGARLIK ==================== -->
<div class="section-title">4.TARAFLARNING JA VOBGARLIGI</div>

<p class="article">4.1. Taraflar ushbu shartnoma shartlarini bajarmagan yoki lozim darajada bajarmagan holatlarda, ular O‘zbekiston
  Respublikasining amaldagi qonun hujjatlariga muvofiq javobgar bo‘ladilar.</p>

<!-- ==================== 5. O'ZGARTIRISH VA BEKOR QILISH ==================== -->
<div class="section-title">5.SHARTNOMANI O'ZGARTIRISH V A BEKOR QILISH</div>

<p class="article">5.1. Taraflar shartnomani o‘zgartirish va bekor qilishni mazkur shartnomada nazarda tutilgan hollarda va qonunchilik
  hujjatlari asosida amalga oshiriladi.</p>
<p class="article">5.2. Shartnoma bajarilishini bir taraflama rad etishga yoki shartnoma shartlarini bir taraflama o‘zgartirishga faqat
  mazkur shartnoma va qonunchilik hujjatlariga asosan yo‘l qo‘yiladi.</p>

<!-- ==================== 6. NIZOLAR ==================== -->
<div class="section-title">6.NIZOLARNI HAL QILISH TARTIBI</div>

<p class="article">6.1. Shartnoma bo‘yicha yuzaga kelgan har qanday nizo tomonlarning kelishuvi asosida hal qilinadi.</p>
<p class="article">6.2. Nizo kelishuv tartibida hal etilmagan taqdirda amaldagi qonunchilikka muvofiq sud tartibida hal etiladi.</p>

<!-- ==================== 7. FORS-MAJOR ==================== -->
<div class="section-title">7. FORS-MAJOR HOLATLARI</div>

<p class="article">7.1. Taraflar shartnomani fors-major holatlari, ya’ni yengib bo‘lmaydigan kuch, favqulodda va muayyan sharoitlarda
  oldini olib bo‘lmaydigan vaziyatlar tufayli majburiyatlarni bajarmagan yoki lozim darajada bajarmaganligini isbotlasa,
  javobgar bo‘lmaydilar.</p>
<p class="article">7.2. Sodir bo‘lgan fors-major holatlari to‘g‘risida taraflar bir-birlarini ushbu holatlar yuz bergan holda zudlik bilan
  yozma yoki og‘zaki tartibda xabardor qilishi shart.</p>
<p class="article">7.3. Mazkur shartnoma bo‘yicha majburiyatlarni bajarish muddati yengib bo‘lmaydigan kuch holatlarini davomiyligini
  hisobga olib shartnomani amal qilish muddatini uzaytirishlari mumkin.</p>

<!-- ==================== 8. YAKUNIY QOIDALAR ==================== -->
<div class="section-title">8.YAKUNIY QOIDALAR</div>

<p class="article">8.1. Mazkur shartnoma imzolangan kundan kuchga kiradi, 31.08.2026-yilgacha amal qiladi.</p>
<p class="article">8.2.Mazkur shartnoma ikki nusxada tuzildi, ikki nusxa bir xil yuridik kuchga ega, muassasa hamda qonuniy vakil
  (ota-ona)larda bir nusxadan saqlanadi.</p>

<!-- ==================== 9. REKVIZITLAR ==================== -->
<div class="section-title">9. Taraflarning yuridik manzillari va rekvizitlari</div>

<table class="requisites">
  <tr>
    <td>
      <div class="bold">Muassasa (Ijrochi) "DONO A VLOD MAKTABI" MCHJ</div>
      <div>Buyurtmachi (tarbiyalanuvchining qonuniy vakili)</div>
      <div>Botirov Bosit Bobir o'g'li</div>
      <div>TOSHKENT SHAHAR, SHAYHONTOHUR TUMANI,</div>
      <div>ZAFAROBOD MFY, NUROBOD 5-TOR KO'CHASI</div>
      <div>12-UY</div>
      <div>.</div>
      <div>СТИР: 310224554 AD1870404</div>
      <div>ОКЭД: 85100 .</div>
      <div>Х/Р: 2020 8000 5056 1733 4001</div>
      <div>МФО: 01095</div>
      <div>Банк: ТОШКЕНТ Ш.,</div>
      <div>БАНКИ "ASIA ALLIANCE BANK" АТ</div>
      <br/>
      <div>Direktor: Sharipova D.A</div>
      <div>Botirov Bosit Bobir o'g'li</div>
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