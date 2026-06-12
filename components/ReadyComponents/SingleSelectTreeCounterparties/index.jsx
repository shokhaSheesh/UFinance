import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useCounterpartiesGroupsPlanFact } from '../../../hooks/useDashboard'
import TreeSelect from '../../shared/Selects/TreeSelect'

const SingleSelectTreeCounterparties = ({ selectedValue, setSelectedValue, placeholder, className, dropdownClassName, hasError, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: counterpartiesGroupsData, isFetching } = useCounterpartiesGroupsPlanFact({
    page: 1,
    limit: 100,
    search: debouncedSearch
  })

  const result = useMemo(() => {
    const groups = counterpartiesGroupsData?.data?.data || []

    if (groups.length === 0) return []

    const buildTree = item => {
      // Check if this is a group with children
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        return {
          value: item.guid,
          label: item.nazvanie_gruppy || t('noName'),
          isSelectable: false, // Groups are not selectable
          bold: true,
          children: item.children.map(child => ({
            value: child.guid,
            label: child.nazvanie || t('noName'),
            isSelectable: true,
          }))
        }
      }

      // This is a standalone item (no children)
      return {
        value: item.guid,
        label: item.nazvanie_gruppy || item.nazvanie || t('noName'),
        isSelectable: true,
      }
    }

    return groups.map(buildTree)
  }, [counterpartiesGroupsData, t])

  return <TreeSelect
    data={result}
    multi={false}
    placeholder={isFetching ? t('loading') : placeholder || t('placeholders.selectCounterparty')}
    value={selectedValue}
    onChange={setSelectedValue}
    className={className}
    dropdownClassName={dropdownClassName}
    hasError={hasError}
    onSearch={handleSearch}
    isSearching={isFetching}
    dropdownHeaderItem={dropdownHeaderItem}
  />
}

export default SingleSelectTreeCounterparties