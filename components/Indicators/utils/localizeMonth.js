const RU_MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export const localizeMonthTitle = (title, monthsArr) => {
    if (!title) return ''
    let result = String(title)
    RU_MONTHS_SHORT.forEach((ru, i) => {
        if (monthsArr?.[i]) result = result.replace(ru, monthsArr[i])
    })
    return result
}
