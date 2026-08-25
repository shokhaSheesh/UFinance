"use client"

import MiniAppNav from "@/components/kindergarten/MiniAppNav"
import { useMiniApp } from "@/components/kindergarten/MiniAppProvider"
import useMounted from "@/hooks/useMounted"
import { gardenTotals, kindergartenStore } from "@/store/kindergarten.store"
import { observer } from "mobx-react-lite"
import { useState } from "react"

const PERIODS = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "range", label: "Период" },
]

// Историю посещаемости бэкенд пока не отдаёт — держим демо-ряд,
// последний столбец подставляем из фактических данных дня
const HISTORY = [
  { day: "Пн", value: 72 },
  { day: "Вт", value: 86 },
  { day: "Ср", value: 92 },
  { day: "Чт", value: 88 },
  { day: "Пт", value: 64 },
  { day: "Пн", value: 78 },
]

const ATTENTION = [
  { id: 1, initials: "РБ", color: "#f0956a", name: "Раимов Ботир", note: "Пропустил 9 дней подряд", pill: "Болеет", tone: "sick" },
  { id: 2, initials: "ХС", color: "#e0b45c", name: "Ходжаев Санжар", note: "4 пропуска без предупреждения", pill: "Риск", tone: "absent" },
]

export default observer(function ReportsPage() {
  const mounted = useMounted()
  const { showToast, link } = useMiniApp()
  const [period, setPeriod] = useState("month")

  if (!mounted) return null

  const totals = gardenTotals(kindergartenStore.groups)
  const bars = [...HISTORY, { day: "Вт", value: totals.percent }]

  return (
    <>
      <MiniAppNav title="Отчёты" backLabel="Панель" backHref={link()} />

      <div className="k-scroll k-scroll--with-footer">
        <div className="k-tabs">
          {PERIODS.map((item) => (
            <span
              key={item.key}
              className={`k-tab ${period === item.key ? "k-tab--on" : ""}`}
              onClick={() => setPeriod(item.key)}
            >
              {item.label}
            </span>
          ))}
        </div>

        <div className="k-kpi">
          <div className="k-kpi__card">
            <div className="k-kpi__card-v">87%</div>
            <div className="k-kpi__card-l">Средняя посещаемость</div>
            <div className="k-kpi__card-d">▲ 4% к июлю</div>
          </div>
          <div className="k-kpi__card">
            <div className="k-kpi__card-v">{totals.percent}%</div>
            <div className="k-kpi__card-l">Сегодня в саду</div>
            <div className="k-kpi__card-d k-kpi__card-d--muted">
              {totals.here} из {totals.counted} отмеченных
            </div>
          </div>
        </div>

        <div className="k-sec-title">Посещаемость по дням</div>
        <div className="k-chart">
          <div className="k-bars">
            {bars.map((bar, index) => (
              <div className="k-bar" key={`${bar.day}-${index}`}>
                <i style={{ height: `${Math.max(bar.value, 4)}%` }} />
                <span>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="k-sec-title">Требуют внимания</div>
        <div className="k-list">
          {ATTENTION.map((item) => (
            <div className="k-row" key={item.id}>
              <div className="k-ava" style={{ background: item.color }}>
                {item.initials}
              </div>
              <div className="k-kid">
                <div className="k-kid__n">{item.name}</div>
                <div className="k-kid__s">{item.note}</div>
              </div>
              <span className={`k-pill k-pill--${item.tone}`}>{item.pill}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="k-footer">
        <button
          type="button"
          className="k-mainbtn"
          onClick={() => showToast("Файл отправлен в чат")}
        >
          Выгрузить Excel · отправить в чат
        </button>
      </div>
    </>
  )
})
