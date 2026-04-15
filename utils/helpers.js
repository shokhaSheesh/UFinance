import { toJS } from "mobx"
import { appStore } from "../store/app.store"

// ── Format helpers ──────────────────────────────────────────
export const formatDateRu = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
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

export const formatAmount = (v) => {
  if (v === null || v === undefined || v === '') return '0'
  const raw = String(v).replace(/\s/g, '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(raw);
  if (isNaN(num)) return '0'
  return num.toLocaleString('ru-RU')
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

export const calculatePercent = (totalAmount, minAmount) => {
  const total = parseFloat(Number(totalAmount) || 0)
  const received = parseFloat(Number(minAmount) || 0)

  if (total === 0) return '0%'
  const percent = (received / total) * 100
  return Math.round(percent) + '%'
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

export const formatTotalSumma = (summa) => {
  if (isNaN(summa) || summa == 0) return ''
  const num = Number(summa).toFixed(2)
  return num.toLocaleString('ru-RU')
}


//  format number with thousand separators

export function formatNumber(value) {
	// strip everything except digits and dot
	const clean = String(value).replace(/[^\d.-]/g, '')

	// keep only the first dot
	const parts = clean.split('.')
	const intPart = parts[0] || ''
	const decPart = parts.length > 1 ? '.' + parts[1] : ''

	// add thousand separators to the integer part only
	const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

	return formatted + decPart.slice(0, 3)
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
