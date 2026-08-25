"use client"

// Четыре счётчика статусов — одинаковые на панели сада и внутри переклички
export default function StatusCounters({ stats }) {
  const cells = [
    { key: "ok", value: stats.present, label: "пришли" },
    { key: "late", value: stats.late, label: "опозд." },
    { key: "sick", value: stats.sick, label: "болеют" },
    { key: "absent", value: stats.absent, label: "нет" },
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
