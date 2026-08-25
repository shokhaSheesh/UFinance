"use client"

import MiniAppNav from "@/components/kindergarten/MiniAppNav"
import { useMiniApp } from "@/components/kindergarten/MiniAppProvider"
import StatusCounters from "@/components/kindergarten/StatusCounters"
import useMounted from "@/hooks/useMounted"
import {
  gardenTotals,
  groupsWord,
  groupStats,
  kidsWord,
  kindergartenStore,
} from "@/store/kindergarten.store"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/navigation"
import { useState } from "react"

const AVATAR_COLORS = ["#f0956a", "#7bc47f", "#6aa9f0", "#c58ae0", "#e0b45c", "#5fc4c0", "#e08a9c", "#8f9bd6"]

const shortTeacher = (fullName) => {
  const [first, second] = fullName.split(" ")
  return second ? `${first} ${second[0]}.` : first
}

// Панель заведующей: видно, кто уже сдал перекличку, а кого ещё ждём
export default observer(function KindergartenPanel() {
  const mounted = useMounted()
  const router = useRouter()
  const { showToast, link } = useMiniApp()
  const [tab, setTab] = useState("groups")

  if (!mounted) return null

  const groups = kindergartenStore.groups
  const totals = gardenTotals(groups)
  const pending = kindergartenStore.pendingGroups
  const visibleGroups = tab === "pending" ? pending : groups

  const handleRemind = () => {
    if (!pending.length) return
    showToast(`Напоминание отправлено · ${pending.length}`)
  }

  return (
    <>
      <MiniAppNav title={kindergartenStore.name} />

      <div className="k-scroll k-scroll--with-footer">
        <div className="k-top">
          <div className="k-title">{kidsWord(totals.here)} в саду</div>
          <div className="k-sub">
            Отмечено {totals.counted} из {totals.total} ·{" "}
            {pending.length ? `ждём ${groupsWord(pending.length)}` : "все группы сдали"}
          </div>
          <StatusCounters stats={totals} />
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
          <span className="k-tab" onClick={() => router.push(link("/reports"))}>
            Отчёты
          </span>
        </div>

        <div className="k-sec-title">
          {tab === "pending" ? "Ждём перекличку" : `Группы · ${groups.length}`}
        </div>

        <div className="k-list">
          {visibleGroups.map((group) => {
            const stats = groupStats(group)
            return (
              <button
                key={group.id}
                type="button"
                className="k-row k-row--tap"
                onClick={() => router.push(link(`/group/${group.id}`))}
              >
                <div
                  className="k-ava"
                  style={{ background: AVATAR_COLORS[group.id % AVATAR_COLORS.length] }}
                >
                  {group.name[0]}
                </div>

                <div className="k-kid">
                  <div className="k-kid__n">{group.name}</div>
                  <div className={`k-kid__s ${group.submitted ? "" : "k-kid__s--alert"}`}>
                    {shortTeacher(group.teacher)} ·{" "}
                    {group.submitted ? `сдано ${group.at}` : "не сдано"}
                  </div>
                </div>

                <span className={`k-pill ${group.submitted ? "k-pill--ok" : "k-pill--wait"}`}>
                  {group.submitted ? stats.here : "—"}/{stats.total}
                </span>
                <span className="k-chev">›</span>
              </button>
            )
          })}

          {!visibleGroups.length && (
            <div className="k-empty">
              Все группы сдали перекличку ✓
              <br />
              Напоминать некому
            </div>
          )}
        </div>

        {/* Подсказка для сверки привязки при подключении бота */}
        <div className="k-hint">Чат: {kindergartenStore.chatId || "—"}</div>
      </div>

      <div className="k-footer">
        <button
          type="button"
          className="k-mainbtn"
          onClick={handleRemind}
          disabled={!pending.length}
        >
          {pending.length
            ? `Напомнить группам, кто не сдал · ${pending.length}`
            : "Все группы сдали перекличку"}
        </button>
      </div>
    </>
  )
})
