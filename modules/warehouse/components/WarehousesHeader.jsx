'use client'

import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Шапка страницы складов: заголовок и действия.
 * Поиск живёт в панели над таблицей (TableToolbar).
 */
export default function WarehousesHeader({ canAdd, onCreateClick, onOpenTransfers }) {
  const t = useTranslations('Warehouse')

  return (
    <PageHeader
      className="px-0"
      title={t('pageTitle')}
      actions={
        <>
          <button
            type="button"
            onClick={onOpenTransfers}
            className="primary-btn flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeftRight size={16} />
            {t('transfer.button')}
          </button>
          {canAdd && (
            <button onClick={onCreateClick} className="primary-btn flex items-center gap-1.5">
              <Plus size={16} />
              {t('createButton')}
            </button>
          )}
        </>
      }
    />
  )
}
