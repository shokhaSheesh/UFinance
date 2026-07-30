/**
 * Дизайн-токены детальной страницы бюджета.
 * Палитра берётся из дизайн-системы проекта (styles/_variables.scss):
 * синий $primary #0e73f6, бирюзовый акцент $accent #1e98ad, серые из $gray-*.
 * Геометрия (ширины/высоты) — под сводную таблицу бюджета.
 */

export const BUDGET_TOKENS = {
  // Геометрия
  titleColWidth: 280,
  cellWidth: 112,
  rowHeight: 40,
  headerFirstRowHeight: 56,
  headerSecondRowHeight: 34,
  cellPadX: 12,
  indentBase: 20,
  indentStep: 20,

  // Палитра (значения из _variables.scss)
  text: '#344054', // $gray-700 — основной текст ячеек
  textHeading: '#101828', // $gray-900 — заголовки
  textMuted: '#667085', // $gray-500 — приглушённый текст
  border: '#eaecf0', // $gray-200 — тонкие линии внутри группы периода
  borderStrong: '#d0d5dd', // $gray-300 — границы между группами периодов
  planValue: '#0e73f6', // $primary — плановые значения
  accent: '#1e98ad', // $accent — акцент (чекбоксы, активная граница)
  danger: '#ef4444', // $danger — удаление
  positive: '#16a34a', // $success-dark — положительные отклонения
  negative: '#dc2626', // $danger-dark — отрицательные отклонения
  pillBg: '#f1f5f9', // $slate-100 — чипы (тип/период/валюта)
  white: '#ffffff'
}

/**
 * Фоны строк и ячеек — классами Tailwind, а не инлайном: иначе инлайн-стиль
 * перебивает `group-hover` и строка не подсвечивается под курсором.
 */
export const BUDGET_ROW_CLASSES = {
  // обычная статья
  leaf: 'bg-white group-hover:bg-[#f0f6ff]',
  // раздел верхнего уровня (Доходы / Расходы / потоки)
  section: 'bg-[#f9fafb] group-hover:bg-[#eef4ff]',
  // расчётные строки (прибыль, рентабельность, остатки)
  result: 'bg-[#f2f4f7] group-hover:bg-[#e8effa]',
  // редактируемая плановая ячейка
  editable: 'bg-[#eff6ff] hover:bg-[#dceafd]',
  // шапка: нижняя строка «План / Факт / …»
  headerSub: 'bg-[#f9fafb]'
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
