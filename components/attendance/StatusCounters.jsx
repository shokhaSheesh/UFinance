"use client"

import { useMiniApp } from "./MiniAppProvider"

// Четыре счётчика статусов — одинаковые на панели групп и внутри переклички.
// Статусы бэкенда: present / late / absent, плюс «не отмечено».
export default function StatusCounters({ stats }) {
  const { t } = useMiniApp()

  const cells = [
    { key: "ok", value: stats.present, label: t("counters.present") },
    { key: "late", value: stats.late, label: t("counters.late") },
    { key: "absent", value: stats.absent, label: t("counters.absent") },
    { key: "wait", value: stats.unmarked, label: t("counters.unmarked") },
  ]

  return (
    <div className="k-counters">
      {cells.map((cell) => (
        <div key={cell.key} className={`k-cnt k-cnt--${cell.key}`}>
          <div className="k-cnt__v">{cell.value}</div>
          <div className="k-cnt__l">{cell.label}</div>
        </div>
      ))}
    </div>
  )
}
