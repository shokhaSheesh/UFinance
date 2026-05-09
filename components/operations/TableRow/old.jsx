import { cn } from '@/app/lib/utils'
import { OperationMenu } from '@/components/operations/OperationsTable/OperationMenu'
import PriceStatus from '@/components/operations/PriceStatus'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { ExpendClose, ExpendOpen, ShipmentIcon, TypeExpenseIcon, TypeIncomeIcon, TypeTransferIcon } from '../../../constants/icons'
import { operationFilterStore } from '../../../store/operationFilter.store'
import styles from './style.module.scss'

const OperationTableRow = observer(({
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
        return !op.payment_shipment && 'text-primary'
      case 'Перемещение':
        return !op.payment_confirmed && 'text-primary'
      default:
        return ''
    }
  }, [op])


  return (
    <>
      <tr
        key={op.id}
        className={cn(
          styles.tableRow,
          selectedOperations.includes(op.id) && styles.selected
        )}
        onClick={e => {
          if (!e.target.closest('input') && !e.target.closest('button')) {
            openOperationModal(op)
          }
        }}
        style={{ backgroundColor: 'red !important' }}
      >
        {/*  checkbox */}
        {(toggleOperation || showIndex) && <td
          className={cn(styles.tableCell, styles.tableCellIndex)}
          onClick={e => e.stopPropagation()}
        >
          {toggleOperation ? <OperationCheckbox
            checked={selectedOperations.includes(op.id)}
            onChange={() => toggleOperation(op.id)}
          /> : <span>{showIndex}</span>}
        </td>}
        {/* date */}
        <td className={cn(styles.tableCell, styles.dateCell, isActive && styles.activeRow)}>
          <div className={cn(textPrimary)}>
            {op.operationParts?.length > 0 ? <>
              <div className={styles.childrenControl} onClick={(event) => { event.stopPropagation(); setOpen(!open) }}>
                {open ? <ExpendClose /> : <ExpendOpen />}
                <span>{op?.operationDate}</span>
              </div>
            </> : <div className='flex flex-col items-start'>
              <span className=''>{op?.operationDate}</span>
              {isDifferentDate && <span className="text-mini text-neutral-400">{op?.accrualDate}</span>}
            </div>}
          </div>
        </td>
        {/* shot */}
        <td className={cn(styles.tableCell, styles.accountCell, isActive && styles.activeRow)}>
          {op?.tip == "Перемещение" && <>
            <div className={cn('flex flex-col items-start', textPrimary)}>
              <span>{op.my_account_name}</span>
              <span>{op.my_account_name2}</span>
            </div>
          </>}
          {(op.tip === "Поступление" || op.tip === "Выплата") && <div className={cn('flex flex-col items-start', textPrimary)}>
            <span>{op.my_account_name}</span>
          </div>}
          {(op?.tip == "Начисление" || op?.tip == "Отгрузка") && <>
            <div className={cn('flex flex-col items-start', textPrimary)}>
              <span>[{op.legal_entity_name}]</span>
            </div>
          </>}
        </td>
        {/* tip */}
        <td className={styles.tableCell}>
          {op.tip ? (
            <div className={styles.typeIcon}>
              {op.tip === 'Поступление' ? (
                <TypeIncomeIcon />
              ) : op.tip === 'Выплата' ? (
                <TypeExpenseIcon />
                ) : op.tip === 'Перемещение' ||
                  op.tip === 'Начисление' ? (
                <TypeTransferIcon />
              ) : op.tip === 'Отгрузка' && <ShipmentIcon />}
            </div>
          ) : null}
        </td>
        {/* counterparty */}
        <td className={cn(styles.tableCell, styles.counterpartyCell, isActive && styles.activeRow)}>
          <p className={cn('flex flex-col items-start', textPrimary)}>{titleContragent}</p>
        </td>
        {/* statya */}
        <td className={cn(styles.tableCell, styles.statusCell, isActive && styles.activeRow)}>
          {op?.tip == "Перемещение" && <div className={cn('flex flex-col items-start', textPrimary)}>
            <span className={`${isSpinasiya ? 'opacity-50' : ''}`}>[Перемещение - списание]</span>
            <span className={`${isZachisleniya ? 'opacity-50' : ''}`}>[Перемещение - зачисление]</span>
          </div>}
          {(op.tip === "Поступление" || op.tip === "Выплата") && <div className={cn('flex flex-col items-start', textPrimary)}>
            <span className={`text-neutral-700 ${textPrimary}`}>{titleChartOfAccounts}</span>
            <span className='text-neutral-400'>{op.opisanie}</span>
          </div>}
          {op?.tip == "Начисление" && <div className={cn('flex flex-col items-start', textPrimary)}>
            <span className={`line-clamp-1 ${isDebit ? 'opacity-50' : ''}`}>{op.chartOfAccounts} [по дебету]</span>
            <span className={`line-clamp-1 ${isCredit ? 'opacity-50' : ''}`}>{op.chartOfAccounts2} [по кредиту]</span>
          </div>}
          {(op?.tip == "Отгрузка") && <div className={`flex flex-col items-start ${textPrimary}`}>
            <span>{op.chartOfAccounts}</span>
          </div>}
        </td>
        {/* project */}
        {/* <td className={cn(styles.tableCell, isActive && styles.activeRow)}>{op?.project_name || '-'}</td> */}
        {/* zdelka */}
        <td className={cn(styles.tableCell, isActive && styles.activeRow)}>
          {(op.tip === "Поступление" || op.tip === "Выплата" || op.tip === "Отгрузка") && <p className={`text-neutral-700 ${textPrimary}`}>{op?.selling_deal_name || '-'}</p>}
          {(op.tip === "Начисление") && <div className='flex flex-col items-start relative group text-neutral-700'>
            {titleDeals?.children?.length === 0 && <p className={`${!op.payment_accrual && 'text-primary'}`}>{titleDeals?.title || ''}</p>}
            {titleDeals?.children?.length > 0 && <>
              {titleDeals?.title || '-'}
              <div className='absolute hidden group-hover:block space-y-1 w-32  z-50 bg-white shadow-md rounded-md p-2 top-[130%] -left-10 ring-1 ring-gray-200'>
                {titleDeals?.children?.map(child => (
                  <p key={child.id} className=' flex items-start line-clamp-1'>
                    {child}
                  </p>
                ))}
              </div></>}
          </div>}
        </td>
        {/* price */}
        <td className={styles.tableCell} onClick={e => e.stopPropagation()}>
          <PriceStatus
            amount={op.summa}
            toAmount={op.to_amount}
            tab={op.tip}
            type={op?.tip}
            percent={op?.percent}
            confirmed={op.payment_confirmed}
            accrual={op.payment_accrual}
            currency={op.currency}
            dealId={op?.selling_deal_id}
            toCurrency={op?.to_currenies_kod}
          />
        </td>
        <td
          className={cn("group w-8")}
          onClick={e => e.stopPropagation()}
        >
          <OperationMenu
            operation={op}
            onEdit={handleEditOperation}
            onDelete={handleDeleteOperation}
            onCopy={handleCopyOperation}
          />
        </td>
      </tr>
      {open &&
        op.operationParts?.map(part => {
          return (
            <tr
              key={part.id}
              className={`${styles.tableRow} ${styles.child} ${counterpartyGuid && counterpartyGuid !== part?.counterparties_id ? styles.disabled : ''}`}
            >
              <td colSpan={2}
                className={cn(styles.tableCell, styles.tableCellIndex)}
              />
              <td className={cn(styles.tableCell, styles.dateCell)}>
                {part?.accrualDate}
              </td>
              <td className={styles.tableCell}>
                {part.tip ? (
                  <div className={styles.typeIcon}>
                    {part.tip === 'Поступление' ? (
                      <TypeIncomeIcon />
                    ) : part.tip === 'Выплата' ? (
                        <TypeExpenseIcon />
                    ) : null}
                  </div>
                ) : null}
              </td>
              <td className={cn(styles.tableCell, styles.counterpartyCell)}>
                {part.counterparty || ''}
              </td>
              <td className={cn(styles.tableCell, styles.statusCell)}>
                {part.chartOfAccounts}
              </td>
              {/* <td className={styles.tableCell}>{part?.project_name || '-'}</td> */}
              <td className={styles.tableCell}>{part?.selling_deal_name || '-'}</td>
              <td colSpan={2} className={styles.tableCell} onClick={e => e.stopPropagation()}>
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
              </td>
            </tr>
          )
        })}
    </>
  )
})

export default OperationTableRow