
import { toJS } from "mobx"
import moment from "moment"
import { appStore } from "../store/app.store"

// ── Format helpers ──────────────────────────────────────────
export const formatDateRu = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}



export const FormatDateRu = (dateStr) => {
  if (!dateStr) return ''
  const formated = dateStr
  const [year, month, day] = formated.split('-')
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  return `${parseInt(day)} ${months[parseInt(month) - 1]}, ${year}`
}


export const formatPeriod = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  const d1 = new Date(startDate);
  const d2 = new Date(endDate);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';

  const shortMonths = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  const d1Day = String(d1.getDate()).padStart(2, '0');
  const d2Day = String(d2.getDate()).padStart(2, '0');

  const d1Month = shortMonths[d1.getMonth()];
  const d2Month = shortMonths[d2.getMonth()];

  const d1Year = String(d1.getFullYear()).slice(-2);
  const d2Year = String(d2.getFullYear()).slice(-2);

  if (d1Year !== d2Year) {
    return `${d1Day} ${d1Month} '${d1Year} – ${d2Day} ${d2Month} '${d2Year}`;
  } else {
    return `${d1Day} ${d1Month} – ${d2Day} ${d2Month} '${d2Year}`;
  }
}

// ── Деньги ───────────────────────────────────────────────────────────────────
// «Отображать копейки» (show_cents из get_general_settings). Выключено —
// суммы округляются до целого, включено — всегда две цифры после разделителя.
// Разделитель разрядов — неразрывный пробел, дробной части — точка (как в ПланФакте).
const NBSP = '\u00A0'

export const isShowCents = () => Boolean(appStore?.interfaceSettings?.showCents)

// Приводит к числу и строку с пробелами/запятой («11 734,5»), и готовое число
export const toAmountNumber = (v) => {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const raw = String(v)
    .replace(/[\s\u00A0]/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')
  const num = parseFloat(raw)
  return Number.isNaN(num) ? null : num
}

const groupDigits = (intPart) => String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)

/**
 * Разбивает сумму на целую и дробную часть: ПланФакт печатает копейки более
 * мелким шрифтом, поэтому части нужны по отдельности (см. components/shared/Money).
 * `cents` перекрывает настройку — для мест, где формат задан жёстко.
 */
export const splitAmount = (v, { cents } = {}) => {
  const num = toAmountNumber(v)
  if (num === null) return { sign: '', int: '0', dec: '' }
  const withCents = cents === undefined ? isShowCents() : Boolean(cents)
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  if (!withCents) return { sign, int: groupDigits(Math.round(abs)), dec: '' }
  const [int, dec] = abs.toFixed(2).split('.')
  return { sign, int: groupDigits(int), dec }
}

export const formatAmount = (v, options) => {
  const { sign, int, dec } = splitAmount(v, options)
  return dec ? `${sign}${int}.${dec}` : `${sign}${int}`
}


export const formatPercent = (totalAmount, minAmount) => {

  const n = parseFloat(Number(minAmount) || 0)
  if (!minAmount || isNaN(n)) return ''
  return (Number(totalAmount) * Number(minAmount) / 100).toLocaleString('ru-RU') + '%'
}

export const handlePercentBackspace = (e, currentValue, onChange) => {
  if (e.key === 'Backspace') {
    e.preventDefault();
    const val = String(currentValue || '');
    onChange(val.slice(0, -1));
  }
}

export const formatAmountWithPercent = (v) => {
  if (!v) return ''
  const raw = v?.replace(/%/g, '')?.replace(/\D/g, '')?.slice(0, 2);
  const n = parseFloat(raw);
  if (!v || isNaN(n)) return ''
  return n.toLocaleString('ru-RU')
}

export const calculatePercent = (totalAmount, minAmount, withPersent = true) => {
  const total = parseFloat(Number(totalAmount) || 0)
  const received = parseFloat(Number(minAmount) || 0)

  if (total === 0) return '0%'
  const percent = (received / total) * 100
  return Math.round(percent) + (withPersent ? '%' : '')
}


export const returnNumber = (text) => {
  if (!text) return ''
  const raw = text
    .replace(/\s/g, '')
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*?)\..*/g, '$1') // keep only first dot
  const num = parseFloat(raw)
  return num
}



export const StringtoNumber = (text) => {
  if (!text) return ''
  const raw = String(text).replace(/\s/g, '').replace(/[^0-9.]/g, '');
  const num = parseFloat(raw);
  if (isNaN(num)) return ''
  return num
}


export const getCurrencyIcon = (currency) => {
  return toJS(appStore.currencies.find(c => c.guid === currency))
}

// Число знаков после точки задаёт «Отображать копейки», а не аргумент:
// параметр `fixed` оставлен ради совместимости со старыми вызовами.
export const formatTotalSumma = (summa, fixed) => {
  if (isNaN(summa) || summa == 0) return ''
  const decimals = isShowCents() ? 2 : 0
  return Number(summa).toFixed(decimals)
}


//  format number with thousand separators

export function formatNumber(value) {
  let s = String(value).trim();

  // remember the sign, then keep only digits, comma, dot
  const negative = s.startsWith('-');
  s = s.replace(/[^\d.,]/g, '');

  // the LAST comma or dot is the decimal separator; everything else is grouping
  const lastSep = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));

  let intPart, decPart;
  if (lastSep === -1) {
    intPart = s;
    decPart = '';
  } else {
    intPart = s.slice(0, lastSep).replace(/[.,]/g, ''); // drop grouping separators
    decPart = s.slice(lastSep + 1).replace(/\D/g, '');  // digits only
  }

  // group the integer part with spaces
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // keep your 2-decimal limit
  const dec = decPart ? '.' + decPart.slice(0, 2) : '';

  return (negative ? '-' : '') + (grouped || '') + dec;
}

/**
 * Разделители дробной части. Кроме точки, запятой и слэша сюда входят «б» и «ю»:
 * в русской раскладке их дают клавиши «,» и «.» английской, и по привычке
 * набирают именно их. «Ё» — клавиша «~», её в дробях не бывает, поэтому не берём.
 */
const DECIMAL_SEPARATORS = /[.,/бБюЮ]/g

// Форматирование ввода суммы: любой разделитель даёт ОДНУ десятичную точку
// (напр. вставка «2/3» → «2.3», ввод «2ю5» в русской раскладке → «2.5»);
// незавершённая точка сохраняется, чтобы можно было продолжать ввод
// («2.» → «2.» → «2.3»); группировка — пробелами, до 2 знаков.
export function formatAmountInput(value) {
  let s = String(value ?? '')
  const negative = s.trim().startsWith('-')
  // все разделители → точка, затем оставляем только цифры и точки
  s = s.replace(DECIMAL_SEPARATORS, '.').replace(/[^\d.]/g, '')

  // десятичный разделитель — только ПЕРВАЯ точка; лишние точки убираем
  const firstDot = s.indexOf('.')
  let intPart
  let decPart
  const hasDot = firstDot !== -1
  if (!hasDot) {
    intPart = s
    decPart = ''
  } else {
    intPart = s.slice(0, firstDot).replace(/\./g, '')
    decPart = s.slice(firstDot + 1).replace(/\./g, '')
  }

  // группировка целой части пробелами
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  // точку сохраняем даже без знаков после неё (незавершённый ввод), максимум 2 знака
  const dec = hasDot ? '.' + decPart.slice(0, 2) : ''

  return (negative ? '-' : '') + (grouped || '') + dec
}

export function includeNumber(value) {
  // strip everything except digits and dot
  const clean = String(value).replace(/[^\d.-]/g, '')

  return clean
}

export function handleInput(e) {
  const raw = e.target.value
  const cursor = e.target.selectionStart
  // count real digits+dot before the cursor (ignoring commas)
  const before = raw.slice(0, cursor).replace(/,/g, '').length

  e.target.value = formatNumber(raw)

  // walk the new string and restore cursor at the same logical position
  let newPos = 0,
    count = 0
  for (let i = 0; i < e.target.value.length; i++) {
    if (e.target.value[i] !== ',') count++
    if (count === before) {
      newPos = i + 1
      break
    }
  }
  e.target.setSelectionRange(newPos, newPos)
}

export function formatDecimal(num, decimalPlaces = 2) {
  return parseFloat(Number(num).toFixed(decimalPlaces))
}

export const handleDownload = (pdfurl, name) => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('a')
    link.href = pdfurl
    link.target = '_blank'
    link.download = name || 'contract.pdf'
    link.click()
    resolve(true)
  })
}
export const formatPhoneNumber = (value) => {
  // Remove all non-digits except the leading +
  const digits = value.replace(/[^\d]/g, '')

  // Always start with +998
  if (!value.startsWith('+998')) {
    return '+998'
  }

  // Limit to 12 digits total (+998 + 9 digits)
  const limitedDigits = digits.slice(0, 12)

  // Apply mask: +998 XX XXX XX XX
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

export const getCleanPhoneNumber = (formattedPhone) => {
  return formattedPhone.replace(/[^\d]/g, '')
}



export const getMonthPeriods = (startDate, endDate) => {
  const months = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

  const current = new Date(start.getFullYear(), start.getMonth(), 1)

  while (current <= end) {
    const year = current.getFullYear()
    const month = current.getMonth()
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const lastDay = new Date(year, month + 1, 0).getDate()

    months.push({
      key,
      title: `${monthNames[month]} ${year}`,
      startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    })

    current.setMonth(current.getMonth() + 1)
  }

  return months
}


export function getPeriodLength(fromDate, toDate, unit = 'months') {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (isNaN(from) || isNaN(to)) {
    throw new Error('Invalid date');
  }

  const diffMs = to - from;

  switch (unit) {
    case 'ms': return diffMs;
    case 'seconds': return Math.floor(diffMs / 1000);
    case 'minutes': return Math.floor(diffMs / (1000 * 60));
    case 'hours': return Math.floor(diffMs / (1000 * 60 * 60));
    case 'days': return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'weeks': return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case 'months': {
      let months = (to.getFullYear() - from.getFullYear()) * 12;
      months += to.getMonth() - from.getMonth();
      if (to.getDate() < from.getDate()) months--;
      return months;
    }
    case 'years': {
      let years = to.getFullYear() - from.getFullYear();
      const m = to.getMonth() - from.getMonth();
      if (m < 0 || (m === 0 && to.getDate() < from.getDate())) years--;
      return years;
    }
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}


export const isUUID = (str) => {
  if (typeof str !== 'string') return false
  const regex = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/i
  return regex.test(str)
}


export const formatValueLength = (val, billion, million, thousand) => {
  if (!val && val !== 0) return '0'
  const abs = Math.abs(val)
  if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} ${billion}`
  if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} ${million}`
  if (abs >= 1_000) return `${(val / 1_000).toFixed(0)} ${thousand}`
  return formatNumber(val)
}


export const formatDateParseZone = (date) => {
  return moment.parseZone(date).format('YYYY-MM-DD')
}