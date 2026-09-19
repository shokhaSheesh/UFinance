// components/OperationsHeader.jsx
import IconButton from '@/components/shared/Buttons/IconButton'
import FilterButton from '@/components/shared/Filters/FilterButton'
import Input from '@/components/shared/Input'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Download, Loader2, PenLine, Search, Upload } from 'lucide-react'

/**
 * Шапка страницы операций: поиск и фильтры слева, создание и выгрузка справа.
 *
 * Импорт живёт внутри кнопки «Создать»: и ручной ввод, и загрузка из Excel —
 * два способа сделать одно и то же, поэтому они стоят рядом, а не прячутся
 * в отдельном меню «три точки». Выгрузка — отдельная кнопка с иконкой:
 * это одно действие, меню ему ни к чему.
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="primary-btn gap-1.5" disabled={isImporting}>
                  {t('page.create')}
                  {isImporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-1.5" align="end">
                <DropdownMenuItem
                  onClick={onCreate}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-2 rounded-md outline-none"
                >
                  <PenLine size={15} />
                  <span>{t('page.createManual')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onImport}
                  disabled={isImporting}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-2 rounded-md outline-none"
                >
                  <Upload size={15} />
                  <span>{t('page.createImport')}</span>
                  {isImporting && <Loader2 size={14} className="animate-spin ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <IconButton
            icon={Download}
            label={t('page.export')}
            onClick={onExport}
            loading={isExporting}
          />
        </>
      }
    />
  )
}
