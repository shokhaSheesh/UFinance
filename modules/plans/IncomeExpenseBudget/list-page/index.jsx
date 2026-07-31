'use client'

import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import Input from '@/components/shared/Input'
import BudgetRowMenu from '@/modules/plans/components/BudgetRowMenu'
import BudgetFormModal from '@/modules/plans/components/BudgetDetail/BudgetFormModal'
import { useBudgetDictionaries } from '@/modules/plans/hooks/useBudgetDictionaries'
import { useBudgetList } from '@/modules/plans/hooks/useBudgetList'
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget
} from '@/modules/plans/hooks/useBudgets'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { ChevronDown, Loader2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const BUDGET_TYPE = 'pnl'

const IncomeExpenseBudget = () => {
  const t = useTranslations('Plans.incomeExpenseBudget')
  const tc = useTranslations('Common')
  const tf = useTranslations('Plans.IncomeExpenseBudgetSingle')
  const router = useRouter()

  const [legalEntityFilter, setLegalEntityFilter] = useState(null)

  // Права раздела «Планы» → нужный бюджет
  const permissions = appStore.permission.plans?.pnl || {}

  const monthLabels = useMemo(
    () => Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, tf(`monthsShort.${i + 1}`)])),
    [tf]
  )

  const { budgets, isLoading } = useBudgets(BUDGET_TYPE, { legalEntityId: legalEntityFilter })
  const createBudget = useCreateBudget(BUDGET_TYPE)
  const updateBudget = useUpdateBudget(BUDGET_TYPE)
  const deleteBudget = useDeleteBudget(BUDGET_TYPE)
  const { legalEntities, projects, currencies } = useBudgetDictionaries({ groupLabel: tf('form.projectGroup') })

  const {
    filteredData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
    modalOpen,
    editing,
    openCreate,
    openEdit,
    closeModal,
    submit,
    remove
  } = useBudgetList({
    budgets,
    monthLabels,
    onCreate: createBudget.mutateAsync,
    onUpdate: updateBudget.mutateAsync,
    onDelete: deleteBudget.mutateAsync
  })

  const openBudget = (id) => router.push(`/income_expense_budget/${id}`)

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-50" />
    }
    return (
      <ChevronDown
        className={`w-4 h-4 text-gray-600 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 ">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-slate-900">
            {t('title')}
          </h1>
          {permissions.add && (
            <button
              onClick={openCreate}
              className="primary-btn flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {tc('create')}
            </button>
          )}
        </div>

        {/* Right side filters */}
        <div className="flex items-center gap-3">
          <SelectLegelEntitties
            value={legalEntityFilter}
            onChange={setLegalEntityFilter}
            placeholder={t('columns.legalEntity')}
            className="w-[220px] bg-white"
            isClearable
          />
          <Input
            type="text"
            leftIcon={<Search className="w-4 h-4" />}
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[280px]"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex mx-4 items-center bg-neutral-100 border-b border-neutral-50 text-xs font-medium text-neutral-500 sticky top-0 z-10">
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors  w-[300px] line-clamp-1"
          onClick={() => handleSort('name')}
        >
          {t('columns.name')}
          {renderSortIcon('name')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors w-[80px] justify-center"
          onClick={() => handleSort('currency')}
        >
          {t('columns.currency')}
          {renderSortIcon('currency')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors flex-1 min-w-[140px]"
          onClick={() => handleSort('legalEntity')}
        >
          {t('columns.legalEntity')}
          {renderSortIcon('legalEntity')}
        </div>
        {/* Проект — только при включённом модуле «Проекты» */}
        {appStore.projectActive && (
          <div
            className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors flex-1 min-w-[140px]"
            onClick={() => handleSort('project')}
          >
            {t('columns.project')}
            {renderSortIcon('project')}
          </div>
        )}
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors w-[140px]"
          onClick={() => handleSort('period')}
        >
          {t('columns.period')}
          {renderSortIcon('period')}
        </div>
        <div
          className="group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors w-[120px]"
          onClick={() => handleSort('modifiedDate')}
        >
          {t('columns.modifiedDate')}
          {renderSortIcon('modifiedDate')}
        </div>
        <div className="w-[50px] flex justify-center px-3 py-2">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 mx-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-sm">{t('noData')}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredData.map((item, index) => (
              <div
                key={item.id}
                role='button'
                tabIndex={0}
                onClick={() => openBudget(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openBudget(item.id)
                  }
                }}
                className={`flex items-center text-sm border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <div className="px-4 py-3 w-[300px] line-clamp-1 font-medium text-slate-900">
                  {item.name}
                </div>
                <div className="px-4 py-3 w-[80px] text-start text-gray-600 font-medium">
                  {item.currency || '—'}
                </div>
                <div className="px-4 py-3 flex-1 min-w-[140px] text-gray-600">
                  {item.legalEntity || '—'}
                </div>
                {appStore.projectActive && (
                  <div className="px-4 py-3 flex-1 min-w-[140px] text-gray-600">
                    {item.project || '—'}
                  </div>
                )}
                <div className="px-4 py-3 w-[140px] text-gray-600 text-xs">
                  {item.period}
                </div>
                <div className="px-4 py-3 w-[120px] text-gray-600 text-xs">
                  {item.modifiedDate || '—'}
                </div>
                <div
                  className="w-[50px] px-4 py-3 flex justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BudgetRowMenu
                    onEdit={() => openEdit(item)}
                    onDelete={() => remove(item.id)}
                    editLabel={tf('actions.edit')}
                    deleteLabel={tf('actions.delete')}
                    canEdit={permissions.edit}
                    canDelete={permissions.delete}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <span>{t('footer.total', { count: filteredData.length })}</span>
      </div>

      <BudgetFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={submit}
        budget={editing}
        t={tf}
        monthLabels={monthLabels}
        legalEntities={legalEntities}
        projects={projects}
        currencies={currencies}
        isSaving={createBudget.isPending || updateBudget.isPending}
      />
    </div>
  )
}

// observer: колонка «Проект» зависит от флага модуля в appStore
export default observer(IncomeExpenseBudget)
