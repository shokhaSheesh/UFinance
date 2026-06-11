export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function formatPhone998(raw) {
  let digits = String(raw || '').replace(/\D/g, '')
  if (!digits.startsWith('998')) digits = '998' + digits.replace(/^998/, '')
  digits = digits.slice(0, 12)
  let result = '+998'
  const rest = digits.slice(3)
  if (rest.length > 0) result += ' (' + rest.slice(0, 2)
  if (rest.length >= 2) result += ')'
  if (rest.length > 2) result += ' ' + rest.slice(2, 5)
  if (rest.length > 5) result += ' ' + rest.slice(5, 7)
  if (rest.length > 7) result += ' ' + rest.slice(7, 9)
  return result
}

export function isValidPhone998(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('998')
}
