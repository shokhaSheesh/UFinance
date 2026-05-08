import { indicators } from "@/store/indicatos.store"
import moment from "moment"

// Supported month abbreviations (first 3 letters) for parsing
const MONTH_ABBREVIATIONS = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек', // ru
    'yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek', // uz (latin)
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', // en
    'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек', // ru variants
]

/**
 * Extracts month from date string and returns localized month abbreviation
 * @param {string} locale - Locale code ('ru', 'uz', 'en', etc.)
 * @param {string} dateString - Date string containing month (e.g., "15 Янв 2024", "15 Jan 2024")
 * @returns {string} Localized month abbreviation (first 3 letters)
 */
export const localizeMonthTitle = (locale = 'ru', dateString) => {
    if (!dateString) return ''
    const format = `${(indicators.periodType === 'weekly') ? "DD," : ''} MMM${indicators.periodType === 'yearly' ? " 'YY" : ''}`

    const str = String(moment(dateString).format(format))
    const lowerStr = str.toLowerCase()
    let monthIndex = -1
    let matchedAbbr = ''

    // Find month abbreviation in the date string (case-insensitive)
    for (let i = 0; i < MONTH_ABBREVIATIONS.length; i++) {
        const abbr = MONTH_ABBREVIATIONS[i].toLowerCase()
        if (lowerStr.includes(abbr)) {
            monthIndex = i % 12
            matchedAbbr = MONTH_ABBREVIATIONS[i]
            break
        }
    }

    // If no month found, try to parse with Date
    if (monthIndex === -1) {
        const date = new Date(dateString)
        if (!isNaN(date.getMonth())) {
            monthIndex = date.getMonth()
        }
    }

    if (monthIndex === -1) return str

    // Get localized month name using Intl
    const date = new Date(2024, monthIndex, 1)
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short' })
    const monthName = formatter.format(date)

    // Replace only the month part, preserve the rest (day, year, punctuation)
    if (matchedAbbr) {
        const regex = new RegExp(matchedAbbr, 'gi')
        return str.replace(regex, monthName.slice(0, 3))
    }

    // If no specific abbreviation matched, return with localized month
    return monthName.slice(0, 3)
}

/**
 * Legacy function - kept for backward compatibility
 */
const RU_MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export const localizeMonthTitleLegacy = (title, monthsArr) => {
    if (!title) return ''
    let result = String(title)
    RU_MONTHS_SHORT.forEach((ru, i) => {
        if (monthsArr?.[i]) result = result.replace(ru, monthsArr[i])
    })
    return result
}
