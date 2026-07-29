/**
 * Дизайн-токены детальной страницы бюджета.
 * Палитра берётся из дизайн-системы проекта (styles/_variables.scss):
 * синий $primary #0e73f6, бирюзовый акцент $accent #1e98ad, серые из $gray-*.
 * Геометрия (ширины/высоты) — под сводную таблицу бюджета.
 */

export const BUDGET_TOKENS = {
  // Геометрия
  titleColWidth: 265,
  cellWidth: 100,
  rowHeight: 36,
  headerFirstRowHeight: 61,
  headerSecondRowHeight: 36,
  indentBase: 20,
  indentStep: 20,

  // Палитра (значения из _variables.scss)
  text: '#475467', // $gray-600 — основной текст ячеек
  textHeading: '#0f172a', // $slate-900 — заголовки
  textMuted: '#667085', // $gray-500 — приглушённый текст
  border: '#eaecf0', // $gray-200 — границы
  borderStrong: '#d0d5dd', // $gray-300 — сильные границы / инпуты
  planValue: '#0e73f6', // $primary — плановые значения
  accent: '#1e98ad', // $accent — акцент (чекбоксы, активная граница)
  danger: '#ef4444', // $danger — удаление
  editableBg: 'rgba(30, 152, 173, 0.04)', // лёгкая заливка редактируемой ячейки
  hoverBg: '#f9fafb', // $gray-50 — hover строки
  pillBg: '#f1f5f9', // $slate-100 — чипы (тип/период/валюта)
  white: '#ffffff'
}

/** Колонки внутри одной группы периода. `plan` включена всегда. */
export const COLUMN_DEFS = [
  { key: 'plan', alwaysOn: true },
  { key: 'fact', master: true },
  { key: 'planExec', dependsOn: 'fact' },
  { key: 'deviation', dependsOn: 'fact' },
  { key: 'deviationPct', dependsOn: 'fact' }
]

export const GROUPING_OPTIONS = ['months', 'quarters', 'years']
