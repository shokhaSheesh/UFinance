import { makeAutoObservable } from "mobx"

// Стор webview переклички. Сессию (user/company/branch) отдаёт
// get_attendance_bot_chat по chat_id из адреса, отметки держим в памяти:
// после перезагрузки они всё равно приедут с сервера.

export const STATUSES = { present: "present", late: "late", absent: "absent" }

// Русские подписи статусов — на бэкенд уходят только канонические значения
export const STATUS_LABEL = {
  present: "Пришёл",
  late: "Опоздал",
  absent: "Отсутствует",
}

export const plural = (count, forms) => {
  const tail = count % 10
  const hundred = count % 100
  if (tail === 1 && hundred !== 11) return forms[0]
  if (tail >= 2 && tail <= 4 && (hundred < 10 || hundred >= 20)) return forms[1]
  return forms[2]
}

export const kidsWord = (count) =>
  `${count} ${plural(count, ["ребёнок", "ребёнка", "детей"])}`

export const groupsWord = (count) =>
  `${count} ${plural(count, ["группу", "группы", "групп"])}`

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
]

export const todayLabel = () => {
  const now = new Date()
  return `${now.getDate()} ${MONTHS[now.getMonth()]}`
}

// Бэкенд считает «сегодня» по Asia/Tashkent — тем же часовым поясом живёт и клиент
export const todayISO = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  return parts
}

const timeLabel = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

// Язык мини-аппа переживает перезагрузку webview: телеграм открывает его
// заново на каждый тап по кнопке бота
const LANG_STORAGE_KEY = "attendance_lang"

class AttendanceStore {
  // приходит из /:chatId/attendance
  chatId = null
  // язык интерфейса: приходит из get_attendance_bot_chat, дальше — выбор пользователя
  language = "ru"
  // пользователь выбрал язык сам — ответ бота больше его не перебивает
  languageTouched = false
  // выдаёт get_attendance_bot_chat
  userId = null
  companyId = null
  branchId = null

  // отметки текущей сессии: { [groupId]: { [counterpartiesId]: { status, description } } }
  marks = {}
  // группы, которые уже засеяли серверными данными: `${groupId}|${date}`
  seeded = {}
  // время последнего успешного сохранения: `${groupId}|${date}` → "08:41"
  savedAt = {}

  constructor() {
    makeAutoObservable(this)
  }

  get isReady() {
    return Boolean(this.userId)
  }

  setChatId(chatId) {
    this.chatId = chatId || null
  }

  // Язык из ответа бота — только пока пользователь не выбрал свой
  setSessionLanguage(code) {
    if (!code || this.languageTouched) return
    this.language = code
  }

  setLanguage(code) {
    if (!code) return
    this.language = code
    this.languageTouched = true
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, code)
      } catch {
        // приватный режим webview — переживём, язык останется на сессию
      }
    }
  }

  // Читается после монтирования: на сервере localStorage нет, а чтение
  // языка прямо в рендере разошлось бы с серверной разметкой
  readSavedLanguage() {
    if (typeof window === "undefined") return null
    try {
      return window.localStorage.getItem(LANG_STORAGE_KEY)
    } catch {
      return null
    }
  }

  setSession({ userId, companyId, branchId } = {}) {
    this.userId = userId || null
    this.companyId = companyId || null
    this.branchId = branchId || null
  }

  // Общие поля scope для всех методов переклички
  get scope() {
    const scope = {}
    if (this.userId) scope.user_id = this.userId
    if (this.companyId) scope.company_id = this.companyId
    if (this.branchId) scope.branch_id = this.branchId
    return scope
  }

  marksOf(groupId) {
    return this.marks[groupId] || {}
  }

  markOf(groupId, counterpartiesId) {
    return this.marksOf(groupId)[counterpartiesId] || null
  }

  hasMarks(groupId) {
    return Object.keys(this.marksOf(groupId)).length > 0
  }

  // Первая загрузка группы за день: переносим уже сохранённые статусы в черновик.
  // Повторный вход (например, возврат к списку групп) правки не затирает.
  seedGroup(groupId, date, rows) {
    const key = `${groupId}|${date}`
    if (this.seeded[key]) return
    this.seeded[key] = true

    const next = {}
    rows.forEach((row) => {
      if (row?.status) {
        next[row.counterparties_id] = {
          status: row.status,
          description: row.description || "",
        }
      }
    })
    this.marks[groupId] = next
  }

  setMark(groupId, counterpartiesId, status, description = "") {
    if (!this.marks[groupId]) this.marks[groupId] = {}
    const current = this.marks[groupId][counterpartiesId]

    // повторный тап по тому же статусу снимает отметку
    if (current?.status === status && status !== STATUSES.absent) {
      delete this.marks[groupId][counterpartiesId]
      return
    }

    this.marks[groupId][counterpartiesId] = { status, description }
  }

  setDescription(groupId, counterpartiesId, description = "") {
    const current = this.markOf(groupId, counterpartiesId)
    if (!current) return
    this.marks[groupId][counterpartiesId] = { ...current, description }
  }

  clearMark(groupId, counterpartiesId) {
    if (this.marks[groupId]) delete this.marks[groupId][counterpartiesId]
  }

  markAllPresent(groupId, rows) {
    if (!this.marks[groupId]) this.marks[groupId] = {}
    rows.forEach((row) => {
      if (!this.marks[groupId][row.counterparties_id]) {
        this.marks[groupId][row.counterparties_id] = {
          status: STATUSES.present,
          description: "",
        }
      }
    })
  }

  clearGroup(groupId) {
    this.marks[groupId] = {}
  }

  // Отметка «сохранено» — показываем время до того, как обновятся счётчики с сервера
  markSaved(groupId, date) {
    this.savedAt[`${groupId}|${date}`] = timeLabel()
  }

  savedTime(groupId, date) {
    return this.savedAt[`${groupId}|${date}`] || null
  }

  // Полезная нагрузка для create_attendance
  attendancesPayload(groupId) {
    return Object.entries(this.marksOf(groupId)).map(([counterpartiesId, mark]) => ({
      counterparties_id: counterpartiesId,
      status: mark.status,
      description: mark.description || "",
    }))
  }
}

export const attendanceStore = new AttendanceStore()

// Счётчики по строкам списка с учётом локальных отметок
export function countMarks(rows, marks) {
  const stats = { present: 0, late: 0, absent: 0, unmarked: 0 }

  rows.forEach((row) => {
    const status = marks[row.counterparties_id]?.status
    if (status === STATUSES.present) stats.present += 1
    else if (status === STATUSES.late) stats.late += 1
    else if (status === STATUSES.absent) stats.absent += 1
    else stats.unmarked += 1
  })

  const total = rows.length
  return {
    ...stats,
    total,
    here: stats.present + stats.late,
    marked: total - stats.unmarked,
    done: total > 0 && stats.unmarked === 0,
  }
}

// Счётчики группы из ответа get_attendance_groups (сервер уже всё посчитал)
export function groupStats(group = {}) {
  const present = group.present_count || 0
  const late = group.late_count || 0
  const absent = group.absent_count || 0
  const total = group.counterparties_count || 0
  const marked = group.marked_count ?? present + late + absent

  return {
    present,
    late,
    absent,
    total,
    marked,
    unmarked: group.not_marked_count ?? Math.max(total - marked, 0),
    here: present + late,
    done: total > 0 && marked >= total,
  }
}

// Итог по всем группам заведения из totals ответа get_attendance_groups
export function gardenTotals(totals = {}) {
  return groupStats({
    present_count: totals.present_count,
    late_count: totals.late_count,
    absent_count: totals.absent_count,
    counterparties_count: totals.counterparties_count,
    marked_count: totals.marked_count,
    not_marked_count: totals.not_marked_count,
  })
}
