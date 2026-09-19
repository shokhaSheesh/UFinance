// components/DealsHeader.jsx
import IconButton from '@/components/shared/Buttons/IconButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { appStore } from '@/store/app.store'
import { Download, Plus } from 'lucide-react'

/**
 * Шапка страницы сделок: заголовок и действия.
 * Поиск, метод учёта и фильтры живут в панели над таблицей (TableToolbar).
 */
export default function DealsHeader({
  t,
  dealPermission,
  isDealsExportLoading,
  onExport,
  onCreateDeal,
  onCreateStudent,
}) {
  return (
    <PageHeader
      className="px-0"
      title={t('pageTitle')}
      actions={
        <>
          <IconButton
            icon={Download}
            label={t('downloadExcel')}
            onClick={onExport}
            loading={isDealsExportLoading}
          />

          {dealPermission.add && (
            <>
              {!appStore.isDonoSchool && (
                <button className="primary-btn text-sm rounded-sm! gap-1.5" onClick={onCreateDeal}>
                  <Plus size={16} />
                  {t('createDeal')}
                </button>
              )}
              {appStore.isDonoSchool && (
                <button className="primary-btn text-sm rounded-sm! gap-1.5" onClick={onCreateStudent}>
                  <Plus size={16} />
                  {t('createStudent')}
                </button>
              )}
            </>
          )}
        </>
      }
    />
  )
}
