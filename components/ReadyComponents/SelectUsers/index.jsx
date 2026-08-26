'use client'

import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'

/**
 * Поиск пользователей компании (plan_fakt_admins) с серверным поиском.
 * @param {string|string[]} value     guid пользователя (массив при multi)
 * @param {(v) => void}     onChange
 * @param {boolean}         multi     множественный выбор
 * @param {string[]}        exclude   guid'ы, которые не показывать (уже добавленные)
 */
const SelectUsers = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  multi = false,
  exclude,
  hasError,
  isClearable = true,
  disabled = false,
}) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // debounce держим в useMemo, чтобы ссылка на функцию не менялась между рендерами
  const handleSearch = useMemo(() => debounce((val) => setDebouncedSearch(val), 500), [])
  useEffect(() => () => handleSearch.cancel(), [handleSearch])

  const { data: usersData, isLoading, isFetching } = useUcodeRequestQuery({
    method: 'get_company_users',
    data: { page: 1, limit: 50, search: debouncedSearch },
    querySetting: {
      // у этого метода список лежит глубже остальных — в data.data.response
      select: (response) => response?.data?.data?.response || [],
      staleTime: 1000 * 60 * 5,
      placeholderData: keepPreviousData,
    },
  })

  const mappedData = useMemo(() => {
    const excluded = Array.isArray(exclude) ? exclude : []
    return (usersData || [])
      .filter((user) => !excluded.includes(user?.guid))
      .map((user) => ({
        value: user?.guid,
        label: user?.name || user?.username || user?.email || t('noName'),
      }))
  }, [usersData, exclude, t])

  const Component = multi ? MultiSelect : SingleSelect

  return (
    <Component
      data={mappedData}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? t('loading') : placeholder || t('placeholders.selectUser')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      isClearable={isClearable}
      disabled={disabled}
      onSearch={handleSearch}
      isSearching={isFetching}
    />
  )
}

export default SelectUsers
