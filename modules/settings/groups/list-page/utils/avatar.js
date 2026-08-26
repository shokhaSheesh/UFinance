// Палитра и инициалы для аватарок ответственных — тот же приём,
// что в списках счетов и контрагентов
const AVATAR_COLORS = [
  '#f0956a', '#7bc47f', '#6aa9f0', '#c58ae0',
  '#e0b45c', '#5fc4c0', '#e08a9c', '#8f9bd6',
]

export const initialsOf = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

// Цвет закрепляем за guid, чтобы он не прыгал между рендерами
export const colorOf = (key) => {
  const source = String(key || '')
  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash + source.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]
}
