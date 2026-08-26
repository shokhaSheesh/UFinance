"use client"

import MiniAppNav from "@/components/attendance/MiniAppNav"
import { useMiniApp } from "@/components/attendance/MiniAppProvider"
import ReasonSheet from "@/components/attendance/ReasonSheet"
import StatusCounters from "@/components/attendance/StatusCounters"
import {
  useAttendanceSession,
  useGroupCounterparties,
  useSaveAttendance,
} from "@/hooks/useAttendance"
import {
  attendanceStore,
  countMarks,
  STATUS_LABEL,
  STATUSES,
  todayISO,
  todayLabel,
} from "@/store/attendance.store"
import { observer } from "mobx-react-lite"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
const CrossIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)
const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const STATUS_DOT = {
  present: "var(--k-ok)",
  late: "var(--k-late)",
  absent: "var(--k-absent)",
}

const AVATAR_COLORS = [
  "#f0956a", "#7bc47f", "#6aa9f0", "#c58ae0",
  "#e0b45c", "#5fc4c0", "#e08a9c", "#8f9bd6",
]

const colorOf = (id = "") => {
  let sum = 0
  for (let index = 0; index < id.length; index += 1) sum += id.charCodeAt(index)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?"

// Подпись под именем: статус черновика и причина, если её указали
const rowSubtitle = (mark) => {
  if (!mark) return { color: "var(--k-hint)", text: "Не отмечен" }
  const label = STATUS_LABEL[mark.status] || "Отмечен"
  return {
    color: STATUS_DOT[mark.status] || "var(--k-hint)",
    text: mark.description ? `${label} · ${mark.description}` : label,
  }
}

// Перекличка группы: статусы правим локально, кнопка внизу отправляет
// весь список одним create_attendance (upsert — повтор не создаёт дублей).
export default observer(function RollCallPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast, haptic, link, chatId } = useMiniApp()

  const [search, setSearch] = useState("")
  const [sheetKidId, setSheetKidId] = useState(null)

  const groupId = params?.id ? String(params.id) : null
  const day = todayISO()

  // при перезагрузке webview сессии в сторе ещё нет — поднимаем её по chat_id
  const session = useAttendanceSession(chatId)
  const { rows, groupName, isLoading, error } = useGroupCounterparties(groupId, {
    date: day,
    enabled: session.isReady,
  })
  const { save, isSaving } = useSaveAttendance()

  const marks = attendanceStore.marksOf(groupId)
  const stats = countMarks(rows, marks)
  const savedAt = attendanceStore.savedTime(groupId, day)

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) =>
      `${row.nazvanie || ""} ${row.polnoe_imya || ""}`.toLowerCase().includes(query),
    )
  }, [rows, search])

  const sheetKid = sheetKidId
    ? rows.find((row) => row.counterparties_id === sheetKidId)
    : null

  const handleStatus = (row, status) => {
    haptic("light")
    const id = row.counterparties_id
    attendanceStore.setMark(groupId, id, status, marks[id]?.description || "")

    // «отсутствует» сразу спрашивает причину — она уйдёт в description
    if (status === STATUSES.absent) setSheetKidId(id)
  }

  const handleReason = (description) => {
    attendanceStore.setMark(groupId, sheetKidId, STATUSES.absent, description)
    setSheetKidId(null)
  }

  // отмена в шторке снимает и саму отметку отсутствия
  const handleCancelReason = () => {
    attendanceStore.clearMark(groupId, sheetKidId)
    setSheetKidId(null)
  }

  const handleSave = async () => {
    try {
      await save({ groupId, date: day })
      haptic("medium")
      showToast(
        stats.done
          ? "Перекличка сохранена"
          : `Сохранено: отмечено ${stats.marked} из ${stats.total}`,
      )
      router.push(link())
    } catch (saveError) {
      // текст ошибки метода показывает общий обработчик мутации
      if (saveError?.message) showToast(saveError.message)
    }
  }

  if (!session.isLoading && !session.isReady) {
    return (
      <>
        <MiniAppNav title="Перекличка" backLabel="Группы" backHref={link()} />
        <div className="k-scroll">
          <div className="k-empty">
            Сессия истекла. Откройте перекличку из бота ещё раз.
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <MiniAppNav
        title={groupName || "Перекличка"}
        backLabel="Группы"
        backHref={link()}
      />

      <div className="k-scroll k-scroll--with-footer">
        <div className="k-top">
          <div className="k-title">
            {groupName || "Группа"} · {todayLabel()}
          </div>
          <div className="k-sub">
            {stats.total} детей
            {savedAt ? ` · сохранено в ${savedAt}` : ""}
          </div>

          <StatusCounters stats={stats} />

          <div className="k-quick">
            <button
              type="button"
              className="k-quick__btn"
              onClick={() => {
                attendanceStore.markAllPresent(groupId, rows)
                showToast("Все неотмеченные — «пришёл»")
              }}
              disabled={!stats.unmarked}
            >
              Все пришли
            </button>
            <button
              type="button"
              className="k-quick__btn"
              onClick={() => attendanceStore.clearGroup(groupId)}
              disabled={!stats.marked}
            >
              Очистить
            </button>
          </div>
        </div>

        <div className="k-search">
          <span>🔍</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по имени"
          />
        </div>

        <div className="k-sec-title">
          Список группы
          {stats.unmarked ? ` · не отмечено ${stats.unmarked}` : " · все отмечены"}
        </div>

        <div className="k-list">
          {filteredRows.map((row) => {
            const id = row.counterparties_id
            const mark = marks[id]
            const subtitle = rowSubtitle(mark)

            return (
              <div key={id} className="k-row">
                <div className="k-ava" style={{ background: colorOf(id) }}>
                  {initialsOf(row.nazvanie)}
                </div>

                <div className="k-kid">
                  <div className="k-kid__n">{row.nazvanie}</div>
                  <div className="k-kid__s">
                    <span className="k-dot" style={{ background: subtitle.color }} />
                    {subtitle.text}
                  </div>
                </div>

                <div className="k-seg">
                  <button
                    type="button"
                    className={`k-seg__b ${mark?.status === STATUSES.present ? "k-seg__b--on-ok" : ""}`}
                    onClick={() => handleStatus(row, STATUSES.present)}
                    aria-label="Пришёл"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    type="button"
                    className={`k-seg__b ${mark?.status === STATUSES.absent ? "k-seg__b--on-absent" : ""}`}
                    onClick={() => handleStatus(row, STATUSES.absent)}
                    aria-label="Отсутствует"
                  >
                    <CrossIcon />
                  </button>
                  <button
                    type="button"
                    className={`k-seg__b ${mark?.status === STATUSES.late ? "k-seg__b--on-late" : ""}`}
                    onClick={() => handleStatus(row, STATUSES.late)}
                    aria-label="Опоздал"
                  >
                    <ClockIcon />
                  </button>
                </div>
              </div>
            )
          })}

          {isLoading && <div className="k-empty">Загружаем список группы…</div>}

          {!isLoading && error && (
            <div className="k-empty">Не удалось загрузить список группы</div>
          )}

          {!isLoading && !error && !filteredRows.length && (
            <div className="k-empty">
              {search ? "Никого не нашли по запросу" : "В группе пока нет детей"}
            </div>
          )}
        </div>
      </div>

      <div className="k-footer">
        <button
          type="button"
          className="k-mainbtn"
          disabled={!stats.marked || isSaving}
          onClick={handleSave}
        >
          {isSaving ? "Сохраняем…" : "Сохранить перекличку"}
          <small>
            Отмечено {stats.marked} из {stats.total}
            {stats.unmarked ? " · остальных можно отметить позже" : ""}
          </small>
        </button>
      </div>

      <ReasonSheet
        kid={sheetKid ? { ...sheetKid, description: marks[sheetKidId]?.description } : null}
        onSelect={handleReason}
        onCancel={handleCancelReason}
      />
    </>
  )
})
