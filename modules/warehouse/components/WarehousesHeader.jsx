'use client'

import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Шапка страницы складов: заголовок с количеством, справа — перемещения
 * (вторичная кнопка) и добавление склада (основная). Раньше обе были
 * одинаковыми синими — непонятно, какое действие главное.
 */
export default function WarehousesHeader({ canAdd, count, onCreateClick, onOpenTransfers }) {
  const t = useTranslations('Warehouse')

  return (
    <PageHeader
      className="px-0"
      title={t('pageTitle')}
      search={count != null && <span className="text-sm tabular-nums text-slate-500">{t('count', { count })}</span>}
      actions={
        <>
          <button type="button" onClick={onOpenTransfers} className="secondary-btn h-9 gap-2">
            <ArrowLeftRight size={16} />
            {t('transfersButton')}
          </button>
          {canAdd && (
            <button onClick={onCreateClick} className="primary-btn gap-1.5">
              <Plus size={16} />
              {t('createButton')}
            </button>
          )}
        </>
      }
    />
  )
}
