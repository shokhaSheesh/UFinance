/**
 * Значок ИИ-помощника — три контурные искры (большая и две маленькие).
 * Один на всё приложение: кнопка ИИ на компьютере, кнопка в нижней панели
 * телефона и шапка чата. Цвет — currentColor.
 */

// четырёхлучевая искра с вогнутыми сторонами
const spark = (cx, cy, r) => {
  const k = r * 0.2
  return [
    `M${cx} ${cy - r}`,
    `Q${cx + k} ${cy - k} ${cx + r} ${cy}`,
    `Q${cx + k} ${cy + k} ${cx} ${cy + r}`,
    `Q${cx - k} ${cy + k} ${cx - r} ${cy}`,
    `Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`,
  ].join(' ')
}

const PATH = [spark(9, 12.5, 6.8), spark(18, 5.8, 3.4), spark(18, 18.2, 3.4)].join(' ')

const AiSparkIcon = ({ size = 24, strokeWidth = 1.9, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
    <path d={PATH} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
  </svg>
)

export default AiSparkIcon
