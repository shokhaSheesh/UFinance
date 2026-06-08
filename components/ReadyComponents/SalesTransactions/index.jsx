'use client'
import { CreateDealModal } from '@/components/deals/CreateDealModal/CreateDealModal'
import MultiSelect from '@/components/shared/Selects/MultiSelect'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

const SalesTransactions = ({ value = [], onChange, placeholder = "Выберите сделки", dropdownClassName, hasError, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: dealsData, isLoading, isFetching } = useUcodeRequestQuery({
    method: 'get_sales_list_simple',
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch
    },
    querySetting: {
      select: (response) => response?.data?.data,
      staleTime: 1000 * 60 * 30,
      placeholder: keepPreviousData
    }
  })

  const formattedDeals = useMemo(() => {
    const items = Array.isArray(dealsData) ? dealsData : []
    return items.map(deal => ({
      value: deal.guid,
      label: deal.Nazvanie || deal.name || 'Без названия',
    }))
  }, [dealsData])


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
      <MultiSelect
        data={formattedDeals}
        onSearch={handleSearch}
        value={value}
        onChange={onChange}
        placeholder={isLoading ? t('loading') : (placeholder || t('placeholders.selectDeals'))}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
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

export default SalesTransactions;
