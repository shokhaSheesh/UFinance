import { makeAutoObservable } from "mobx"
import { makePersistable } from "mobx-persist-store"

// Модуль детского сада — отдельный webview для телеграм-бота.
// Бэкенда пока нет, поэтому данные живут в сторе и переживают перезагрузку.

const AVATAR_COLORS = [
  "#f0956a", "#7bc47f", "#6aa9f0", "#c58ae0",
  "#e0b45c", "#5fc4c0", "#e08a9c", "#8f9bd6",
]

const initials = (name) =>
  name.split(" ").slice(0, 2).map((word) => word[0]).join("")

const kid = (id, name, extra = {}) => ({
  id,
  name,
  initials: initials(name),
  color: AVATAR_COLORS[id % AVATAR_COLORS.length],
  status: null, // 'present' | 'late' | 'absent' | null
  reason: null, // причина только для 'absent'
  time: null,
  note: null,
  ...extra,
})

export const REASONS = {
  sick: "Болеет",
  excused: "По заявлению",
  no_notice: "Без предупреждения",
  vacation: "Отпуск",
}

export const REASON_META = {
  sick: { icon: "🤒", tone: "sick" },
  excused: { icon: "📄", tone: "late" },
  no_notice: { icon: "❗", tone: "absent" },
  vacation: { icon: "✈️", tone: "wait" },
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

export const mealsWord = (count) =>
  `${count} ${plural(count, ["порция", "порции", "порций"])}`

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
]

// Дату считаем на клиенте — экраны и так ждут монтирования
export const todayLabel = () => {
  const now = new Date()
  return `${now.getDate()} ${MONTHS[now.getMonth()]}`
}

const seedGroups = () => [
  {
    id: 1,
    name: "Ромашка",
    type: "Средняя группа",
    teacher: "Нигора Азизовна",
    submitted: false,
    at: null,
    kids: [
      kid(1, "Азизов Амир", { status: "present", time: "08:24" }),
      kid(2, "Каримова Малика", { status: "present", time: "08:26" }),
      kid(3, "Юсупов Тимур", { status: "absent", reason: "sick", note: "справка до 12.08" }),
      kid(4, "Ли Ева"),
      kid(5, "Ходжаев Санжар"),
      kid(6, "Петрова Алиса", { status: "present", time: "08:31" }),
      kid(7, "Раимов Ботир", { note: "болел на прошлой неделе" }),
      kid(8, "Собирова Дилола"),
      kid(9, "Ким Даниил"),
      kid(10, "Мирзаева Севинч"),
      kid(11, "Турпулатов Азиз"),
    ],
  },
  {
    id: 2,
    name: "Солнышко",
    type: "Старшая группа",
    teacher: "Мадина Каримовна",
    submitted: true,
    at: "08:41",
    kids: [
      kid(21, "Юлдашев Аброр", { status: "present", time: "08:20" }),
      kid(22, "Мансурова Лола", { status: "present", time: "08:22" }),
      kid(23, "Иванов Марк", { status: "present", time: "08:25" }),
      kid(24, "Эргашева Нилуфар", { status: "late", time: "09:05" }),
      kid(25, "Валиев Шохрух", { status: "absent", reason: "sick" }),
      kid(26, "Ким Ольга", { status: "present", time: "08:35" }),
      kid(27, "Джураев Феруз", { status: "present", time: "08:37" }),
      kid(28, "Ахмедова Марина", { status: "present", time: "08:40" }),
    ],
  },
  {
    id: 3,
    name: "Капельки",
    type: "Младшая группа",
    teacher: "Зухра Турсуновна",
    submitted: true,
    at: "08:52",
    kids: [
      kid(31, "Рустамов Азизбек", { status: "present", time: "08:30" }),
      kid(32, "Сайдалиева Дилноза", { status: "present", time: "08:33" }),
      kid(33, "Мансуров Улугбек", { status: "absent", reason: "excused" }),
      kid(34, "Пак Вероника", { status: "present", time: "08:36" }),
      kid(35, "Хамидов Батыр", { status: "present", time: "08:38" }),
      kid(36, "Турсаева Мадина", { status: "present", time: "08:44" }),
      kid(37, "Юсупова Зухра", { status: "late", time: "09:12" }),
      kid(38, "Бекмуродов Санат", { status: "present", time: "08:50" }),
    ],
  },
  {
    id: 4,
    name: "Звёздочки",
    type: "Подготовительная",
    teacher: "Гулнора Собировна",
    submitted: false,
    at: null,
    kids: [
      kid(41, "Абдуллаев Дониёр"),
      kid(42, "Каримов Улугбек"),
      kid(43, "Смирнова Дарья"),
      kid(44, "Нурматова Шахло"),
      kid(45, "Хасанов Иброхим"),
      kid(46, "Ли Артём"),
      kid(47, "Юсупова Гулбахор"),
      kid(48, "Турматов Отабек"),
      kid(49, "Рахимова Нигора"),
    ],
  },
  {
    id: 5,
    name: "Почемучки",
    type: "Старшая группа",
    teacher: "Дилшод Рахимович",
    submitted: false,
    at: null,
    kids: [
      kid(51, "Мухаммадиев Али"),
      kid(52, "Ким Софья"),
      kid(53, "Бабаев Тимур"),
      kid(54, "Исмоилова Робия"),
      kid(55, "Ганиев Жавохир"),
      kid(56, "Орлова Мария"),
      kid(57, "Турсунов Бехруз"),
      kid(58, "Юнусова Камола"),
    ],
  },
]

// Чистая функция, чтобы считать одинаково в списке групп и внутри переклички
export function groupStats(group) {
  const stats = { present: 0, late: 0, sick: 0, absent: 0, unmarked: 0 }

  group?.kids?.forEach((child) => {
    if (child.status === "present") stats.present += 1
    else if (child.status === "late") stats.late += 1
    else if (child.status === "absent") {
      if (child.reason === "sick") stats.sick += 1
      else stats.absent += 1
    } else stats.unmarked += 1
  })

  const total = group?.kids?.length || 0
  return {
    ...stats,
    total,
    here: stats.present + stats.late,
    marked: total - stats.unmarked,
    done: total > 0 && stats.unmarked === 0,
  }
}

// Итоги по саду: в статистику попадают только сданные группы,
// остальные дети считаются ожидающими
export function gardenTotals(groups = []) {
  const totals = {
    present: 0, late: 0, sick: 0, absent: 0,
    here: 0, counted: 0, waiting: 0, total: 0,
  }

  groups.forEach((group) => {
    const stats = groupStats(group)
    if (group.submitted) {
      totals.present += stats.present
      totals.late += stats.late
      totals.sick += stats.sick
      totals.absent += stats.absent
      totals.here += stats.here
      totals.counted += stats.total
    } else {
      totals.waiting += stats.total
    }
    totals.total += stats.total
  })

  totals.percent = totals.counted
    ? Math.round((totals.here / totals.counted) * 100)
    : 0
  return totals
}

class KindergartenStore {
  name = "Детский сад «Бахор»"
  // Идентификатор телеграм-чата из адреса — им бот привязывает сад/группу.
  // Не персистим: источник истины всегда URL, который открыл бот
  chatId = null
  groups = seedGroups()

  constructor() {
    makeAutoObservable(this)
    if (typeof window !== "undefined") {
      makePersistable(this, {
        name: "kindergarten_app",
        properties: ["groups"],
        storage: window.localStorage,
        debugMode: false,
      })
    }
  }

  setChatId(chatId) {
    this.chatId = chatId || null
  }

  getGroup(id) {
    return this.groups.find((group) => group.id === Number(id)) || null
  }

  get pendingGroups() {
    return this.groups.filter((group) => !group.submitted)
  }

  findKid(groupId, kidId) {
    return this.getGroup(groupId)?.kids.find((child) => child.id === Number(kidId)) || null
  }

  // Время прихода генерим от порядкового номера, чтобы не плодить случайность
  arrivalTime(group, child, status) {
    const index = group.kids.indexOf(child)
    if (status === "late") return `09:${String(5 + (index % 20)).padStart(2, "0")}`
    return `08:${String(20 + (index % 25)).padStart(2, "0")}`
  }

  setStatus(groupId, kidId, status) {
    const group = this.getGroup(groupId)
    const child = this.findKid(groupId, kidId)
    if (!group || !child) return

    if (child.status === status && status !== "absent") {
      child.status = null
      child.reason = null
      child.time = null
      return
    }

    child.status = status
    child.reason = null
    child.time = status === "absent" ? null : this.arrivalTime(group, child, status)
  }

  setReason(groupId, kidId, reason) {
    const child = this.findKid(groupId, kidId)
    if (!child) return
    child.status = "absent"
    child.reason = reason
    child.time = null
  }

  // Отмена выбора причины: ребёнок не должен зависнуть в «отсутствует» без причины
  cancelAbsence(groupId, kidId) {
    const child = this.findKid(groupId, kidId)
    if (child && child.status === "absent" && !child.reason) {
      child.status = null
    }
  }

  markAllPresent(groupId) {
    const group = this.getGroup(groupId)
    if (!group) return
    group.kids.forEach((child) => {
      if (!child.status) {
        child.status = "present"
        child.time = this.arrivalTime(group, child, "present")
      }
    })
  }

  clearGroup(groupId) {
    const group = this.getGroup(groupId)
    if (!group) return
    group.kids.forEach((child) => {
      child.status = null
      child.reason = null
      child.time = null
    })
    group.submitted = false
    group.at = null
  }

  submitGroup(groupId, at) {
    const group = this.getGroup(groupId)
    if (!group) return
    group.submitted = true
    group.at = at
  }

  resetAll() {
    this.groups = seedGroups()
  }
}

export const kindergartenStore = new KindergartenStore()
