// components/DealsHeader.jsx
import IconButton from '@/components/shared/Buttons/IconButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { appStore } from '@/store/app.store'
import { Download } from 'lucide-react'

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
          <IconButton
            icon={Download}
            label={t('downloadExcel')}
            onClick={onExport}
            loading={isDealsExportLoading}
          />
        </>
      }
    />
  )
}
