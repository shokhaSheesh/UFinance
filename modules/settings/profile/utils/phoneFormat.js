export const formatPhoneNumber = (value) => {
  const digits = value?.replace(/[^\d]/g, '') || ''

  if (!value?.startsWith('+998')) {
    return '+998'
  }

  const limitedDigits = digits.slice(0, 12)

  if (limitedDigits.length <= 3) {
    return '+998'
  } else if (limitedDigits.length <= 5) {
    return `+998 ${limitedDigits.slice(3)}`
  } else if (limitedDigits.length <= 8) {
    return `+998 ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5)}`
  } else if (limitedDigits.length <= 10) {
    return `+998 ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5, 8)} ${limitedDigits.slice(8)}`
  } else {
    return `+998 ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5, 8)} ${limitedDigits.slice(8, 10)} ${limitedDigits.slice(10)}`
  }
}

export const getCleanPhoneNumber = (formattedPhone) =>
  formattedPhone?.replace(/[^\d]/g, '') || ''

export const formatInitialPhone = (rawPhone) => {
  if (!rawPhone) return '+998'
  const digits = String(rawPhone)?.replace(/[^\d]/g, '') || ''
  if (!digits) return '+998'
  const withPrefix = digits?.startsWith('998') ? `+${digits}` : `+998${digits}`
  return formatPhoneNumber(withPrefix)
}
