import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { CreateDealModal } from '../../deals/CreateDealModal/CreateDealModal'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SingleZdelka = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  hasError,
  isClearable = true,
  disabled = false,
  dropdownHeaderItem = null
}) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: deals, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_sales_list_simple",
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholderData: keepPreviousData
    }
  })

  const options = useMemo(() => {
    if (!deals || !Array.isArray(deals)) return []

    return deals.map(deal => ({
      value: deal.guid,
      label: deal?.Nazvanie || t('noName')
    }))
  }, [deals, t])

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50">{t('loading')}</div>
  }

  const createDealHeader = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-gray-100"
    >
      <Plus size={16} />
      {t('createDeal')}
    </button>
  )

  const combinedHeaderItem = (
    <>
      {createDealHeader}
      {dropdownHeaderItem}
    </>
  )

  return (
    <>
      <SingleSelect
        data={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder || t('placeholders.selectDeals')}
        className={className}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
        isClearable={isClearable}
        disabled={disabled}
        onSearch={handleSearch}
        isSearching={isFetching}
        dropdownHeaderItem={combinedHeaderItem}
      />
      <CreateDealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default SingleZdelka
