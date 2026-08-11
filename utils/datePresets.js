/**
 * Диапазоны дат для пресетов календаря («Сегодня», «Этот квартал», …).
 *
 * Живёт отдельно от компонента, потому что этими же диапазонами задаются
 * значения по умолчанию в сторах отчётов — расчёт должен совпадать с тем,
 * что кнопка пресета выставляет вручную.
 *
 * Кварталы здесь сезонные: зима (дек–фев), весна (мар–май), лето (июн–авг),
 * осень (сен–ноя).
 *
 * @param {string} key - yesterday | today | prev_week | week | prev_month |
 *                       month | prev_quarter | quarter | prev_year | year
 * @returns {[Date|null, Date|null]} [начало, конец]
 */
export const getPresetRange = (key) => {

  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const dow = (today.getDay() + 6) % 7 // Mon=0

  switch (key) {
    case 'today':
      return [today, today]
    case 'yesterday': {
      const yd = new Date(y, m, d - 1)
      return [yd, yd]
    }
    case 'prev_week': {
      const start = new Date(y, m, d - dow - 7)
      const end = new Date(y, m, d - dow - 1)
      return [start, end]
    }
    case 'week': {
      const start = new Date(y, m, d - dow)
      return [start, today]
    }
    case 'prev_month': {
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0)
      return [start, end]
    }
    case 'month':
      return [new Date(y, m, 1), today]
    case 'prev_quarter': {
      // Seasonal: Winter(11,0,1), Spring(2,3,4), Summer(5,6,7), Autumn(8,9,10)
      let qStartMonth;
      let qYear = y;
      if (m === 11 || m === 0 || m === 1) { // Winter
        qStartMonth = 11;
        if (m < 2) qYear -= 1;
      } else if (m >= 2 && m <= 4) qStartMonth = 2; // Spring
      else if (m >= 5 && m <= 7) qStartMonth = 5; // Summer
      else qStartMonth = 8; // Autumn

      const start = new Date(qYear, qStartMonth - 3, 1)
      const end = new Date(qYear, qStartMonth, 0)
      return [start, end]
    }
    case 'quarter': {
      let qStartMonth;
      let qYear = y;
      if (m === 11 || m === 0 || m === 1) { // Winter
        qStartMonth = 11;
        if (m < 2) qYear -= 1;
      } else if (m >= 2 && m <= 4) qStartMonth = 2; // Spring
      else if (m >= 5 && m <= 7) qStartMonth = 5; // Summer
      else qStartMonth = 8; // Autumn

      const start = new Date(qYear, qStartMonth, 1)
      const end = new Date(qYear, qStartMonth + 3, 0)
      return [start, end]
    }
    case 'prev_year': {
      const start = new Date(y - 1, 0, 1)
      const end = new Date(y - 1, 11, 31)
      return [start, end]
    }
    case 'year':
      return [new Date(y, 0, 1), new Date(y, 11, 31)]
    default:
      return [null, null]
  }
}
