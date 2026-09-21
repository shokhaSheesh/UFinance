import { CreditIcon, DebitIcon, WarnIcon } from '@/constants/icons'
import { cn } from '@/lib/utils'
import { operationFilterStore } from '@/store/operationFilter.store'
import { isPastDate } from '@/utils/formatDate'
import Money from '@/components/shared/Money'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import styles from './style.module.scss'

const PriceStatus = observer(({ amount, type, tab, confirmed, accrual, currency, dealId, op, percent, toCurrency, toAmount, debit, kredit, unconfirmed = false }) => {
  const t = useTranslations('Operations')
  const isSpinasiya = !operationFilterStore.selectedFilters?.includes('Списание')
  const isZachisleniya = !operationFilterStore.selectedFilters?.includes('Зачисление')
  const isDebit = !operationFilterStore.selectedFilters?.includes('Дебет')
  const isCredit = !operationFilterStore.selectedFilters?.includes('Кредит')

  const showWarning = (isPastDate(op?.data_operatsii) && ((confirmed && !accrual) || (!confirmed && accrual))) && !dealId && (op.tip === 'Поступление' || op.tip === 'Выплата')

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
      {confirmed && !accrual && (tab === 'Выплата') && !dealId && (
        <DebitIcon />
      )}
      {/* Credit icon (К) - показываем когда confirmed = true И НЕ accrual */}
      {confirmed && !accrual && (tab === 'Поступление') && !dealId && (
        <CreditIcon />
      )}
      {!confirmed && accrual && (tab === 'Выплата') && !dealId && (
        <CreditIcon />
      )}

      {showWarning && (
        <WarnIcon />
      )}

      {/* Неподтверждённая операция: раньше это обозначал синий цвет всей строки */}
      {unconfirmed && (
        <span
          title={t('filters.notConfirmed')}
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium leading-none text-slate-600 bg-slate-100 whitespace-nowrap"
        >
          {t('row.unconfirmedBadge')}
        </span>
      )}

      <div className={styles.amountText}>
        {tab == "Перемещение" && <>
          <div className={`${styles.doubleAccount} flex flex-col `}>
            <span className={`flex items-center gap-0.5 text-sm text-neutral-500 ${isSpinasiya ? 'opacity-50' : ''}`}><Money value={amount} sign="-" /> <span className="text-xs font-normal text-slate-500">{currency}</span></span>
            <span className={`flex items-center gap-0.5 text-sm text-neutral-500 ${isZachisleniya ? 'opacity-50' : ''}`}><Money value={toAmount} sign="+" /> <span className="text-xs font-normal text-slate-500">{toCurrency}</span></span>
          </div>
        </>}
        {(tab === 'Поступление' || tab === 'Выплата' || tab === 'Отгрузка' || tab === 'Поставка') && <>
          <div>
            <span className='flex items-center text-sm font-semibold justify-end gap-1'>
              <Money
                value={amount}
                sign={type == 'Поступление' ? '+' : type == 'Выплата' ? '-' : ''}
              />{' '}
              <span className="text-xs font-normal text-slate-500">{currency}</span>
              {percent ? <span className="text-xs font-normal text-slate-500">({percent})</span> : null}
            </span>
          </div></>
        }
        {tab == "Начисление" && <>
          <div className={` flex flex-1     flex-col `}>
            <span className={`flex items-center justify-end gap-0.5 text-sm text-neutral-500 ${isDebit ? 'opacity-50' : ''}`}>{debit}<Money value={amount} sign="" /> <span className="text-xs font-normal text-slate-500">{currency}</span></span>
            <span className={`flex items-center justify-end gap-0.5 text-sm text-neutral-500 ${isCredit ? 'opacity-50' : ''}`}>{kredit}<Money value={amount} sign="" /> <span className="text-xs font-normal text-slate-500">{currency}</span></span>
          </div>
        </>
        }
      </div>
    </div>
  )
})

export default PriceStatus