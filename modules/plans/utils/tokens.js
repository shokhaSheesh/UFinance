/**
 * Дизайн-токены сводной таблицы бюджета.
 *
 * Значения сняты с эталона — ПланФакт (app.planfact.io, страницы БДДС и БДР),
 * с фактических computed styles их таблицы:
 *   .budgetRow                  высота строки 36px
 *   .budgetRow-title            265px, padding 0 20px, border-right 1px #ededed
 *   .budgetRow-cells-cellGroup  border-left 2px #ededed (разделитель периодов)
 *   .budgetRow-cells-cellGroup__firstRow   61px, flex column, items-end, center
 *   .budgetRow-cells-cellGroup__secondRow  36px, border-top 2px #ededed
 *   .budgetRow-cells-cellGroup__cell       100px, padding-right 10px, text-right
 *   ..._cell_available          background rgba(31,152,173,.03)
 *   ..._cell_available:hover    box-shadow inset 0 0 0 1px #1f98ad
 * Типографика — Roboto 12px/17.14px, текст #3f3f3f, заголовки #333.
 */

export const BUDGET_TOKENS = {
  // Геометрия
  titleColWidth: 265,
  cellWidth: 100,
  rowHeight: 36,
  headerFirstRowHeight: 61,
  headerSecondRowHeight: 36,
  /** Отступ значения от правой границы ячейки — в ПланФакт только справа. */
  cellPadRight: 10,
  titlePadX: 20,
  indentBase: 20,
  indentStep: 20,
  /** Ширина svg кнопки «свернуть/развернуть» (визуальный квадрат 13×13). */
  expanderWidth: 15,
  expanderGap: 3,
  /** Высота строки внутри верхней части шапки (год / квартал / месяц). */
  headLineHeight: 19,

  // Типографика
  fontSize: 12,
  lineHeight: '17px',
  headSubLineHeight: '14px',
  entityFontSize: 16,

  // Палитра
  text: '#3f3f3f', // основной текст ячеек и статей
  textHeading: '#333333', // заголовки периодов и юрлица
  textMuted: '#3f3f3f', // ПланФакт не приглушает подписи колонок
  border: '#ededed', // все тонкие линии таблицы
  borderStrong: '#ededed', // тот же цвет, но толще — между периодами
  /** Горизонтальная линия внутри шапки периода (над строкой «План / Факт …»). */
  groupBorderWidth: 2,
  /** Вертикальный разделитель между секциями-периодами (Итого | Июнь | …). */
  sectionBorderWidth: 4,
  iconStroke: '#999999', // обводка и штрихи иконок ±
  accent: '#1f98ad', // бирюзовый: рамка активной плановой ячейки
  accentWash: 'rgba(31, 152, 173, 0.03)', // фон планируемых ячеек
  danger: '#ef4444',
  positive: '#16a34a', // положительное отклонение
  negative: '#dc2626', // отрицательное отклонение
  pillBg: '#f1f5f9', // чипы (тип / период / валюта)
  white: '#ffffff'
}

/**
 * Фоны строк — классами Tailwind, а не инлайном, чтобы работали состояния
 * (`hover:`). В ПланФакт строки не зебрятся и не подсвечиваются под курсором:
 * единственный цветной элемент таблицы — планируемая ячейка.
 */
export const BUDGET_ROW_CLASSES = {
  // обычная статья
  leaf: 'bg-white',
  // раздел верхнего уровня (Доходы / Расходы / потоки)
  section: 'bg-white',
  // расчётные строки (прибыль, рентабельность, остатки)
  result: 'bg-white',
  // планируемая плановая ячейка: бирюзовая заливка + рамка под курсором
  editable:
    'bg-[rgba(31,152,173,0.03)] cursor-pointer hover:shadow-[inset_0_0_0_1px_#1f98ad]',
  // шапка: нижняя строка «План / Факт / …»
  headerSub: 'bg-white'
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
