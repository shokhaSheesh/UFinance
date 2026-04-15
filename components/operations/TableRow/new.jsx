import { cn } from '@/app/lib/utils'
import { OperationMenu } from '@/components/operations/OperationsTable/OperationMenu'
import PriceStatus from '@/components/operations/PriceStatus'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { ExpendClose, ExpendOpen, ShipmentIcon, TypeExpenseIcon, TypeIncomeIcon, TypeTransferIcon } from '../../../constants/icons'
import { operationFilterStore } from '../../../store/operationFilter.store'
import styles from './style.module.scss'

const TableRow = observer(({
  op,
  selectedOperations,
  toggleOperation,
  openOperationModal,
  handleEditOperation,
  handleDeleteOperation,
  handleCopyOperation,
  counterpartyGuid,
  showIndex
}) => {
  const [open, setOpen] = useState(false)
  const children = new Set()
  const chartofaccounts = new Set()
  const deals = new Set()
  const isSpinasiya = !operationFilterStore?.selectedFilters?.includes('Списание')
  const isZachisleniya = !operationFilterStore?.selectedFilters?.includes('Зачисление')
  const isDebit = !operationFilterStore?.selectedFilters?.includes('Дебет')
  const isCredit = !operationFilterStore?.selectedFilters?.includes('Кредит')

  op.operationParts?.forEach(part => {
    children.add(part?.counterparties_id)
    chartofaccounts.add(part?.chart_of_accounts_id)
  })

  const titleContragent = useMemo(() => {
    if (op.tip == "Начисление") return op.counterparty || '[Начисление]'
    if (children.size === 1 && children.has(counterpartyGuid)) {
      return op.counterparty || ''
    } else if (children.size > 1) {
      return `${children.size || 2} [контрагента]`
    } else {
      return op.counterparty || ''
    }
  }, [children, counterpartyGuid, op.counterparty])

  const titleChartOfAccounts = useMemo(() => {
    if (chartofaccounts.size === 1) {
      return op.chartOfAccounts || ''
    } else if (chartofaccounts.size > 1) {
      return `${chartofaccounts.size || 2} [статьи]`
    } else {
      return op.chartOfAccounts || ''
    }
  }, [chartofaccounts, op.chartOfAccounts])

  const titleDeals = useMemo(() => {
    if (op.tip == "Начисление" && op.sales_transaction_name && op.sales_transaction_name_2) {
      return {
        title: '2 [сделки]',
        children: [
          op.sales_transaction_name,
          op.sales_transaction_name_2
        ]
      }
    } else if (op.sales_transaction_name || op.sales_transaction_name_2) {
      return {
        title: op.sales_transaction_name || op.sales_transaction_name_2 || '',
        children: []
      }
    } else {
      return {
        title: '',
        children: []
      }
    }
  }, [op.deal])

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
          selectedOperations.includes(op.id) && styles.selected
        )}
        onClick={e => {
          if (!e.target.closest('input') && !e.target.closest('button')) {
            openOperationModal(op)
          }
        }}
      >
        {/* Checkbox/Index */}
        {(toggleOperation || showIndex) && (
          <div
            className="min-w-10 flex items-center justify-center px-1"
            onClick={e => e.stopPropagation()}
          >
            {toggleOperation ? (
              <OperationCheckbox
                checked={selectedOperations.includes(op.id)}
                onChange={() => toggleOperation(op.id)}
              />
            ) : (
              <span className="text-xs text-gray-500">{showIndex}</span>
            )}
          </div>
        )}

        {/* Date */}
        <div className={cn('min-w-32 flex py-1 items-center justify-start ', isActive && styles.activeRow)}>
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
            <div className={cn(styles.typeIcon, 'scale-75')}>
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
                <span className={cn('text-sm line-clamp-1 w-full', isSpinasiya && 'opacity-50')}>[Перемещение списание]</span>
                <span className={cn('text-sm line-clamp-1 w-full', isZachisleniya && 'opacity-50')}>[Перемещение зачисление]</span>
              </>
            ) : (op.tip === "Поступление" || op.tip === "Выплата") ? (
              <>
                <span className="text-sm  truncate w-full">{titleChartOfAccounts}</span>
                {op.opisanie && <span className='text-sm text-neutral-400 line-clamp-1 w-full'>{op.opisanie}</span>}
              </>
            ) : op?.tip === "Начисление" ? (
              <>
                <span className={cn('text-sm line-clamp-1 w-full', isDebit && 'opacity-50')}>{op.chartOfAccounts} [по дебету]</span>
                <span className={cn('text-sm line-clamp-1 w-full', isCredit && 'opacity-50')}>{op.chartOfAccounts2} [по кредиту]</span>
              </>
            ) : (op?.tip === "Отгрузка") && (
              <span className="text-sm line-clamp-1  w-full">{op.chartOfAccounts}</span>
            )}
          </div>
        </div>

        {/* Project/Deal */}
        <div className={cn('flex-1 flex px-2 py-1 items-center justify-center  min-w-20', isActive && styles.activeRow)}>
          {(op.tip === "Поступление" || op.tip === "Выплата" || op.tip === "Отгрузка") && (
            <p className={cn('text-xs text-neutral-600 truncate w-full text-center', textPrimary)} title={op?.selling_deal_name}>{op?.selling_deal_name || '-'}</p>
          )}
          {op.tip === "Начисление" && (
            <div className='flex flex-col items-center justify-center relative group w-full'>
              {titleDeals?.children?.length === 0 ? (
                <p className={cn('text-xs truncate w-full text-center', !op.payment_accrual && 'text-primary')}>{titleDeals?.title || '-'}</p>
              ) : (
                <>
                  <span className="text-xs text-center truncate w-full font-medium">{titleDeals?.title}</span>
                  <div className='absolute hidden group-hover:block space-y-1 w-48 z-50 bg-white shadow-xl rounded-md p-2 top-full ring-1 ring-black/5'>
                    {titleDeals?.children?.map((child, idx) => (
                      <p key={idx} className='text-[11px] text-gray-600  pb-1 last:border-0'>{child}</p>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
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
            dealId={op?.selling_deal_id}
            toCurrency={op?.to_currenies_kod}
          />
        </div>

        {/* Menu (Actions) */}
        <div
          className="w-5 flex items-center justify-center px-1"
          onClick={e => e.stopPropagation()}
        >
          <OperationMenu
            operation={op}
            onEdit={handleEditOperation}
            onDelete={handleDeleteOperation}
            onCopy={handleCopyOperation}
          />
        </div>
      </div>

      {/* Child Rows (Operation Parts) */}
      {open && op.operationParts?.map(part => (
        <div
          key={part.id}
          className={cn(
            'flex text-mini gap-1 items-stretch bg-neutral-50/50 border-b border-neutral-100 min-h-10 transition-colors hover:bg-neutral-50',
            counterpartyGuid && counterpartyGuid !== part?.counterparties_id && 'opacity-40 grayscale-[0.5] pointer-events-none'
          )}
          onClick={e => {
            if (!e.target.closest('input') && !e.target.closest('button') && (!counterpartyGuid || counterpartyGuid === part?.counterparties_id)) {
              openOperationModal(part)
            }
          }}
        >
          {/* Empty Space for Checkbox + padding for index */}
          <div className={!toggleOperation ? "w-24" : "w-36"} />

          {/* Date Part */}
          <div className="w-32 flex px-2 py-1 items-center justify-start  pl-4">
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
          <div className="w-52 flex px-2 py-1 items-center justify-start ">
            <span className="text-xs text-gray-600  ">{part.counterparty || ''}</span>
          </div>

          {/* Statya Part */}
          <div className="flex-1 flex px-2 py-1 items-center justify-start ">
            <span className="text-xs text-gray-600 line-clamp-1">{part.chartOfAccounts}</span>
          </div>

          {/* Deal Part */}
          <div className="flex-1 flex px-2 py-1 items-center justify-center ">
            <span className="text-xs text-gray-500 ">{part?.selling_deal_name || '-'}</span>
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
              dealId={op?.selling_deal_id}
            />
          </div>

          {/* Empty Menu Space for children */}
          {/* <div className="w-8" /> */}
        </div>
      ))}
    </>
  )
})

export default TableRow