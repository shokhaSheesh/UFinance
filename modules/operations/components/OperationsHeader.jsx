// components/OperationsHeader.jsx
import OperationTypeIcon from '@/components/operations/OperationTypeIcon/OperationTypeIcon'
import IconButton from '@/components/shared/Buttons/IconButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appStore } from '@/store/app.store'
import { ChevronDown, Download, FileSpreadsheet, Loader2, Plus } from 'lucide-react'

// Тип формы → tip для значка и право на создание
const CREATE_TYPES = [
  { id: 'income', tip: 'Поступление', label: 'modal.tabIncome', perm: 'income' },
  { id: 'payment', tip: 'Выплата', label: 'modal.tabPayment', perm: 'payout' },
  { id: 'transfer', tip: 'Перемещение', label: 'modal.tabTransfer', perm: 'transfer' },
  { id: 'accrual', tip: 'Начисление', label: 'modal.tabAccrual', perm: 'accrual' },
]

/**
 * Шапка страницы операций: заголовок и действия.
 *
 * «Создать» открывает выбор типа операции: четыре типа со значком и одной
 * строкой пояснения, ниже — импорт из Excel. Раньше кнопка сразу открывала
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
  const perms = appStore.permission?.operations || {}
  const types = CREATE_TYPES.filter((type) => perms?.[type.perm]?.add)

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
              <DropdownMenuContent className="w-80 rounded-xl p-1.5" align="end" sideOffset={6}>
                {types.map((type) => (
                  <DropdownMenuItem
                    key={type.id}
                    onClick={() => onCreate(type.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 cursor-pointer outline-none"
                  >
                    <OperationTypeIcon tip={type.tip} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-slate-900">{t(type.label)}</span>
                      <span className="text-xs text-slate-500">{t(`createHints.${type.id}`)}</span>
                    </span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuItem
                  onClick={onImport}
                  disabled={isImporting}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 cursor-pointer outline-none"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <FileSpreadsheet size={15} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-slate-900">{t('page.createImport')}</span>
                    <span className="text-xs text-slate-500">{t('createHints.importHint')}</span>
                  </span>
                  {isImporting && <Loader2 size={14} className="ml-auto animate-spin" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      }
    />
  )
}
