
export const formatDate = (date) => {
  // Handle null/undefined
  if (!date) return ''

  // Convert to Date object if it's a string
  const dateObj = date instanceof Date ? date : new Date(date)

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return ''

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDateTime = (date) => {
  if (!date) return ''

  const dateObj = new Date(date)

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return ''

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} | ${hours}:${minutes}`
}

export const formatedToday = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


export const formatDateFormat = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) return '';

  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};



export const todayDate = new Date().getDate()

export const isToday = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
}

export const isFuture = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()

  // Compare year, month, and day to check if date is in the future
  if (date.getFullYear() > today.getFullYear()) return true
  if (date.getFullYear() < today.getFullYear()) return false

  if (date.getMonth() > today.getMonth()) return true
  if (date.getMonth() < today.getMonth()) return false

  if (date.getDate() > today.getDate()) return true

  return false
}

export const isBefore = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date() 
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function isPastDate(date) {
  if (!date) return false

  // Parse YYYY-MM-DD format
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return false

  // Get year, month, day from input date (using local time to match input intent)
  const inputYear = parsed.getFullYear()
  const inputMonth = parsed.getMonth()
  const inputDay = parsed.getDate()

  // Get today's year, month, day
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()

  // Compare year first, then month, then day
  if (inputYear < todayYear) return true
  if (inputYear > todayYear) return false
  if (inputMonth < todayMonth) return true
  if (inputMonth > todayMonth) return false
  return inputDay < todayDay
}


export const formatStudentTableDate = (monthString) => {
  if (!monthString) return ''

  const [month, year] = monthString.split('.')
  if (!month || !year) return monthString

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const monthIndex = parseInt(month, 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return monthString

  return `${monthNames[monthIndex]} ${year}`
}

export function toISOStringFromDate(dateStr) {
  console.log('dateStr', dateStr)
  return new Date(dateStr).toISOString();
}
