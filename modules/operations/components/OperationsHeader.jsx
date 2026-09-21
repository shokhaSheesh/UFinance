// components/OperationsHeader.jsx
import CreateOperationMenu from '@/components/operations/CreateOperationMenu/CreateOperationMenu'
import IconButton from '@/components/shared/Buttons/IconButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'

/**
 * Шапка страницы операций: заголовок и действия.
 *
 * «Создать» открывает выбор типа операции: четыре типа со значком, ниже —
 * импорт из Excel. Раньше кнопка сразу открывала
 * форму поступления, а тип меняли вкладками уже внутри неё — первое действие
 * почти каждой новой операции было исправлением типа. Типы, которые роль не
 * может создавать, в меню не показываются.
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
            <CreateOperationMenu onCreate={onCreate} loading={isImporting} label={t('page.create')}>
              <DropdownMenuItem
                onClick={onImport}
                disabled={isImporting}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer outline-none"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <FileSpreadsheet size={15} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-900">{t('page.createImport')}</span>
                {isImporting && <Loader2 size={14} className="ml-auto animate-spin" />}
              </DropdownMenuItem>
            </CreateOperationMenu>
          )}
        </>
      }
    />
  )
}
