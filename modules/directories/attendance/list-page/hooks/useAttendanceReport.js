'use client'

import { useUcodeRequestQuery } from '@/hooks/useDashboard'

// Отчёт по посещаемости за период. Единственный метод семейства davomat,
// который требует авторизацию: company_id/branch_id берутся из токена,
// передавать их в теле нельзя.
export function useAttendanceReport({ fromDate, toDate, groupIds, search, page = 1, limit = 100 }) {
  const query = useUcodeRequestQuery({
    method: 'get_attendance_report',
    data: {
      from_date: fromDate,
      to_date: toDate,
      counterparties_group_ids: groupIds?.length ? groupIds : null,
      search: search || '',
      page,
      limit,
    },
    skip: !fromDate || !toDate,
    querySetting: {
      select: (response) => ({
        rows: response?.data?.data || [],
        pagination: response?.data?.pagination || null,
        // totals приходит рядом с pagination, но у части ответов лежит внутри data
        totals: response?.data?.totals || response?.data?.data?.totals || null,
      }),
    },
  })

  return {
    rows: query.data?.rows || [],
    pagination: query.data?.pagination,
    totals: query.data?.totals,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

/** Дни месяца с подписью дня недели и признаком выходного */
export function buildDays(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const date = new Date(year, month, day)
    const weekday = date.getDay()

    return {
      day,
      // ISO без часовых поясов: сравниваем со строками из API как есть
      iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      label: WEEKDAYS[weekday],
      isWeekend: weekday === 0 || weekday === 6,
    }
  })
}

/** Плоская карта дата → отметка, чтобы не искать по массиву на каждой ячейке */
export function buildAttendanceMap(attendances = []) {
  const map = {}
  attendances.forEach((item) => {
    if (item?.date) map[item.date] = item
  })
  return map
}
