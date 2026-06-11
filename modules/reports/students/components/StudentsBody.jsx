import { formatNumber } from '@/utils/helpers'
import { useTranslations } from 'next-intl'

const StudentsBody = ({ studentList, columns }) => {
  const t = useTranslations('Reports')

  return (
    <div>
      {studentList.map((studentItem, index) => (
        <div key={studentItem?.counterparty_id} className="flex hover:bg-neutral-100 h-9">
          {columns.map((col) => {
            if (col?.type === 'sticky') {
              const name = col.key === 'fio' ? studentItem?.counterparty_name
                : col.key === 'group' ? studentItem?.counterparties_group_nazvanie
                : (studentItem?.contract_status ? t('students.status.active') : t('students.status.passive'))
              const prefix = col.key === 'fio' ? <span className="pr-2 w-8! text-center">{index + 1}</span> : null
              const textCenter = col.key !== 'fio' ? 'text-center!' : ''
              return (
                <div
                  key={col.key}
                  className={`sticky left-0 z-10 line-clamp-1 bg-white border-b border-r border-gray-200 text-sm text-gray-900 ${col.width} flex items-center whitespace-nowrap line-clamp-1 overflow-hidden shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                >
                  <div className={`px-2 py-3 w-full flex-1 flex gap-1`}>
                    {prefix} <span className={`flex-1 ${textCenter} line-clamp-1`}>{name}</span>
                  </div>
                </div>
              )
            }
            if (col?.type === 'month-group') {
              const monthData = studentItem?.months?.find(m => m?.month === col.key)
              return (
                <div key={col.key} className={`flex flex-1 ${col.width} text-sm`}>
                  {col.children?.map((child) => {
                    const value = child.key?.endsWith('-plan') ? monthData?.plan
                      : child.key?.endsWith('-fact') ? monthData?.fact
                        : monthData?.plan_fact
                    return (
                      <div key={child.key} className="border-r border-b box-border border-gray-200 px-2 py-2 text-center text-gray-700 flex-1 flex items-center justify-center">
                        {formatNumber(value) || '-'}
                      </div>
                    )
                  })}
                </div>
              )
            }
            const value = col.key === 'totalPlan' ? studentItem?.total_plan
              : col.key === 'totalFact' ? studentItem?.total_fact
                : studentItem?.total_plan_fact
            return (
              <div key={col.key} className={`border-b ${col.key === 'totalPlan' || col.key === 'totalFact' ? 'border-r' : ''} ${col.width} border-gray-200 px-2 py-3 text-center font-medium text-gray-900 flex items-center justify-center text-sm line-clamp-1`}>
                {formatNumber(value)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default StudentsBody
