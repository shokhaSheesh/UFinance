'use client'

import ActionHistoryFilters from '@/modules/settings/action-history/components/ActionHistoryFilters'
import ActionHistoryPagination from '@/modules/settings/action-history/components/ActionHistoryPagination'
import ActionHistoryTable from '@/modules/settings/action-history/components/ActionHistoryTable'
import { useActionHistory } from '@/modules/settings/action-history/hooks/useActionHistory'
import { appStore } from '@/store/app.store'
import { Loader } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

// Журнал изменений: кто, когда и что сделал. Текст события собирает бэк,
// фронт только показывает его и фильтрует (см. action_history_api.md)
const ActionHistoryPage = observer(() => {
  const th = useTranslations('Settings.actionHistory')

  const canRead = appStore?.permission?.settings?.general?.read

  const {
    rows,
    isFetching,
    page,
    setPage,
    totalPages,
    total,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    userOptions,
  } = useActionHistory()

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex items-center h-16 px-6 border-b border-gray-200 shrink-0 gap-3">
        <h1 className="text-xl font-semibold text-gray-ucode-800">{th('pageTitle')}</h1>
        {isFetching && <Loader size={16} className="animate-spin text-[#0E73F6]" />}
      </div>

      {!canRead ? (
        <p className="px-6 py-5 text-sm text-gray-ucode-600">{th('noAccess')}</p>
      ) : (
        <>
          <ActionHistoryFilters
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFilterChange={setFilter}
            userOptions={userOptions}
            activeFilterCount={activeFilterCount}
            onReset={resetFilters}
          />

          <div className="flex-1 overflow-auto">
            <ActionHistoryTable rows={rows} isFetching={isFetching} />
          </div>

          <ActionHistoryPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onChange={setPage}
            isFetching={isFetching}
          />
        </>
      )}
    </div>
  )
})

export default ActionHistoryPage
