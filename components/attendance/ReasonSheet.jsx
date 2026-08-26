"use client"

import { useAbsenceReasons } from "@/hooks/useAttendance"
import { useState } from "react"

// Шторка причины отсутствия. Список тянем из справочника компании
// (Настройки → Причины отсутствия), выбранный или вписанный текст
// уходит в description строки create_attendance.
export default function ReasonSheet({ kid, onSelect, onCancel }) {
  const isOpen = Boolean(kid)
  const { reasons, isLoading } = useAbsenceReasons()
  const [custom, setCustom] = useState("")
  const [shownKidId, setShownKidId] = useState(null)

  // на каждого ребёнка — своё поле, иначе прошлый текст остаётся в шторке
  const kidId = kid?.counterparties_id || null
  if (kidId !== shownKidId) {
    setShownKidId(kidId)
    setCustom(kid?.description || "")
  }

  return (
    <>
      <div className={`k-scrim ${isOpen ? "k-scrim--on" : ""}`} onClick={onCancel} />

      <div className={`k-sheet ${isOpen ? "k-sheet--on" : ""}`}>
        <div className="k-sheet__grab" />
        <div className="k-sheet__h">{kid ? `${kid.nazvanie} · причина` : "Причина"}</div>

        {isLoading && <div className="k-sheet__empty">Загружаем причины…</div>}

        {!isLoading &&
          reasons.map((reason) => (
            <button
              key={reason.guid}
              type="button"
              className="k-sheet__opt"
              onClick={() => onSelect(reason.description)}
            >
              <span className="k-sheet__ic k-pill--sick">📝</span>
              {reason.description}
            </button>
          ))}

        <div className="k-sheet__input">
          <input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="Своя причина"
            onKeyDown={(event) => {
              if (event.key === "Enter" && custom.trim()) onSelect(custom.trim())
            }}
          />
          <button type="button" disabled={!custom.trim()} onClick={() => onSelect(custom.trim())}>
            Готово
          </button>
        </div>

        {/* без причины тоже можно — description останется пустым */}
        <button type="button" className="k-sheet__opt" onClick={() => onSelect("")}>
          <span className="k-sheet__ic k-pill--absent">✕</span>
          Без указания причины
        </button>

        <button
          type="button"
          className="k-sheet__opt"
          style={{ color: "var(--k-hint)" }}
          onClick={onCancel}
        >
          <span className="k-sheet__ic k-pill--wait">↩︎</span>
          Отмена
        </button>
      </div>
    </>
  )
}
