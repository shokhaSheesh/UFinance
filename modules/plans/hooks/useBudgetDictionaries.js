'use client'

import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { listProjectGroups, listProjects } from '@/lib/api/ucode/projects'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

/**
 * Справочники для модалки бюджета: юрлица, проекты + группы проектов, валюты.
 * Проект и группа приходят одним списком: значения помечены префиксом
 * `p:` (проект) и `g:` (группа) — бэк принимает ровно одно из двух полей.
 */
export const useBudgetDictionaries = ({ groupLabel = 'группа' } = {}) => {
  const { data: legalEntitiesData } = useUcodeRequestQuery({
    method: 'get_legal_entities',
    data: {},
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30,
    },
  })

  const { data: currenciesData } = useUcodeRequestQuery({
    method: 'get_currencies',
    data: {},
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30,
    },
  })

  const { data: projectsData } = useQuery({
    queryKey: ['project_options'],
    queryFn: () => listProjects({ page: 1, limit: 200 }),
    staleTime: 1000 * 60 * 5,
  })

  const { data: groupsData } = useQuery({
    queryKey: ['list_project_groups'],
    queryFn: () => listProjectGroups({ page: 1, limit: 100 }),
    staleTime: 1000 * 60 * 5,
  })

  const legalEntities = useMemo(
    () => (legalEntitiesData || []).map((item) => ({ value: item.guid, label: item.nazvanie || '—' })),
    [legalEntitiesData]
  )

  const projects = useMemo(() => {
    const groups = (groupsData?.data || []).map((g) => ({
      value: `g:${g.guid}`,
      label: `${g.name} (${groupLabel})`,
    }))
    const items = (projectsData?.data || []).map((p) => ({ value: `p:${p.guid}`, label: p.name }))
    return [...groups, ...items]
  }, [projectsData, groupsData, groupLabel])

  const currencies = useMemo(
    () =>
      (currenciesData || []).map((c) => ({
        value: c.guid,
        code: c.kod,
        label: c.kod ? `${c.kod}${c.nazvanie ? ` (${c.nazvanie})` : ''}` : c.nazvanie || c.guid,
      })),
    [currenciesData]
  )

  return { legalEntities, projects, currencies }
}
