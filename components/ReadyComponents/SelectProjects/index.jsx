'use client'

import { listProjects } from '@/lib/api/ucode/projects'
import MultiSelect from '@/components/shared/Selects/MultiSelect'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { toJS } from 'mobx'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

/**
 * Готовый селект проектов (list_projects из projects-API).
 * multi=false → SingleSelect (для форм), multi=true → MultiSelect (для фильтров).
 * Гейтинг по project_active делает вызывающий (оборачивает в appStore.projectActive).
 */
const SelectProjects = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  isClearable = true,
  disabled = false,
  multi = false,
}) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleSearch = useMemo(() => debounce((v) => setDebouncedSearch(v), 500), [])
  useEffect(() => () => handleSearch.cancel(), [handleSearch])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['select_projects', debouncedSearch],
    queryFn: () => listProjects({ page: 1, limit: 100, search: debouncedSearch || undefined }),
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })

  const options = useMemo(
    () => (Array.isArray(data) ? data : []).map((p) => ({ value: p.guid, label: p.name || t('noName') })),
    [data, t]
  )

  const busy = isLoading || isFetching

  // MultiSelect читает `value?.includes(...)` напрямую — отдаём ему обычный массив
  // (не MobX-observable), а single — значение как есть.
  if (multi) {
    const arr = Array.isArray(value) ? toJS(value) : value ? [value] : []
    return (
      <MultiSelect
        data={options}
        value={arr}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        dropdownClassName={dropdownClassName}
        isClearable={isClearable}
        disabled={disabled}
        onSearch={handleSearch}
        isSearching={busy}
      />
    )
  }

  return (
    <SingleSelect
      data={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      dropdownClassName={dropdownClassName}
      isClearable={isClearable}
      disabled={disabled}
      onSearch={handleSearch}
      loading={busy}
    />
  )
}

export default SelectProjects
