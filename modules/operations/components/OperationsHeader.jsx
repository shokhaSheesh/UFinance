// components/OperationsHeader.jsx
import IconButton from '@/components/shared/Buttons/IconButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Download, Loader2, PenLine, Plus, Upload } from 'lucide-react'

/**
 * Шапка страницы операций: заголовок и действия.
 *
 * Поиск и фильтры живут не здесь, а в панели над самой таблицей
 * (TableToolbar) — они относятся к таблице, а не к разделу.
 *
 * Импорт лежит внутри кнопки «Создать»: ручной ввод и загрузка из Excel —
 * два способа сделать одно и то же. Выгрузка — отдельная кнопка с иконкой.
 */
export default function OperationsHeader({
  t,
  isMounted,
  canAdd,
  isImporting,
  isExporting,
  onCreate,
  onImport,
  onExport,
}) {
  return (
    <PageHeader
      className="px-0"
      title={t('page.title')}
      actions={
        <>
          <IconButton
            icon={Download}
            label={t('page.export')}
            onClick={onExport}
            loading={isExporting}
          />

          {isMounted && canAdd && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="primary-btn gap-1.5" disabled={isImporting}>
                  <Plus size={16} />
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
        </>
      }
    />
  )
}
