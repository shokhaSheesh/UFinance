'use client'

import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { attendanceStore, todayISO } from '@/store/attendance.store'
import { useEffect, useMemo } from 'react'

// Хуки webview переклички. Методы работают без авторизации:
// user_id / company_id / branch_id уходят в теле запроса.
// Порядок вызовов: get_attendance_bot_chat → get_attendance_groups →
// get_group_counterparties → create_attendance.

const CHAT_KEY = 'get_attendance_bot_chat'
const GROUPS_KEY = 'get_attendance_groups'
const ROWS_KEY = 'get_group_counterparties'

/**
 * Шаг 1: по chat_id из адреса получаем user_id / company_id / branch_id
 * и кладём их в стор — дальше все методы берут scope оттуда.
 */
export function useAttendanceSession(chatId) {
  const query = useUcodeRequestQuery({
    method: CHAT_KEY,
    data: { chat_id: chatId },
    skip: !chatId,
    querySetting: {
      // handleResponse отдаёт весь конверт, тело хендлера лежит в data
      select: (response) => response?.data || null,
      staleTime: 1000 * 60 * 30,
      retry: false,
    },
  })

  const session = query.data

  useEffect(() => {
    if (!session?.user_id) return
    attendanceStore.setSession({
      userId: session.user_id,
      companyId: session.company_id,
      branchId: session.branch_id,
    })
  }, [session])

  return {
    session,
    isLoading: query.isLoading,
    // «чат не привязан» приходит ошибкой метода, а не пустым ответом
    error: query.error,
    isReady: Boolean(session?.user_id),
  }
}

/** Шаг 2: группы рахбара + статистика за день */
export function useAttendanceGroups({ enabled = true, date } = {}) {
  const scope = attendanceStore.scope
  const day = date || todayISO()

  const query = useUcodeRequestQuery({
    method: GROUPS_KEY,
    data: { ...scope, date: day, page: 1, limit: 100 },
    skip: !enabled || !scope.user_id,
    querySetting: {
      select: (response) => ({
        groups: response?.data?.data || [],
        totals: response?.data?.totals || null,
        date: response?.data?.date || day,
      }),
    },
  })

  return {
    groups: query.data?.groups || [],
    totals: query.data?.totals,
    date: query.data?.date || day,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

/** Шаг 3: ученики группы + их статус за день */
export function useGroupCounterparties(groupId, { date, search, enabled = true } = {}) {
  const scope = attendanceStore.scope
  const day = date || todayISO()

  const query = useUcodeRequestQuery({
    method: ROWS_KEY,
    data: {
      counterparties_group_id: groupId,
      date: day,
      search: search || '',
      page: 1,
      // лимит метода — 500, для группы этого хватает с запасом
      limit: 500,
      ...(scope.company_id ? { company_id: scope.company_id } : {}),
      ...(scope.branch_id ? { branch_id: scope.branch_id } : {}),
    },
    // ждём сессию: иначе первый запрос уйдёт без company_id/branch_id
    skip: !groupId || !enabled,
    querySetting: {
      select: (response) => response?.data?.data || [],
    },
  })

  // useMemo, чтобы ссылка на массив не менялась между рендерами
  const rows = useMemo(() => query.data || [], [query.data])

  // как только пришли данные — переносим сохранённые статусы в черновик
  useEffect(() => {
    if (rows.length) attendanceStore.seedGroup(groupId, day, rows)
  }, [rows, groupId, day])

  return {
    rows,
    // название группы метод отдаёт в каждой строке
    groupName: rows[0]?.counterparties_group_nazvanie || '',
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}

/**
 * Справочник причин отсутствия. В webview токена нет, поэтому сначала спрашиваем
 * версию метода с company_id; если её на окружении нет — пробуем общий справочник.
 * Причина не обязательна: её всегда можно вписать руками.
 */
export function useAbsenceReasons() {
  const companyId = attendanceStore.companyId
  const params = { company_id: companyId, page: 1, limit: 100 }
  const select = (response) => response?.data?.data || []

  const byCompany = useUcodeRequestQuery({
    method: 'get_non_participation_reasons_by_company',
    data: params,
    skip: !companyId,
    querySetting: { select, staleTime: 1000 * 60 * 30, retry: false },
  })

  const fallback = useUcodeRequestQuery({
    method: 'get_non_participation_reasons',
    data: params,
    skip: !companyId || !byCompany.isError,
    querySetting: { select, staleTime: 1000 * 60 * 30, retry: false },
  })

  const reasons = byCompany.data?.length ? byCompany.data : fallback.data || []

  return { reasons, isLoading: byCompany.isLoading || fallback.isLoading }
}

/** Шаг 4: сохранение переклички (upsert, идемпотентно) */
export function useSaveAttendance() {
  const { mutateAsync, isPending } = useUcodeRequestMutation({
    mutationSetting: {
      onSuccess: () => {
        // счётчики группы и статусы учеников пересчитывает бэкенд
        queryClient.invalidateQueries({ queryKey: [GROUPS_KEY] })
        queryClient.invalidateQueries({ queryKey: [ROWS_KEY] })
      },
    },
  })

  const save = ({ groupId, date }) => {
    const day = date || todayISO()
    const attendances = attendanceStore.attendancesPayload(groupId)

    if (!attendances.length) {
      return Promise.reject(new Error('Отметьте хотя бы одного ребёнка'))
    }

    return mutateAsync({
      method: 'create_attendance',
      data: {
        counterparties_group_id: groupId,
        date: day,
        ...attendanceStore.scope,
        attendances,
      },
    }).then((response) => {
      attendanceStore.markSaved(groupId, day)
      return response?.data || null
    })
  }

  return { save, isSaving: isPending }
}
