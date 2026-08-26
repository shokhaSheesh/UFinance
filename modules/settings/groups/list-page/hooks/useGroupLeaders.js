'use client'

import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification } from '@/lib/utils/notifications'
import { useMemo } from 'react'

const GROUPS_KEY = 'get_counterparties_group'
const LEADERS_KEY = 'get_group_leaders'

// Список групп контрагентов + все назначенные рахбары одним запросом.
// Рахбаров раскладываем по группам на клиенте, чтобы не дёргать API на каждую строку.
export function useGroupLeadersData(search = '') {
  const { data: groups, isLoading: groupsLoading } = useUcodeRequestQuery({
    method: GROUPS_KEY,
    // метод принимает именно searchString, не search
    data: { page: 1, limit: 100, searchString: search },
    querySetting: {
      select: (response) => response?.data?.data || [],
    },
  })

  const { data: leaders, isLoading: leadersLoading } = useUcodeRequestQuery({
    method: LEADERS_KEY,
    data: { page: 1, limit: 500 },
    querySetting: {
      select: (response) => response?.data?.data || [],
    },
  })

  const leadersByGroup = useMemo(() => {
    const map = new Map()
    ;(leaders || []).forEach((leader) => {
      const groupId = leader?.counterparties_group_id
      if (!groupId) return
      if (!map.has(groupId)) map.set(groupId, [])
      map.get(groupId).push(leader)
    })
    return map
  }, [leaders])

  return {
    groups: groups || [],
    leadersByGroup,
    isLoading: groupsLoading || leadersLoading,
  }
}

// Рахбары конкретной группы — отдельный запрос, чтобы модалка не зависела
// от лимита общего списка
export function useGroupLeadersOfGroup(groupId) {
  const { data, isLoading } = useUcodeRequestQuery({
    method: LEADERS_KEY,
    data: { counterparties_group_id: groupId, page: 1, limit: 500 },
    skip: !groupId,
    querySetting: {
      select: (response) => response?.data?.data || [],
    },
  })

  return { leaders: data || [], isLoading }
}

const invalidateLeaders = () => {
  queryClient.invalidateQueries({ queryKey: [LEADERS_KEY] })
}

export function useAttachGroupLeader() {
  const { mutateAsync, isPending } = useUcodeRequestMutation({
    mutationSetting: { onSuccess: invalidateLeaders },
  })

  const attach = async ({ counterparties_group_id, user_id }) => {
    try {
      await mutateAsync({
        method: 'create_group_leader',
        data: { counterparties_group_id, user_id },
      })
      return true
    } catch (error) {
      // бэкенд не даёт назначить одного пользователя дважды на ту же группу
      const message = error?.message || error?.data?.error || ''
      if (String(message).includes('already exists')) {
        showErrorNotification('Этот пользователь уже назначен на группу')
      }
      return false
    }
  }

  return { attach, isAttaching: isPending }
}

export function useDetachGroupLeader() {
  const { mutateAsync, isPending } = useUcodeRequestMutation({
    mutationSetting: { onSuccess: invalidateLeaders },
  })

  const detach = (guid) => mutateAsync({ method: 'delete_group_leader', data: { guid } })

  return { detach, isDetaching: isPending }
}
