import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { student } from '@/store/student.store'
import { Loader2 } from 'lucide-react'

const StudentsHeader = ({ t, accountingMethodOptions, mounted, onExport, isExporting, onAccountingChange }) => (
  <div className="flex items-center top-0 sticky z-100 py-4 bg-white justify-between">
    <div className="flex gap-2 flex-1">
      <h1 className="text-xl font-semibold text-gray-900 text-nowrap">{t('students.title')}</h1>
    </div>
    <div className="flex items-center gap-2">
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
      <button onClick={onExport} type='button' className="primary-btn">
        {t('common.downloadExcel')} {isExporting && <Loader2 size={16} className="animate-spin" />}
      </button>
    </div>
  </div>
)

export default StudentsHeader
