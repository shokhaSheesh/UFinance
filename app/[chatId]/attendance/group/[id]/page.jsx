"use client"

import MiniAppNav from "@/components/kindergarten/MiniAppNav"
import { useMiniApp } from "@/components/kindergarten/MiniAppProvider"
import ReasonSheet from "@/components/kindergarten/ReasonSheet"
import StatusCounters from "@/components/kindergarten/StatusCounters"
import useMounted from "@/hooks/useMounted"
import { groupStats, kindergartenStore, REASONS, todayLabel } from "@/store/kindergarten.store"
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
  sick: "var(--k-sick)",
  absent: "var(--k-absent)",
}

function kidSubtitle(child) {
  if (child.status === "present") return { color: STATUS_DOT.present, text: `Пришёл · ${child.time}` }
  if (child.status === "late") return { color: STATUS_DOT.late, text: `Опоздал · ${child.time}` }
  if (child.status === "absent") {
    const color = child.reason === "sick" ? STATUS_DOT.sick : STATUS_DOT.absent
    const text = REASONS[child.reason || "no_notice"] + (child.note ? ` · ${child.note}` : "")
    return { color, text }
  }
  return { color: "var(--k-hint)", text: child.note || "Не отмечен" }
}

export default observer(function RollCallPage() {
  const mounted = useMounted()
  const router = useRouter()
  const params = useParams()
  const { showToast, haptic, link } = useMiniApp()

  const [search, setSearch] = useState("")
  const [sheetKidId, setSheetKidId] = useState(null)

  const groupId = Number(params?.id)
  const group = mounted ? kindergartenStore.getGroup(groupId) : null

  const filteredKids = useMemo(() => {
    if (!group) return []
    const query = search.trim().toLowerCase()
    if (!query) return group.kids
    return group.kids.filter((child) => child.name.toLowerCase().includes(query))
  }, [group, search])

  if (!mounted) return null

  if (!group) {
    return (
      <>
        <MiniAppNav title="Перекличка" backLabel="Группы" backHref={link()} />
        <div className="k-scroll">
          <div className="k-empty">Группа не найдена</div>
        </div>
      </>
    )
  }

  const stats = groupStats(group)
  const sheetKid = sheetKidId ? group.kids.find((child) => child.id === sheetKidId) : null

  const handleStatus = (child, status) => {
    haptic("light")
    if (status === "absent") {
      kindergartenStore.setStatus(group.id, child.id, "absent")
      setSheetKidId(child.id)
      return
    }
    kindergartenStore.setStatus(group.id, child.id, status)
  }

  const handleReason = (reason) => {
    kindergartenStore.setReason(group.id, sheetKidId, reason)
    setSheetKidId(null)
  }

  const handleCancelReason = () => {
    kindergartenStore.cancelAbsence(group.id, sheetKidId)
    setSheetKidId(null)
  }

  return (
    <>
      <MiniAppNav title="Перекличка" backLabel="Группы" backHref={link()} />

      <div className="k-scroll k-scroll--with-footer">
        <div className="k-top">
          <div className="k-title">
            {group.name} · {todayLabel()}
          </div>
          <div className="k-sub">
            {group.type} · {stats.total} детей
            {group.submitted ? ` · сдано в ${group.at}` : ""}
          </div>

          <StatusCounters stats={stats} />

          <div className="k-quick">
            <button
              type="button"
              className="k-quick__btn"
              onClick={() => {
                kindergartenStore.markAllPresent(group.id)
                showToast("Все неотмеченные — «пришёл»")
              }}
              disabled={stats.unmarked === 0}
            >
              Все пришли
            </button>
            <button
              type="button"
              className="k-quick__btn"
              onClick={() => kindergartenStore.clearGroup(group.id)}
              disabled={stats.marked === 0}
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
          {filteredKids.map((child) => {
            const subtitle = kidSubtitle(child)
            return (
              <div key={child.id} className="k-row">
                <div className="k-ava" style={{ background: child.color }}>
                  {child.initials}
                </div>

                <div className="k-kid">
                  <div className="k-kid__n">{child.name}</div>
                  <div className="k-kid__s">
                    <span className="k-dot" style={{ background: subtitle.color }} />
                    {subtitle.text}
                  </div>
                </div>

                <div className="k-seg">
                  <button
                    type="button"
                    className={`k-seg__b ${child.status === "present" ? "k-seg__b--on-ok" : ""}`}
                    onClick={() => handleStatus(child, "present")}
                    aria-label="Пришёл"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    type="button"
                    className={`k-seg__b ${child.status === "absent" ? "k-seg__b--on-absent" : ""}`}
                    onClick={() => handleStatus(child, "absent")}
                    aria-label="Отсутствует"
                  >
                    <CrossIcon />
                  </button>
                  <button
                    type="button"
                    className={`k-seg__b ${child.status === "late" ? "k-seg__b--on-late" : ""}`}
                    onClick={() => handleStatus(child, "late")}
                    aria-label="Опоздал"
                  >
                    <ClockIcon />
                  </button>
                </div>
              </div>
            )
          })}

          {!filteredKids.length && <div className="k-empty">Никого не нашли по запросу</div>}
        </div>
      </div>

      <div className="k-footer">
        <button
          type="button"
          className="k-mainbtn"
          disabled={!stats.done}
          onClick={() => router.push(link(`/group/${group.id}/confirm`))}
        >
          {group.submitted ? "Сохранить изменения" : "Сохранить перекличку"}
          <small>
            Отмечено {stats.marked} из {stats.total}
          </small>
        </button>
      </div>

      <ReasonSheet kid={sheetKid} onSelect={handleReason} onCancel={handleCancelReason} />
    </>
  )
})
