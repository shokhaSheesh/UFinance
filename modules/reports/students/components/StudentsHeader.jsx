import FilterButton from '@/components/shared/Filters/FilterButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { student } from '@/store/student.store'
import { Loader2 } from 'lucide-react'

/**
 * Шапка отчёта по ученикам: метод учёта и фильтры слева, выгрузка — справа.
 */
const StudentsHeader = ({
  t,
  accountingMethodOptions,
  mounted,
  onExport,
  isExporting,
  onAccountingChange,
  onOpenFilters,
  filterCount = 0,
}) => (
  <PageHeader
    className="sticky top-0 z-100 px-0"
    title={t('students.title')}
    filters={
      <>
        {mounted && (
          <SingleSelect
            data={accountingMethodOptions}
            value={student.accounting}
            onChange={onAccountingChange}
            isClearable={false}
            withSearch={false}
            className="bg-white w-44"
          />
        )}
        <FilterButton onClick={onOpenFilters} count={filterCount} />
      </>
    }
    actions={
      <button onClick={onExport} type="button" className="primary-btn">
        {t('common.downloadExcel')} {isExporting && <Loader2 size={16} className="animate-spin" />}
      </button>
    }
  />
)

export default StudentsHeader
