import PriceStatus from '@/components/operations/PriceStatus'
import { ExpendClose, ExpendOpen, ShipmentIcon, TypeExpenseIcon, TypeIncomeIcon, TypeTransferIcon } from '@/constants/icons'
import { cn } from '@/lib/utils'
import { operationFilterStore } from '@/store/operationFilter.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

const IncomePaymentTableRow = observer(({
  op,
  toggleOperation,
}) => {
  const t = useTranslations('Operations')
  const [open, setOpen] = useState(false)
  const children = useMemo(() => new Set(), [])
  const chartofaccounts = useMemo(() => new Set(), [])
  const isSpinasiya = !operationFilterStore?.selectedFilters?.includes('Списание')
  const isZachisleniya = !operationFilterStore?.selectedFilters?.includes('Зачисление')
  const isDebit = !operationFilterStore?.selectedFilters?.includes('Дебет')
  const isCredit = !operationFilterStore?.selectedFilters?.includes('Кредит')


  op.operationParts?.forEach(part => {
    children.add(part?.counterparties_id)
    chartofaccounts.add(part?.chart_of_accounts_id)
  })

  const titleContragent = useMemo(() => {
    if (children.size === 1) {
      return op.counterparty || ''
    } else if (children.size > 1) {
      return `${children.size || 2} [контрагента]`
    } else {
      return op.counterparty || ''
    }
  }, [children, op.counterparty])


  const titleChartOfAccounts = useMemo(() => {
    if (chartofaccounts.size === 1) {
      return op.chartOfAccounts || ''
    } else if (chartofaccounts.size > 1) {
      return `${chartofaccounts.size || 2} [статьи]`
    } else {
      return op.chartOfAccounts || ''
    }
  }, [chartofaccounts, op.chartOfAccounts])

  const isDifferentDate = op?.accrualDate !== op?.operationDate

  const isActive = !op?.payment_confirmed && !op?.payment_accrual


  const textPrimary = useMemo(() => {
    switch (op.tip) {
      case 'Поступление':
        return !op.payment_confirmed && !op.payment_accrual && 'text-primary'
      case 'Выплата':
        return !op.payment_confirmed && !op.payment_accrual && 'text-primary'
      case 'Начисление':
        return !op.payment_accrual && 'text-primary'
      case 'Отгрузка':
        return op.payment_shipment && 'text-primary'
      case 'Перемещение':
        return !op.payment_confirmed && 'text-primary'
      default:
        return ''
    }
  }, [op])

  return (
    <>
      <div
        key={op.id}
        className={cn(
          'flex text-mini items-stretch bg-white border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer min-h-11',
        )}
      >

        {/* Date */}
        <div className={cn('min-w-36 flex py-1 items-center justify-start ', isActive && styles.activeRow)}>
          <div className={cn(textPrimary, 'w-full')}>
            {op.operationParts?.length > 0 ? (
              <div className={"flex items-center gap-1 pl-5 px-3 relative"} onClick={(event) => { event.stopPropagation(); setOpen(!open) }}>
                <span className="absolute left-0.5"> {open ? <ExpendClose /> : <ExpendOpen />}</span>
                <span className="text-sm flex-1">{op?.operationDate}</span>
              </div>
            ) : (
              <div className='flex flex-col pl-5 px-3 items-start leading-tight'>
                <span className='text-sm'>{op?.operationDate}</span>
                {isDifferentDate && <span className="text-sm text-neutral-400">{op?.accrualDate}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Account/Shot */}
        <div className={cn('min-w-18 line-clamp-1 max-w-52 flex-1 flex px-2 py-1 items-center justify-start', isActive && styles.activeRow)}>
          <div className={cn('flex flex-col items-start leading-tight truncate', textPrimary)}>
            {op?.tip === "Перемещение" ? (
              <>
                <span className="truncate w-full text-sm">{op.my_account_name}</span>
                <span className="truncate w-full text-sm">{op.my_account_name2}</span>
              </>
            ) : (op.tip === "Поступление" || op.tip === "Выплата") ? (
              <span className="truncate w-full text-sm">{op.my_account_name}</span>
            ) : (op?.tip === "Начисление" || op?.tip === "Отгрузка") ? (
              <span className={cn("truncate w-full text-sm text-neutral-500 font-normal", textPrimary)}>[{op.legal_entity_name}]</span>
            ) : null}
          </div>
        </div>

        {/* Type Icon */}
        <div className="min-w-14 flex px-1 items-center justify-center">
          {op.tip ? (
            <div className={cn('flex items-center justify-center w-[28px] h-[28px]', 'scale-75')}>
              {op.tip === 'Поступление' ? (
                <TypeIncomeIcon />
              ) : op.tip === 'Выплата' ? (
                  <TypeExpenseIcon />
                ) : (op.tip === 'Перемещение' || op.tip === 'Начисление') ? (
                  <TypeTransferIcon />
              ) : op.tip === 'Отгрузка' && <ShipmentIcon />}
            </div>
          ) : null}
        </div>

        {/* Counterparty */}
        <div className={cn('min-w-20 flex  flex-1 px-2 py-1 items-center justify-start ', isActive && styles.activeRow)}>
          <p className={cn('text-xs line-clamp-2', textPrimary)} title={titleContragent}>{titleContragent}</p>
        </div>

        {/* Statya (Statya - Chart of Accounts) */}
        <div className={cn('flex-1 flex flex-col px-2 py-1 items-start justify-center  min-w-20', isActive && styles.activeRow)}>
          <div className={cn('flex flex-col items-start  w-full', textPrimary)}>
            {op?.tip === "Перемещение" ? (
              <>
                <span className={cn('text-sm line-clamp-1 w-full', isSpinasiya && 'opacity-50')}>{t('row.transferWriteOff')}</span>
                <span className={cn('text-sm line-clamp-1 w-full', isZachisleniya && 'opacity-50')}>{t('row.transferEnrollment')}</span>
              </>
            ) : (op.tip === "Поступление" || op.tip === "Выплата") ? (
              <>
                  <span className="text-sm  truncate w-full">{titleChartOfAccounts}</span>
                  {op.opisanie && <span className='text-sm text-neutral-400 line-clamp-1 w-full'>{op.opisanie}</span>}
              </>
              ) : op?.tip === "Начисление" ? (
              <>
                    <span className={cn('text-sm line-clamp-1 w-full', isDebit && 'opacity-50')}>{op.chartOfAccounts} {t('row.byDebit')}</span>
                    <span className={cn('text-sm line-clamp-1 w-full', isCredit && 'opacity-50')}>{op.chartOfAccounts2} {t('row.byCredit')}</span>
              </>
                ) : (op?.tip === "Отгрузка") && (
                  <span className="text-sm line-clamp-1  w-full">{op.chartOfAccounts}</span>
            )}
          </div>
        </div>

        {/* Price/Amount */}
        <div className="min-w-36 flex px-2 py-1 items-center justify-end " onClick={e => e.stopPropagation()}>
          <PriceStatus
            amount={op.summa}
            toAmount={op.to_amount}
            tab={op.tip}
            type={op?.tip}
            op={op}
            debit={op?.debit}
            kredit={op?.kredit}
            percent={op?.percent}
            confirmed={op.payment_confirmed}
            accrual={op.payment_accrual}
            currency={op.currency}
            dealId={op?.sales_transactions_id}
            toCurrency={op?.to_currenies_kod}
          />
        </div>

      </div>

      {open && op.operationParts?.map(part => {
        return <div
          key={part.id}
          className={cn(
            'flex text-mini gap-1 items-stretch bg-neutral-50/50 border-b border-neutral-100 min-h-10 transition-colors hover:bg-neutral-50',
          )}
        >
          {/* Empty Space for Checkbox + padding for index */}
          <div className={!toggleOperation ? "w-32" : "w-40"} />

          {/* Date Part */}
          <div className="w-40 flex px-2 py-1 items-center justify-start  pl-4">
            <span className="text-[11px] text-gray-500 font-medium">↳ {part?.accrualDate}</span>
          </div>

          {/* Empty Account (Part inherits parent account) */}
          <div className="w-15 " />

          {/* Type Icon Part */}
          <div className="w-14 flex px-1 items-center justify-center ">
            {part.tip && (
              <div className="scale-[0.7] opacity-60">
                {part.tip === 'Поступление' ? <TypeIncomeIcon /> : <TypeExpenseIcon />}
              </div>
            )}
          </div>

          {/* Counterparty Part */}
          <div className="w-52 flex-1 flex px-2 py-1 items-center justify-start ">
            <span className="text-xs text-gray-600  ">{part.counterparty || ''}</span>
          </div>

          {/* Statya Part */}
          <div className="flex-1 flex px-2 py-1 items-center justify-start ">
            <span className="text-xs text-gray-600 line-clamp-1">{part.chartOfAccounts}</span>
          </div>

          {/* Price Part */}
          <div className="w-40 flex px-2 py-1 items-center justify-end ">
            <PriceStatus
              amount={part.summa}
              tab={part?.tip}
              type={part?.tip}
              percent={part?.percent}
              confirmed={part.payment_confirmed}
              accrual={part.payment_accrual}
              currency={part.currency}
              dealId={op?.sales_transactions_id}
            />
          </div>

        </div>
      })}
    </>
  )
})
export default IncomePaymentTableRow