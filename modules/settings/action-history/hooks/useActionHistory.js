'use client'

import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { PAGE_LIMIT } from '@/modules/settings/action-history/utils/constants'
import { useDebounce } from '@/modules/settings/branches/hooks/useDebounce'
import { formatDate } from '@/utils/formatDate'
import { authStore } from '@/store/auth.store'
import { useLocale } from 'next-intl'
import { useMemo, useState } from 'react'

// Отдельного метода со списком авторов нет, поэтому копим их из самих записей:
// guid здесь гарантированно тот, который ждёт фильтр user_id. Накопитель живёт
// вне компонента, чтобы имена не терялись при переходе на другую страницу,
// и разделён по филиалам — списки авторов у них разные
const usersByBranch = new Map()

const collectUserOptions = (branchId, rows) => {
  let known = usersByBranch.get(branchId)
  if (!known) {
    known = new Map()
    usersByBranch.set(branchId, known)
  }
  rows.forEach(row => {
    const id = row?.plan_fakt_admins_id
    if (!id || known.has(id)) return
    known.set(id, { value: id, label: row?.user_name || id })
  })
  return [...known.values()].sort((a, b) => a.label.localeCompare(b.label))
}

const EMPTY_FILTERS = {
  userId: '',
  tableSlug: '',
  action: '',
  dateRange: { start: null, end: null },
  // выбранный пресет («неделя», «месяц»…) — NewDateRangeComponent подсвечивает им кнопку
  dateRangeType: '',
}

export const useActionHistory = () => {
  // event приходит с бэка уже на нужном языке — переводить нечего, только попросить
  const locale = useLocale()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const debouncedSearch = useDebounce(search)

  // Любая смена фильтра возвращает на первую страницу: иначе можно застрять
  // на седьмой странице выборки, в которой всего одна
  const handleSearchChange = value => {
    setSearch(value)
    setPage(1)
  }

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const requestData = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      lang: locale,
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      ...(filters.userId && { user_id: filters.userId }),
      ...(filters.tableSlug && { table_slug: filters.tableSlug }),
      ...(filters.action && { action: filters.action }),
      // Бэк принимает только YYYY-MM-DD, другой формат он молча игнорирует
      ...(filters.dateRange?.start && { date_from: formatDate(filters.dateRange.start) }),
      ...(filters.dateRange?.end && { date_to: formatDate(filters.dateRange.end) }),
    }),
    [page, locale, debouncedSearch, filters],
  )

  const { data, isFetching } = useUcodeRequestQuery({
    queryKey: 'action_history',
    method: 'list_action_history',
    data: requestData,
  })

  const rows = useMemo(() => data?.data?.data || [], [data])
  const pagination = data?.data?.pagination || {}
  const totalPages = pagination?.totalPages || 1
  const total = pagination?.total || 0

  const branchId = authStore?.branch_id
  const userOptions = useMemo(() => collectUserOptions(branchId, rows), [branchId, rows])

  const activeFilterCount =
    (debouncedSearch.trim() ? 1 : 0) +
    (filters.userId ? 1 : 0) +
    (filters.tableSlug ? 1 : 0) +
    (filters.action ? 1 : 0) +
    (filters.dateRange?.start || filters.dateRange?.end ? 1 : 0)

  return {
    rows,
    isFetching,
    page,
    setPage,
    totalPages,
    total,
    search,
    setSearch: handleSearchChange,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    userOptions,
  }
}
