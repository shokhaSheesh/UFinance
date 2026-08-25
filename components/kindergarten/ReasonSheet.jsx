"use client"

import { REASON_META, REASONS } from "@/store/kindergarten.store"

// Шторка выбора причины отсутствия: открывается сразу после тапа по «крестику»
export default function ReasonSheet({ kid, onSelect, onCancel }) {
  const isOpen = Boolean(kid)

  return (
    <>
      <div className={`k-scrim ${isOpen ? "k-scrim--on" : ""}`} onClick={onCancel} />

      <div className={`k-sheet ${isOpen ? "k-sheet--on" : ""}`}>
        <div className="k-sheet__grab" />
        <div className="k-sheet__h">{kid ? `${kid.name} · причина` : "Причина"}</div>

        {Object.entries(REASONS).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="k-sheet__opt"
            onClick={() => onSelect(value)}
          >
            <span className={`k-sheet__ic k-pill k-pill--${REASON_META[value].tone}`}>
              {REASON_META[value].icon}
            </span>
            {label}
          </button>
        ))}

        <button
          type="button"
          className="k-sheet__opt"
          style={{ color: "var(--k-hint)" }}
          onClick={onCancel}
        >
          <span className="k-sheet__ic k-pill k-pill--wait">↩️</span>
          Отмена
        </button>
      </div>
    </>
  )
}
