"use client"

import MiniAppNav from "@/components/kindergarten/MiniAppNav"
import { useMiniApp } from "@/components/kindergarten/MiniAppProvider"
import useMounted from "@/hooks/useMounted"
import { groupStats, kindergartenStore, mealsWord, todayLabel } from "@/store/kindergarten.store"
import { observer } from "mobx-react-lite"
import { useParams, useRouter } from "next/navigation"

const firstAndLast = (name) => name.split(" ").slice(0, 2).join(" ")

const SummaryRow = ({ color, title, names, pill, tone }) => (
  <div className="k-row">
    <span className="k-dot" style={{ width: 10, height: 10, background: color }} />
    <div className="k-kid">
      <div className="k-kid__n">{title}</div>
      {names !== undefined && <div className="k-kid__s">{names || "—"}</div>}
    </div>
    <span className={`k-pill k-pill--${tone}`}>{pill}</span>
  </div>
)

// Экран проверки: воспитатель видит итог до отправки в систему сада
export default observer(function ConfirmPage() {
  const mounted = useMounted()
  const router = useRouter()
  const params = useParams()
  const { showToast, link } = useMiniApp()

  const groupId = Number(params?.id)
  const group = mounted ? kindergartenStore.getGroup(groupId) : null

  if (!mounted) return null

  if (!group) {
    return (
      <>
        <MiniAppNav title="Проверьте данные" backLabel="Группы" backHref={link()} />
        <div className="k-scroll">
          <div className="k-empty">Группа не найдена</div>
        </div>
      </>
    )
  }

  const stats = groupStats(group)
  const namesOf = (predicate) =>
    group.kids.filter(predicate).map((child) => firstAndLast(child.name)).join(", ")

  const handleSubmit = () => {
    const now = new Date()
    const at = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    kindergartenStore.submitGroup(group.id, at)
    showToast("Отправлено в систему сада")
    router.push(link())
  }

  return (
    <>
      <MiniAppNav
        title="Проверьте данные"
        backLabel="Назад"
        backHref={link(`/group/${group.id}`)}
      />

      <div className="k-scroll k-scroll--with-footer">
        <div className="k-done">
          <div className="k-done__circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="k-title">
            {stats.done
              ? `Все ${stats.total} детей отмечены`
              : `Отмечено ${stats.marked} из ${stats.total}`}
          </div>
          <div className="k-sub">
            {group.name} · {todayLabel()}
          </div>
        </div>

        <div className="k-sec-title">Итог дня</div>
        <div className="k-list">
          <SummaryRow color="var(--k-ok)" title="Присутствуют" pill={stats.present} tone="ok" />
          <SummaryRow
            color="var(--k-late)"
            title="Опоздали"
            names={namesOf((child) => child.status === "late")}
            pill={stats.late}
            tone="late"
          />
          <SummaryRow
            color="var(--k-sick)"
            title="Болеют"
            names={namesOf((child) => child.status === "absent" && child.reason === "sick")}
            pill={stats.sick}
            tone="sick"
          />
          <SummaryRow
            color="var(--k-absent)"
            title="Нет по другим причинам"
            names={namesOf((child) => child.status === "absent" && child.reason !== "sick")}
            pill={stats.absent}
            tone="absent"
          />
        </div>

        <div className="k-sec-title">Питание на сегодня</div>
        <div className="k-list">
          <div className="k-row">
            <div className="k-kid">
              <div className="k-kid__n">Порций на группу</div>
              <div className="k-kid__s">по факту присутствия</div>
            </div>
            <span className="k-pill k-pill--ok">{mealsWord(stats.here)}</span>
          </div>
        </div>
      </div>

      <div className="k-footer">
        <button type="button" className="k-mainbtn" onClick={handleSubmit}>
          Отправить в систему сада
        </button>
      </div>
    </>
  )
})
