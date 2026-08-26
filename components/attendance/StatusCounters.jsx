"use client"

// Четыре счётчика статусов — одинаковые на панели групп и внутри переклички.
// Статусы бэкенда: present / late / absent, плюс «не отмечено».
export default function StatusCounters({ stats }) {
  const cells = [
    { key: "ok", value: stats.present, label: "пришли" },
    { key: "late", value: stats.late, label: "опозд." },
    { key: "absent", value: stats.absent, label: "нет" },
    { key: "wait", value: stats.unmarked, label: "не отм." },
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
