// components/OperationsHeader.jsx
import FilterButton from '@/components/shared/Filters/FilterButton'
import Input from '@/components/shared/Input'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2, Search, Upload } from 'lucide-react'

/**
 * Шапка страницы операций: поиск и фильтры слева, создание и меню — справа.
 */
export default function OperationsHeader({
  t,
  isMounted,
  canAdd,
  isImporting,
  isExporting,
  searchQuery,
  onSearch,
  onCreate,
  onImport,
  onExport,
  onOpenFilters,
  filterCount = 0,
}) {
  return (
    <PageHeader
      title={t('page.title')}
      search={
        <Input
          type="text"
          leftIcon={<Search size={20} />}
          placeholder={t('page.searchPlaceholder')}
          value={searchQuery}
          className="w-[300px]"
          onChange={onSearch}
        />
      }
      filters={<FilterButton onClick={onOpenFilters} count={filterCount} />}
      actions={
        <>
          {isMounted && canAdd && (
            <button onClick={onCreate} className="primary-btn">
              {t('page.create')}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RowActionsTrigger loading={isImporting || isExporting} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 p-2" align="end">
              <DropdownMenuItem
                onClick={onImport}
                disabled={isImporting}
                className="w-full flex items-center cursor-pointer text-sm gap-2 justify-start outline-none"
              >
                <Upload size={16} />
                <span>{t('page.import')}</span>
                {isImporting && <Loader2 size={14} className="animate-spin ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExport}
                disabled={isExporting}
                className="w-full flex items-center cursor-pointer text-sm gap-2 justify-start outline-none"
              >
                <Download size={16} />
                <span>{t('page.export')}</span>
                {isExporting && <Loader2 size={14} className="animate-spin ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  )
}
