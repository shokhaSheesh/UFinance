"use client"

// Локализация webview переклички. Язык приходит из get_attendance_bot_chat
// (поле language) и переключается вручную в шапке. Кабинетный next-intl тут
// не используем: он завязан на локаль всего приложения и требует перезагрузки,
// а мини-апп должен переключаться мгновенно и жить своей локалью.

export const LOCALES = [
  { code: "ru", label: "Русский", short: "РУ" },
  { code: "uz", label: "O‘zbekcha", short: "UZ" },
  { code: "en", label: "English", short: "EN" },
]

export const DEFAULT_LOCALE = "ru"

const ALIASES = {
  ru: "ru", rus: "ru", russian: "ru", "ru-ru": "ru", русский: "ru",
  uz: "uz", uzb: "uz", uzbek: "uz", "uz-uz": "uz", "uz-latn": "uz", ozbek: "uz",
  en: "en", eng: "en", english: "en", "en-us": "en", "en-gb": "en",
}

/** Приводит язык из бота («uz», «uz-UZ», «Uzbek») к коду из LOCALES */
export const normalizeLocale = (value) => {
  if (!value) return null
  const key = String(value).trim().toLowerCase()
  return ALIASES[key] || ALIASES[key.split(/[-_]/)[0]] || null
}

const MONTHS = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
}

/** «26 августа» / «26-avgust» / «26 August» — без зависимости от ICU в webview */
export const dateLabel = (locale, date = new Date()) => {
  const day = date.getDate()
  const month = (MONTHS[locale] || MONTHS[DEFAULT_LOCALE])[date.getMonth()]
  if (locale === "uz") return `${day}-${month}`
  return `${day} ${month}`
}

const ruPlural = (count, forms) => {
  const tail = count % 10
  const hundred = count % 100
  if (tail === 1 && hundred !== 11) return forms[0]
  if (tail >= 2 && tail <= 4 && (hundred < 10 || hundred >= 20)) return forms[1]
  return forms[2]
}

/** «15 детей» / «15 bola» / «15 children» */
export const kidsWord = (locale, count) => {
  if (locale === "uz") return `${count} bola`
  if (locale === "en") return `${count} ${count === 1 ? "child" : "children"}`
  return `${count} ${ruPlural(count, ["ребёнок", "ребёнка", "детей"])}`
}

/** «3 группы» в винительном падеже: «ждём 3 группы» */
export const groupsWord = (locale, count) => {
  if (locale === "uz") return `${count} guruh`
  if (locale === "en") return `${count} ${count === 1 ? "group" : "groups"}`
  return `${count} ${ruPlural(count, ["группу", "группы", "групп"])}`
}

const RU = {
  "nav.close": "Закрыть",
  "nav.groups": "Группы",
  "nav.attendance": "Перекличка",
  "nav.language": "Язык",
  "app.closeHint": "Закрыть можно из телеграма",

  "panel.inGarden": "{kids} в саду",
  "panel.marked": "Отмечено {marked} из {total}",
  "panel.waiting": "ждём {groups}",
  "panel.allSubmitted": "все группы сдали",
  "panel.tabAll": "Все группы",
  "panel.tabPending": "Не сдали · {count}",
  "panel.sectionPending": "Ждём перекличку",
  "panel.sectionGroups": "Группы · {count}",
  "panel.rowDone": "сдано · {here} из {total} в саду",
  "panel.rowPending": "не отмечено {count} из {total}",
  "panel.loading": "Загружаем группы…",
  "panel.error": "Не удалось загрузить группы",
  "panel.emptyPending": "Все группы сдали перекличку ✓",
  "panel.emptyGroups": "К вам пока не привязана ни одна группа",
  "panel.opening": "Открываем перекличку…",
  "panel.notLinked": "Этот чат не привязан к сотруднику.",
  "panel.notLinkedHint": "Откройте перекличку из бота ещё раз.",
  "panel.chat": "Чат: {id}",
  "panel.markGroup": "Отметить · {name}",
  "panel.allDone": "Все группы сдали перекличку",
  "panel.left": "не сдали · {count}",
  "panel.groupFallback": "группа",

  "counters.present": "пришли",
  "counters.late": "опозд.",
  "counters.absent": "нет",
  "counters.unmarked": "не отм.",

  "status.present": "Пришёл",
  "status.late": "Опоздал",
  "status.absent": "Отсутствует",

  "group.fallbackName": "Группа",
  "group.savedAt": "сохранено в {time}",
  "group.allPresent": "Все пришли",
  "group.clear": "Очистить",
  "group.allPresentToast": "Все неотмеченные — «пришёл»",
  "group.search": "Поиск по имени",
  "group.listUnmarked": "Список группы · не отмечено {count}",
  "group.listAllMarked": "Список группы · все отмечены",
  "group.notMarked": "Не отмечен",
  "group.save": "Сохранить перекличку",
  "group.saving": "Сохраняем…",
  "group.saveHintPending": "Отмечено {marked} из {total} · отметьте остальных",
  "group.saveHintDone": "Отмечены все · {total}",
  "group.savedToast": "Перекличка сохранена",
  "group.loading": "Загружаем список группы…",
  "group.error": "Не удалось загрузить список группы",
  "group.emptySearch": "Никого не нашли по запросу",
  "group.empty": "В группе пока нет детей",
  "group.sessionExpired": "Сессия истекла. Откройте перекличку из бота ещё раз.",

  "reason.title": "Причина",
  "reason.titleFor": "{name} · причина",
  "reason.loading": "Загружаем причины…",
  "reason.custom": "Своя причина",
  "reason.done": "Готово",
  "reason.none": "Без указания причины",
  "reason.cancel": "Отмена",
}

const UZ = {
  "nav.close": "Yopish",
  "nav.groups": "Guruhlar",
  "nav.attendance": "Davomat",
  "nav.language": "Til",
  "app.closeHint": "Yopishni telegramdan bajaring",

  "panel.inGarden": "bog‘chada {kids}",
  "panel.marked": "{total} tadan {marked} tasi belgilandi",
  "panel.waiting": "{groups} kutilmoqda",
  "panel.allSubmitted": "barcha guruhlar topshirdi",
  "panel.tabAll": "Barcha guruhlar",
  "panel.tabPending": "Topshirmagan · {count}",
  "panel.sectionPending": "Davomat kutilmoqda",
  "panel.sectionGroups": "Guruhlar · {count}",
  "panel.rowDone": "topshirildi · {total} tadan {here} tasi bor",
  "panel.rowPending": "{total} tadan {count} tasi belgilanmagan",
  "panel.loading": "Guruhlar yuklanmoqda…",
  "panel.error": "Guruhlarni yuklab bo‘lmadi",
  "panel.emptyPending": "Barcha guruhlar davomatni topshirdi ✓",
  "panel.emptyGroups": "Sizga hali birorta guruh biriktirilmagan",
  "panel.opening": "Davomat ochilmoqda…",
  "panel.notLinked": "Bu chat xodimga biriktirilmagan.",
  "panel.notLinkedHint": "Davomatni botdan qaytadan oching.",
  "panel.chat": "Chat: {id}",
  "panel.markGroup": "Belgilash · {name}",
  "panel.allDone": "Barcha guruhlar davomatni topshirdi",
  "panel.left": "topshirmagan · {count}",
  "panel.groupFallback": "guruh",

  "counters.present": "keldi",
  "counters.late": "kechikdi",
  "counters.absent": "yo‘q",
  "counters.unmarked": "belgisiz",

  "status.present": "Keldi",
  "status.late": "Kechikdi",
  "status.absent": "Kelmadi",

  "group.fallbackName": "Guruh",
  "group.savedAt": "{time} da saqlandi",
  "group.allPresent": "Hammasi keldi",
  "group.clear": "Tozalash",
  "group.allPresentToast": "Belgilanmaganlar «keldi» qilindi",
  "group.search": "Ism bo‘yicha qidirish",
  "group.listUnmarked": "Guruh ro‘yxati · {count} tasi belgilanmagan",
  "group.listAllMarked": "Guruh ro‘yxati · hammasi belgilandi",
  "group.notMarked": "Belgilanmagan",
  "group.save": "Davomatni saqlash",
  "group.saving": "Saqlanmoqda…",
  "group.saveHintPending": "{total} tadan {marked} tasi belgilandi · qolganlarini belgilang",
  "group.saveHintDone": "Hammasi belgilandi · {total}",
  "group.savedToast": "Davomat saqlandi",
  "group.loading": "Guruh ro‘yxati yuklanmoqda…",
  "group.error": "Guruh ro‘yxatini yuklab bo‘lmadi",
  "group.emptySearch": "So‘rov bo‘yicha hech kim topilmadi",
  "group.empty": "Guruhda hali bolalar yo‘q",
  "group.sessionExpired": "Sessiya tugadi. Davomatni botdan qaytadan oching.",

  "reason.title": "Sabab",
  "reason.titleFor": "{name} · sabab",
  "reason.loading": "Sabablar yuklanmoqda…",
  "reason.custom": "Boshqa sabab",
  "reason.done": "Tayyor",
  "reason.none": "Sababsiz",
  "reason.cancel": "Bekor qilish",
}

const EN = {
  "nav.close": "Close",
  "nav.groups": "Groups",
  "nav.attendance": "Attendance",
  "nav.language": "Language",
  "app.closeHint": "You can close it from Telegram",

  "panel.inGarden": "{kids} at the kindergarten",
  "panel.marked": "Marked {marked} of {total}",
  "panel.waiting": "waiting for {groups}",
  "panel.allSubmitted": "all groups submitted",
  "panel.tabAll": "All groups",
  "panel.tabPending": "Not submitted · {count}",
  "panel.sectionPending": "Waiting for attendance",
  "panel.sectionGroups": "Groups · {count}",
  "panel.rowDone": "submitted · {here} of {total} present",
  "panel.rowPending": "{count} of {total} not marked",
  "panel.loading": "Loading groups…",
  "panel.error": "Could not load the groups",
  "panel.emptyPending": "All groups submitted attendance ✓",
  "panel.emptyGroups": "No group is assigned to you yet",
  "panel.opening": "Opening attendance…",
  "panel.notLinked": "This chat is not linked to an employee.",
  "panel.notLinkedHint": "Open attendance from the bot again.",
  "panel.chat": "Chat: {id}",
  "panel.markGroup": "Mark · {name}",
  "panel.allDone": "All groups submitted attendance",
  "panel.left": "not submitted · {count}",
  "panel.groupFallback": "group",

  "counters.present": "present",
  "counters.late": "late",
  "counters.absent": "absent",
  "counters.unmarked": "unmarked",

  "status.present": "Present",
  "status.late": "Late",
  "status.absent": "Absent",

  "group.fallbackName": "Group",
  "group.savedAt": "saved at {time}",
  "group.allPresent": "All present",
  "group.clear": "Clear",
  "group.allPresentToast": "All unmarked set to “present”",
  "group.search": "Search by name",
  "group.listUnmarked": "Group list · {count} not marked",
  "group.listAllMarked": "Group list · all marked",
  "group.notMarked": "Not marked",
  "group.save": "Save attendance",
  "group.saving": "Saving…",
  "group.saveHintPending": "Marked {marked} of {total} · mark the rest",
  "group.saveHintDone": "Everyone is marked · {total}",
  "group.savedToast": "Attendance saved",
  "group.loading": "Loading the group list…",
  "group.error": "Could not load the group list",
  "group.emptySearch": "Nobody matches the search",
  "group.empty": "There are no children in this group yet",
  "group.sessionExpired": "Session expired. Open attendance from the bot again.",

  "reason.title": "Reason",
  "reason.titleFor": "{name} · reason",
  "reason.loading": "Loading reasons…",
  "reason.custom": "Custom reason",
  "reason.done": "Done",
  "reason.none": "No reason given",
  "reason.cancel": "Cancel",
}

const DICT = { ru: RU, uz: UZ, en: EN }

/** t('panel.marked', { marked: 3, total: 8 }) — недостающий ключ падает на русский */
export const createT = (locale) => {
  const table = DICT[locale] || DICT[DEFAULT_LOCALE]

  return (key, params) => {
    const template = table[key] ?? DICT[DEFAULT_LOCALE][key] ?? key
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      params[name] === undefined ? match : String(params[name]),
    )
  }
}
