import { cn } from '@/app/lib/utils'
import PriceStatus from '@/components/operations/PriceStatus'
import { ExpendClose, ExpendOpen, ShipmentIcon, TypeExpenseIcon, TypeIncomeIcon, TypeTransferIcon } from '@/constants/icons'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { formatAmount, formatNumber } from '../../../../../utils/helpers'

const IncomePaymentTableRow = observer(({
  op,
  tip
}) => {
  const [open, setOpen] = useState(false)
  const children = new Set()
  const chartofaccounts = new Set()

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
      <tr key={op.guid} className=" text-xs! border-b ">
        {/* date */}
        <td className={`px-4 py-4 ${textPrimary}`}>
          <div>
            {op.operationParts?.length > 0 ? <>
              <div className={"flex items-center gap-2 cursor-pointer"} onClick={(event) => { event.stopPropagation(); setOpen(!open) }}>
                {open ? <ExpendClose /> : <ExpendOpen />}
                <span>{op?.operationDate}</span>
              </div>
            </> : <div className='flex flex-col items-start'>
              <span className=''>{op?.operationDate}</span>
              {isDifferentDate && <span className="text-mini text-neutral-400">{op?.accrualDate}</span>}
            </div>}
          </div>
        </td>
        {/* tip */}
        <td className=" text-center">
          {op.tip ? (
            <div className='flex justify-center items-center h-full'>
              {op.tip === 'Поступление' ? (
                <TypeIncomeIcon className="text-green-700" />
              ) : op.tip === 'Выплата' ? (
                <TypeExpenseIcon className="text-red-700" />
              ) : op.tip === 'Перемещение' ||
                op.tip === 'Начисление' ? (
                <TypeTransferIcon className="text-slate-700" />
              ) : op.tip === 'Отгрузка' && <ShipmentIcon />}
            </div>
          ) : null}
        </td>
        {/* counterparty */}
        <td className={` px-2 ${textPrimary}`}>
          {op?.tip === 'Перемещение' ? op?.my_account_name : <>
            <p>{titleContragent}</p></>}
          {op?.tip === 'Начисление' && "[Начисление]"}
        </td>
        {/* statya */}
        <td className={` px-2 ${textPrimary}`}>
          {op?.tip == "Перемещение" && <p >
            {op?.my_account_name2}
          </p>}
          {(op.tip === "Поступление" || op.tip === "Выплата") && <div className={`flex flex-col items-start `}>
            <span className={`text-neutral-700 ${textPrimary}`}>{titleChartOfAccounts}</span>
            <span className='text-neutral-400'>{op.opisanie}</span>
          </div>}
          {op?.tip === 'Начисление' && <div className={`flex flex-col items-start `}>
            <span className={`text-neutral-600 ${textPrimary}`}>{op?.chartOfAccounts}</span>
            <span className='text-neutral-600'>{op.chartOfAccounts2}</span>
          </div>}
          {op?.tip === 'Отгрузка' && <div className={`flex flex-col items-start `}>
            <span className={`text-neutral-600 ${textPrimary}`}>{op?.chartOfAccounts}</span>
          </div>}
        </td>
        {/* price */}
        <td className={'pr-4'} onClick={e => e.stopPropagation()}>
          <div className="flex flex-col items-end">
            {(op?.tip === 'Перемещение') && (
              <>
                <span className={cn('text-neutral-700', tip !== 'Перемещения' && 'text-red-500', tip === 'Зачисления' && 'hidden')}>- {formatAmount((op?.summa))} {op?.currency}</span>
                <span className={cn('text-neutral-700', tip === 'Зачисления' && 'text-green-700', tip === 'Списания' && 'hidden')}>+ {formatAmount((op?.to_amount))} {op?.to_currenies_kod}</span>
              </>
            )}

            {(op?.tip === 'Поступление' || op?.tip === 'Выплата') && (
              <>
                <span className={cn('text-neutral-700', op?.tip === 'Выплата' && 'text-red-600', op?.tip === 'Поступление' && 'text-green-700')}>{op?.tip === 'Выплата' ? '-' : '+'}{formatAmount((op?.summa))} {op?.currency}</span>
              </>
            )}
            {(op?.tip === 'Начисление') && (
              <>
                <span className={cn('text-neutral-700')}>{op?.debit} {formatNumber((op?.summa))} {op?.currency}</span>
                <span className={cn('text-neutral-700')}>{op?.kredit} {formatNumber((op?.summa))} {op?.currency}</span>
              </>
            )}
            {(op?.tip === 'Отгрузка') && (
              <>
                <span className={cn('text-neutral-700')}>{op?.debit} {formatNumber((op?.summa))} {op?.currency}</span>
                <span className={cn('text-neutral-700')}>{op?.kredit} {formatNumber((op?.summa))} {op?.currency}</span>
              </>
            )}
          </div>
        </td>
      </tr>
      {open &&
        op.operationParts?.map(part => {
          return (
            <tr
              key={part.id}
              className={"border-b bg-gray-50 h-10 text-sm!"}>
              <td className={" pl-10"}>
                {part?.accrualDate}
              </td>
              <td className={""}>
                {part.tip ? (
                  <div className='flex justify-center items-center h-full'>
                    {op.tip === 'Поступление' ? (
                      <TypeIncomeIcon className="text-green-700" />
                    ) : op.tip === 'Выплата' ? (
                      <TypeExpenseIcon className="text-red-700" />
                    ) : op.tip === 'Перемещение' ||
                      op.tip === 'Начисление' ? (
                      <TypeTransferIcon className="text-slate-700" />
                    ) : op.tip === 'Отгрузка' && <ShipmentIcon />}
                  </div>
                ) : null}
              </td>
              <td className={"px-2"}>
                {part.counterparty || ''}
              </td>
              <td className={" px-2"}>
                <div className={`flex flex-col items-start`}>
                  <span className='text-neutral-700'>{part.chartOfAccounts || ''}</span>
                  <span className='text-neutral-400'>{op.opisanie}</span>
                </div>
              </td>
              <td colSpan={3} className={""} onClick={e => e.stopPropagation()}>
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

export default IncomePaymentTableRow