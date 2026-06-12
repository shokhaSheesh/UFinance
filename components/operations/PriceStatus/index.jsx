import { CreditIcon, DebitIcon, WarnIcon } from '@/constants/icons'
import { cn } from '@/lib/utils'
import { operationFilterStore } from '@/store/operationFilter.store'
import { isPastDate } from '@/utils/formatDate'
import { formatAmount } from '@/utils/helpers'
import { observer } from 'mobx-react-lite'
import styles from './style.module.scss'

const PriceStatus = observer(({ amount, type, tab, confirmed, accrual, currency, dealId, op, percent, toCurrency, toAmount, debit, kredit }) => {
  const isSpinasiya = !operationFilterStore.selectedFilters?.includes('Списание')
  const isZachisleniya = !operationFilterStore.selectedFilters?.includes('Зачисление')
  const isDebit = !operationFilterStore.selectedFilters?.includes('Дебет')
  const isCredit = !operationFilterStore.selectedFilters?.includes('Кредит')

  const showWarning = (isPastDate(op?.data_operatsii) && ((confirmed && !accrual) || (!confirmed && accrual))) && ((op.tip === 'Поступление' && !dealId) || op.tip === 'Выплата')

  return (
    <div
      className={cn(
        styles.container,
        tab === 'Поступление' && styles.positive,
        tab === 'Выплата' && styles.negative,
        tab === 'Перемещение' && styles.neutral
      )}
    >
      {/* Debit icon (Д) - показываем когда НЕ confirmed И accrual = true */}
      {!confirmed && accrual && (tab === 'Поступление') && !dealId && (
        <DebitIcon />
      )}
      {confirmed && !accrual && (tab === 'Выплата') && (
        <DebitIcon />
      )}
      {/* Credit icon (К) - показываем когда confirmed = true И НЕ accrual */}
      {confirmed && !accrual && (tab === 'Поступление') && !dealId && (
        <CreditIcon />
      )}
      {!confirmed && accrual && (tab === 'Выплата') && (
        <CreditIcon />
      )}

      {showWarning && (
        <WarnIcon />
      )}

      <div className={styles.amountText}>
        {tab == "Перемещение" && <>
          <div className={`${styles.doubleAccount} flex flex-col `}>
            <span className={`flex items-center gap-0.5 text-sm text-neutral-500 ${isSpinasiya ? 'opacity-50' : ''}`}>-{formatAmount(amount)} <span className=" text-neutral-500">{currency}</span></span>
            <span className={`flex items-center gap-0.5 text-sm text-neutral-500 ${isZachisleniya ? 'opacity-50' : ''}`}>+{formatAmount(toAmount)} <span className=" text-neutral-500">{toCurrency}</span></span>
          </div>
        </>}
        {(tab === 'Поступление' || tab === 'Выплата' || tab === 'Отгрузка') && <>
          <div>
            <span className='flex items-center text-sm justify-end gap-0.5'>{type == 'Поступление' ? '+' : type == 'Выплата' ? '-' : ''}{formatAmount(amount)} {currency} {percent ? `(${percent})` : ''}
            </span>
          </div></>
        }
        {tab == "Начисление" && <>
          <div className={` flex flex-1     flex-col `}>
            <span className={`flex items-center justify-end gap-0.5 text-sm text-neutral-500 ${isDebit ? 'opacity-50' : ''}`}>{debit}{formatAmount(amount)} <span className=" text-neutral-500">{currency}</span></span>
            <span className={`flex items-center justify-end gap-0.5 text-sm text-neutral-500 ${isCredit ? 'opacity-50' : ''}`}>{kredit}{formatAmount(amount)} <span className=" text-neutral-500">{currency}</span></span>
          </div>
        </>
        }
      </div>
    </div>
  )
})

export default PriceStatus