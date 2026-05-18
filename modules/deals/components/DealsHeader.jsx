// components/DealsHeader.jsx
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { appStore } from '@/store/app.store'
import { Loader2, Search } from 'lucide-react'
import styles from '../deals-list/deals.module.scss'

/**
 * Sticky page header: title, create buttons, method selector, search, export.
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
}) {
  return (
    <header className="flex items-center justify-between px-3 h-[60px] sticky top-0 bg-white z-20">
      <div className="flex items-center gap-2 flex-1">
        <h1 className={styles.title}>{t('pageTitle')}</h1>

        {dealPermission.add && (
          <>
            {!appStore.isDonoSchool && (
              <button
                className="primary-btn text-sm rounded-sm!"
                onClick={onCreateDeal}
              >
                {t('createDeal')}
              </button>
            )}
            {appStore.isDonoSchool && (
              <button
                className="primary-btn text-sm rounded-sm!"
                onClick={onCreateStudent}
              >
                {t('createStudent')}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
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

        <div className="w-72">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        <button onClick={onExport} type="button" className="primary-btn">
          {t('downloadExcel')}
          {isDealsExportLoading && <Loader2 size={16} className="animate-spin ml-1" />}
        </button>
      </div>
    </header>
  )
}