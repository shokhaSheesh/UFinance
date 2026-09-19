// components/DealsHeader.jsx
import IconButton from '@/components/shared/Buttons/IconButton'
import FilterButton from '@/components/shared/Filters/FilterButton'
import Input from '@/components/shared/Input'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { appStore } from '@/store/app.store'
import { Download, Search } from 'lucide-react'

/**
 * Шапка страницы сделок: поиск, метод учёта и фильтры слева,
 * создание и меню — справа.
 */
export default function DealsHeader({
  t,
  dealPermission,
  searchValue,
  dealsMethod,
  methodOptions,
  isDealsExportLoading,
  onSearch,
  onExport,
  onCreateDeal,
  onCreateStudent,
  onMethodChange,
  onOpenFilters,
  filterCount = 0,
}) {
  return (
    <PageHeader
      title={t('pageTitle')}
      search={
        <div className="w-72">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
      }
      filters={
        <>
          {/* Метод учёта тоже сужает выборку — держим его рядом с фильтрами */}
          <div className="w-44">
            <SingleSelect
              data={methodOptions}
              withSearch={false}
              value={dealsMethod}
              isClearable={false}
              onChange={onMethodChange}
              className="bg-white"
            />
          </div>
          <FilterButton onClick={onOpenFilters} count={filterCount} />
        </>
      }
      actions={
        <>
          {dealPermission.add && (
            <>
              {!appStore.isDonoSchool && (
                <button className="primary-btn text-sm rounded-sm!" onClick={onCreateDeal}>
                  {t('createDeal')}
                </button>
              )}
              {appStore.isDonoSchool && (
                <button className="primary-btn text-sm rounded-sm!" onClick={onCreateStudent}>
                  {t('createStudent')}
                </button>
              )}
            </>
          )}

          <IconButton icon={Download} label={t('downloadExcel')} onClick={onExport} loading={isDealsExportLoading} />
        </>
      }
    />
  )
}
