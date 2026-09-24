import LegalEntityMenu from '@/components/directories/LegalEntityMenu/LegalEntityMenu'
import { cn } from '@/lib/utils'
import { Building2 } from 'lucide-react'

const th =
  'sticky top-0 z-10 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 px-4 py-2.5 border-b border-slate-200 whitespace-nowrap'
const td = 'px-4 py-3 border-b border-slate-100 text-slate-700'

/**
 * Таблица юрлиц: те же колонки, единый стиль списков — приглушённая шапка,
 * подсветка строки под курсором, значок рядом с кратким названием.
 */
const LegalEntitiesTable = ({ t, entities, isLoading, searchQuery, onEdit, onDelete }) => {
  if (isLoading || entities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Building2 size={22} aria-hidden="true" />
        </span>
        <span className="text-sm text-slate-500">
          {isLoading ? t('loading') : searchQuery ? t('noResults') : t('noData')}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={cn(th, 'w-14 text-center')}>{t('tableHeaders.index')}</th>
            <th className={th}>{t('tableHeaders.shortName')}</th>
            <th className={th}>{t('tableHeaders.fullName')}</th>
            <th className={cn(th, 'w-40')}>{t('tableHeaders.inn')}</th>
            <th className={cn(th, 'w-40')}>{t('tableHeaders.kpp')}</th>
            <th className={cn(th, 'w-14')} aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity, index) => (
            <tr key={entity?.id} className="transition-colors hover:bg-[#f5f8ff]">
              <td className={cn(td, 'text-center tabular-nums text-slate-400')}>{index + 1}</td>
              <td className={cn(td, 'font-medium text-slate-900')}>
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Building2 size={16} aria-hidden="true" />
                  </span>
                  {entity?.shortName}
                </span>
              </td>
              <td className={cn(td, 'text-slate-600')}>{entity?.fullName || '—'}</td>
              <td className={cn(td, 'tabular-nums text-slate-600')}>{entity?.inn || '—'}</td>
              <td className={cn(td, 'tabular-nums text-slate-600')}>{entity?.kpp || '—'}</td>
              <td className={cn(td, 'text-center')} onClick={(e) => e.stopPropagation()}>
                <LegalEntityMenu legalEntity={entity} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default LegalEntitiesTable
