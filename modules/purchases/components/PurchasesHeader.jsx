import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { appStore } from '@/store/app.store'
import { Download, EllipsisVertical, Loader2, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import styles from '../purchases-list/purchases.module.scss'

export default function PurchasesHeader({
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
  const tPurchases = useTranslations('Purchases')
  return (
    <header className="flex items-center justify-between px-3 h-[60px] sticky top-0 bg-white z-20">
      <div className="flex items-center gap-2 flex-1">
        <h1 className={styles.title}>{tPurchases('pageTitle')}</h1>

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="primary-btn" disabled={isDealsExportLoading}>
              {isDealsExportLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <EllipsisVertical size={18} />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44 p-2" align="end">
            <DropdownMenuItem
              onClick={onExport}
              disabled={isDealsExportLoading}
              className="w-full flex items-center cursor-pointer text-sm gap-2 justify-start outline-none"
            >
              <Download size={16} />
              <span>{t('downloadExcel')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
