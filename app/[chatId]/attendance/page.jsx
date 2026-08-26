"use client"

import MiniAppNav from "@/components/attendance/MiniAppNav"
import { useMiniApp } from "@/components/attendance/MiniAppProvider"
import StatusCounters from "@/components/attendance/StatusCounters"
import { useAttendanceGroups, useAttendanceSession } from "@/hooks/useAttendance"
import {
  gardenTotals,
  groupsWord,
  groupStats,
  kidsWord,
  todayLabel,
} from "@/store/attendance.store"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/navigation"
import { useState } from "react"

const AVATAR_COLORS = [
  "#f0956a", "#7bc47f", "#6aa9f0", "#c58ae0",
  "#e0b45c", "#5fc4c0", "#e08a9c", "#8f9bd6",
]

// Цвет аватара по guid — стабильный между рендерами и перезагрузками
const colorOf = (id = "") => {
  let sum = 0
  for (let index = 0; index < id.length; index += 1) sum += id.charCodeAt(index)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

// Панель рахбара: его группы и то, где перекличка ещё не сдана.
// Данные — get_attendance_groups, статистика за день считается на бэкенде.
export default observer(function AttendancePanel() {
  const router = useRouter()
  const { chatId, link } = useMiniApp()
  const [tab, setTab] = useState("groups")

  const session = useAttendanceSession(chatId)
  const { groups, totals, isLoading, error } = useAttendanceGroups({
    enabled: session.isReady,
  })

  const stats = gardenTotals(totals || {})
  const pending = groups.filter((group) => groupStats(group).unmarked > 0)
  const visibleGroups = tab === "pending" ? pending : groups

  // Пока не знаем, кто перед нами, показывать нечего
  if (session.isLoading) {
    return (
      <>
        <MiniAppNav title="Перекличка" />
        <div className="k-scroll">
          <div className="k-empty">Открываем перекличку…</div>
        </div>
      </>
    )
  }

  if (!chatId || session.error || !session.isReady) {
    return (
      <>
        <MiniAppNav title="Перекличка" />
        <div className="k-scroll">
          <div className="k-empty">
            Этот чат не привязан к сотруднику.
            <br />
            Откройте перекличку из бота ещё раз.
          </div>
          <div className="k-hint">Чат: {chatId || "—"}</div>
        </div>
      </>
    )
  }

  const firstPending = pending[0]

  return (
    <>
      <MiniAppNav title={`Перекличка · ${todayLabel()}`} />

      <div className="k-scroll k-scroll--with-footer">
        <div className="k-top">
          <div className="k-title">{kidsWord(stats.here)} в саду</div>
          <div className="k-sub">
            Отмечено {stats.marked} из {stats.total} ·{" "}
            {pending.length ? `ждём ${groupsWord(pending.length)}` : "все группы сдали"}
          </div>
          <StatusCounters stats={stats} />
        </div>

        <div className="k-tabs">
          <span
            className={`k-tab ${tab === "groups" ? "k-tab--on" : ""}`}
            onClick={() => setTab("groups")}
          >
            Все группы
          </span>
          <span
            className={`k-tab ${tab === "pending" ? "k-tab--on" : ""}`}
            onClick={() => setTab("pending")}
          >
            Не сдали · {pending.length}
          </span>
        </div>

        <div className="k-sec-title">
          {tab === "pending" ? "Ждём перекличку" : `Группы · ${groups.length}`}
        </div>

        <div className="k-list">
          {visibleGroups.map((group) => {
            const groupId = group.counterparties_group_id
            const rowStats = groupStats(group)
            const name = group.nazvanie_gruppy || "Без названия"

            return (
              <button
                key={groupId}
                type="button"
                className="k-row k-row--tap"
                onClick={() => router.push(link(`/group/${groupId}`))}
              >
                <div className="k-ava" style={{ background: colorOf(groupId) }}>
                  {name[0]}
                </div>

                <div className="k-kid">
                  <div className="k-kid__n">{name}</div>
                  <div className={`k-kid__s ${rowStats.done ? "" : "k-kid__s--alert"}`}>
                    {rowStats.done
                      ? `сдано · ${rowStats.here} из ${rowStats.total} в саду`
                      : `не отмечено ${rowStats.unmarked} из ${rowStats.total}`}
                  </div>
                </div>

                <span className={`k-pill ${rowStats.done ? "k-pill--ok" : "k-pill--wait"}`}>
                  {rowStats.marked ? rowStats.here : "—"}/{rowStats.total}
                </span>
                <span className="k-chev">›</span>
              </button>
            )
          })}

          {isLoading && <div className="k-empty">Загружаем группы…</div>}

          {!isLoading && error && (
            <div className="k-empty">Не удалось загрузить группы. Потяните позже.</div>
          )}

          {!isLoading && !error && !visibleGroups.length && (
            <div className="k-empty">
              {tab === "pending"
                ? "Все группы сдали перекличку ✓"
                : "К вам пока не привязана ни одна группа"}
            </div>
          )}
        </div>

        {/* Подсказка для сверки привязки при подключении бота */}
        <div className="k-hint">Чат: {chatId}</div>
      </div>

      <div className="k-footer">
        <button
          type="button"
          className="k-mainbtn"
          disabled={!firstPending}
          onClick={() =>
            router.push(link(`/group/${firstPending.counterparties_group_id}`))
          }
        >
          {firstPending
            ? `Отметить · ${firstPending.nazvanie_gruppy || "группа"}`
            : "Все группы сдали перекличку"}
          {firstPending && (
            <small>
              осталось {groupsWord(pending.length)}
            </small>
          )}
        </button>
      </div>
    </>
  )
})
