'use client'

import { mobileOperationLook } from '@/constants/operationTypes'
import { MAmountField, MDateField, MFieldRow, MSelectField, MSwitch, MTextField } from '@/components/mobile/fields'
import { MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import operationDto from '@/lib/dtos/operationDto'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { formatDecimal, StringtoNumber } from '@/utils/helpers'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowDownUp, ArrowLeftRight, ArrowUpRight, Loader2, Scale } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

/**
 * Операция на телефоне — отдельный экран, а не настольное окно.
 *
 * В окне с большого экрана подпись занимает половину строки, вкладки типов
 * наезжают друг на друга, а кнопка сохранения уходит за нижний край. Здесь:
 * сначала крупная сумма, ниже — строки, каждая открывает выбор панелью
 * снизу, внизу экрана закреплена одна кнопка. Назад — стрелка в шапке.
 *
 * Поля — те, что нужны в дороге. Разбивка суммы по статьям, повторы и
 * проекты остаются на большом экране: на телефоне их заполняют редко, а
 * форму они удлиняют вдвое.
 */

const TYPES = [
  { key: 'income', tip: 'Поступление', icon: ArrowDownLeft, tone: 'in', label: 'modal.tabIncome', permission: 'income' },
  { key: 'payment', tip: 'Выплата', icon: ArrowUpRight, tone: 'out', label: 'modal.tabPayment', permission: 'payout' },
  { key: 'transfer', tip: 'Перемещение', icon: ArrowLeftRight, tone: 'neutral', label: 'modal.tabTransfer', permission: 'transfer' },
  { key: 'accrual', tip: 'Начисление', icon: Scale, tone: 'neutral', label: 'modal.tabAccrual', permission: 'accrual' },
]

/** Листья плана счетов нужного раздела, с путём в подписи. */
const flattenArticles = (nodes = [], rootName, path = []) => {
  const result = []
  nodes.forEach((node) => {
    const name = node?.nazvanie
    const nextPath = path.length || !rootName ? [...path, name] : [name]
    const children = node?.children || []
    // ветку выбираем только внутри нужного раздела плана счетов
    if (!path.length && rootName && name !== rootName) return
    if (children.length) {
      result.push(...flattenArticles(children, rootName, nextPath))
    } else if (node?.guid) {
      result.push({ value: node.guid, label: name, sub: nextPath.slice(0, -1).join(' · ') })
    }
  })
  return result
}

/** Заголовок группы полей. */
const GroupTitle = ({ children }) => (
  <div className="px-1 pt-5 pb-2.5 text-[15px] font-bold text-slate-900">{children}</div>
)

const MobileOperationFormPage = observer(() => {
  const t = useTranslations('Operations')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const editGuid = searchParams.get('guid')
  // копия: поля заполняем из чужой операции, но сохраняем как новую
  const copyGuid = searchParams.get('copy')
  const sourceGuid = editGuid || copyGuid

  const [type, setType] = useState(searchParams.get('type') || 'income')
  const [amount, setAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'))
  const [account, setAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  // Из сделки форма открывается уже привязанной к ней и к её контрагенту
  const [counterparty, setCounterparty] = useState(searchParams.get('counterparty') || '')
  const [article, setArticle] = useState('')
  const [article2, setArticle2] = useState('')
  const [deal, setDeal] = useState(searchParams.get('deal') || '')
  // Выплата по закупке: у закупки своё поле, в списке сделок продаж её нет
  const [purchaseDeal, setPurchaseDeal] = useState(searchParams.get('purchase') || '')
  const purchaseName = searchParams.get('purchaseName') || ''
  // Куда вернуться после сохранения — обратно в сделку, если пришли из неё
  const backHref = searchParams.get('back')
  const [purpose, setPurpose] = useState('')
  const [confirmPayment, setConfirmPayment] = useState(true)
  const [confirmAccrual, setConfirmAccrual] = useState(true)
  const [errors, setErrors] = useState({})

  const current = TYPES.find((item) => item.key === type) || TYPES[0]
  const permissions = appStore.permission?.operations || {}
  const availableTypes = TYPES.filter(({ permission }) => permissions?.[permission]?.add)

  // ── Списки для выбора ─────────────────────────────────────────────────────
  const { data: accounts = [], isLoading: loadingAccounts } = useUcodeRequestQuery({
    method: 'get_my_accounts',
    data: { page: 1, limit: 100, active: true },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const { data: counterparties = [], isLoading: loadingCounterparties } = useUcodeRequestQuery({
    method: 'get_counterparties',
    data: { page: 1, limit: 200 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const { data: chartOfAccounts = [], isLoading: loadingArticles } = useUcodeRequestQuery({
    method: 'get_chart_of_accounts',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const { data: deals = [], isLoading: loadingDeals } = useUcodeRequestQuery({
    method: 'get_sales_list_simple',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const accountOptions = useMemo(
    () =>
      accounts.map((item) => ({
        value: item?.guid,
        label: item?.nazvanie,
        sub: [item?.legal_entity_name, item?.currenies_kod].filter(Boolean).join(' · '),
        currency: item?.currenies_id,
        currencyCode: item?.currenies_kod,
        balance: Number(item?.balans_val) || 0,
      })),
    [accounts]
  )

  const counterpartyOptions = useMemo(
    () => counterparties.map((item) => ({ value: item?.guid, label: item?.nazvanie || item?.name })),
    [counterparties]
  )

  const articleRoot = type === 'income' ? 'Доходы' : type === 'payment' ? 'Расходы' : null
  const articleOptions = useMemo(
    () => flattenArticles(chartOfAccounts, articleRoot),
    [chartOfAccounts, articleRoot]
  )
  const allArticleOptions = useMemo(() => flattenArticles(chartOfAccounts, null), [chartOfAccounts])

  const dealOptions = useMemo(
    () => deals.map((item) => ({ value: item?.guid, label: item?.nazvanie || item?.name })),
    [deals]
  )

  const selectedAccount = accountOptions.find((item) => item.value === account)
  const targetAccount = accountOptions.find((item) => item.value === toAccount)
  // при одинаковых валютах вторая сумма равна первой и не редактируется
  const sameCurrency = !targetAccount || targetAccount.currency === selectedAccount?.currency
  const currencyCode = selectedAccount?.currencyCode || appStore.currency?.code || ''

  // ── Изменение существующей операции ───────────────────────────────────────
  const { data: editing, isLoading: loadingOperation } = useQuery({
    queryKey: ['get_operation', sourceGuid],
    queryFn: () => apiClient.invokeFunction({ method: 'get_operation', data: { guid: sourceGuid } }),
    enabled: Boolean(sourceGuid),
    select: (response) => operationDto(response?.data?.data),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (!editing) return
    setType(editing.operationType === 'payment' ? 'payment' : editing.operationType || 'income')
    setAmount(String(editing.summa ?? ''))
    setToAmount(String(editing.to_amount ?? ''))
    setDate(moment(editing.data_operatsii).format('YYYY-MM-DD'))
    setAccount(editing.my_accounts_id || '')
    setToAccount(editing.my_accounts_id_2 || '')
    setCounterparty(editing.counterparties_id || '')
    setArticle(editing.chart_of_accounts_id || '')
    setArticle2(editing.chart_of_accounts_id_2 || '')
    setDeal(editing.sales_transactions_id || '')
    setPurchaseDeal(editing.purchase_transactions_id || '')
    setPurpose(editing.opisanie || editing.comment || '')
    setConfirmPayment(Boolean(editing.payment_confirmed))
    setConfirmAccrual(Boolean(editing.payment_accrual))
  }, [editing])

  // ── Сохранение ────────────────────────────────────────────────────────────
  const { mutateAsync: saveOperation, isPending } = useUcodeRequestMutation()

  const validate = () => {
    const next = {}
    if (!StringtoNumber(amount)) next.amount = t('forms.errors.amountRequired')
    if (type !== 'accrual' && !account) next.account = tc('required')
    if (type === 'transfer' && !toAccount) next.toAccount = tc('required')
    if (type === 'accrual' && !article) next.article = tc('required')
    if (type === 'accrual' && !article2) next.article2 = tc('required')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildPayload = () => {
    const summa = formatDecimal(StringtoNumber(amount))
    const operationDate = moment(date).format('YYYY-MM-DD')
    const base = {
      tip: [current.tip],
      summa,
      data_operatsii: operationDate,
      legal_entity_id: authStore?.userData?.legal_entity_id || null,
      comment: purpose,
      currenies_id: selectedAccount?.currency || appStore.currency?.guid,
      ...(editGuid ? { guid: editGuid } : {}),
    }

    if (type === 'transfer') {
      return {
        ...base,
        data_nachisleniya: operationDate,
        payment_confirmed: confirmPayment,
        payment_accrual: false,
        my_accounts_id: account,
        my_accounts_id_2: toAccount,
        to_amount: sameCurrency ? summa : formatDecimal(StringtoNumber(toAmount)),
        to_currenies_id: accountOptions.find((item) => item.value === toAccount)?.currency,
        opisanie: purpose,
      }
    }

    if (type === 'accrual') {
      return {
        ...base,
        payment_accural: confirmAccrual,
        chart_of_accounts_id: article,
        chart_of_accounts_id_2: article2,
        sales_transactions_id: deal || null,
      }
    }

    return {
      ...base,
      data_nachisleniya: operationDate,
      payment_confirmed: confirmPayment,
      payment_accrual: confirmAccrual,
      my_accounts_id: account,
      chart_of_accounts_id: article || null,
      counterparties_id: counterparty || null,
      sales_transactions_id: deal || null,
      ...(purchaseDeal ? { purchase_transactions_id: purchaseDeal } : {}),
    }
  }

  const submit = async () => {
    if (!validate()) return
    try {
      await saveOperation({ method: editGuid ? 'update_operation' : 'create_operation', data: buildPayload() })
      showSuccessNotification(editGuid ? tc('saved') : tm('form.created'))
      queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })
      queryClient.invalidateQueries({ queryKey: ['get_operations_total'] })
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['get_purchase_transaction_by_guid'] })
      router.push(backHref && backHref.startsWith('/m') ? backHref : '/m/transactions')
    } catch (error) {
      showErrorNotification(error?.message || tm('form.saveFailed'))
    }
  }

  const busy = isPending || (Boolean(sourceGuid) && loadingOperation)

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader
          title={editGuid ? t('modal.editTitle') : t('modal.createTitle')}
          onBack={() => router.back()}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Тип операции — только при создании */}
        {!editGuid && availableTypes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none]">
            {availableTypes.map((item) => {
              const active = item.key === type
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setType(item.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold',
                    // выбранный тип — заливкой своего цвета, остальные — цветным значком
                    active ? mobileOperationLook(item.tip).solid : 'bg-white text-slate-600'
                  )}
                >
                  <Icon size={15} className={active ? undefined : mobileOperationLook(item.tip).text} aria-hidden="true" />
                  {t(item.label)}
                </button>
              )
            })}
          </div>
        )}

        {type === 'transfer' ? (
          /* Перемещение: два счёта друг над другом и кнопка «поменять местами» */
          <div className="relative">
            <div className="rounded-[24px] bg-white px-4 py-4">
              <div className="text-[12px] text-slate-500">{tm('form.fromAccount')}</div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-[30px] leading-none font-bold tracking-[-0.02em] tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
                />
                <MSelectField
                  variant="pill"
                  label={tm('form.fromAccount')}
                  placeholder={tm('form.choose')}
                  value={account}
                  onChange={setAccount}
                  options={accountOptions}
                  loading={loadingAccounts}
                  avatars
                />
              </div>
              {errors.account && <div className="mt-2 text-xs text-red-600">{errors.account}</div>}
              {selectedAccount && (
                <div className="mt-2 text-right text-[12px] text-slate-400">
                  {tm('form.available')} {Math.round(selectedAccount.balance).toLocaleString('ru-RU')}{' '}
                  {selectedAccount.currencyCode}
                </div>
              )}
            </div>

            <div className="relative z-10 -my-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  // меняем счета местами — частый случай «перепутал направление»
                  setAccount(toAccount)
                  setToAccount(account)
                }}
                aria-label={tm('form.swapAccounts')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#f4f5f7] bg-[#0e73f6] text-white active:bg-[#0b5fd4]"
              >
                <ArrowDownUp size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="rounded-[24px] bg-white px-4 py-4">
              <div className="text-[12px] text-slate-500">{tm('form.toAccount')}</div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  inputMode="decimal"
                  value={sameCurrency ? amount : toAmount}
                  onChange={(event) => setToAmount(event.target.value)}
                  readOnly={sameCurrency}
                  placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-[30px] leading-none font-bold tracking-[-0.02em] tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
                />
                <MSelectField
                  variant="pill"
                  label={tm('form.toAccount')}
                  placeholder={tm('form.choose')}
                  value={toAccount}
                  onChange={setToAccount}
                  options={accountOptions.filter((item) => item.value !== account)}
                  loading={loadingAccounts}
                  avatars
                />
              </div>
              {errors.toAccount && <div className="mt-2 text-xs text-red-600">{errors.toAccount}</div>}
              {!sameCurrency && targetAccount && (
                <div className="mt-2 text-right text-[12px] text-slate-400">{tm('form.otherCurrency')}</div>
              )}
            </div>
          </div>
        ) : (
          <MAmountField value={amount} onChange={setAmount} currency={currencyCode} error={errors.amount} />
        )}

        <GroupTitle>{tm('form.groupMain')}</GroupTitle>
        <div className="flex flex-col gap-2">
          <MDateField label={t('columns.date')} required value={date} onChange={setDate} />

          {type !== 'accrual' && type !== 'transfer' && (
            <MSelectField
              label={t('columns.account')}
              required
              placeholder={tm('form.choose')}
              value={account}
              onChange={setAccount}
              options={accountOptions}
              loading={loadingAccounts}
              error={errors.account}
              avatars
            />
          )}
        </div>

        {(type === 'income' || type === 'payment') && (
          <>
            <GroupTitle>{tm('form.groupWhom')}</GroupTitle>
            <div className="flex flex-col gap-2">
              <MSelectField
                label={t('columns.counterparty')}
                placeholder={tm('form.choose')}
                value={counterparty}
                onChange={setCounterparty}
                options={counterpartyOptions}
                loading={loadingCounterparties}
                avatars
              />
              <MSelectField
                label={t('columns.statya')}
                placeholder={tm('form.choose')}
                value={article}
                onChange={setArticle}
                options={articleOptions}
                loading={loadingArticles}
              />
              {purchaseDeal ? (
                <MFieldRow label={tm('deals.deal')}>
                  <span className="truncate text-[16px] font-semibold text-slate-900">{purchaseName || '—'}</span>
                </MFieldRow>
              ) : (
                <MSelectField
                  label={t('columns.deal')}
                  placeholder={tm('form.choose')}
                  value={deal}
                  onChange={setDeal}
                  options={dealOptions}
                  loading={loadingDeals}
                />
              )}
            </div>
          </>
        )}

        {type === 'accrual' && (
          <>
            <GroupTitle>{tm('form.groupArticles')}</GroupTitle>
            <div className="flex flex-col gap-2">
              <MSelectField
                label={tm('form.debitArticle')}
                required
                placeholder={tm('form.choose')}
                value={article}
                onChange={setArticle}
                options={allArticleOptions}
                loading={loadingArticles}
                error={errors.article}
              />
              <MSelectField
                label={tm('form.creditArticle')}
                required
                placeholder={tm('form.choose')}
                value={article2}
                onChange={setArticle2}
                options={allArticleOptions}
                loading={loadingArticles}
                error={errors.article2}
              />
            </div>
          </>
        )}

        {/* Подтверждения */}
        <GroupTitle>{tm('form.groupConfirm')}</GroupTitle>
        <div className="flex flex-col gap-2">
          {type !== 'accrual' && (
            <MSwitch
              label={tm('form.confirmPayment')}
              hint={tm('form.confirmPaymentHint')}
              checked={confirmPayment}
              onChange={setConfirmPayment}
            />
          )}
          {type !== 'transfer' && (
            <MSwitch
              label={tm('form.confirmAccrual')}
              hint={tm('form.confirmAccrualHint')}
              checked={confirmAccrual}
              onChange={setConfirmAccrual}
            />
          )}
        </div>

        <GroupTitle>{tm('form.purpose')}</GroupTitle>
        <div className="flex flex-col gap-2">
          <MTextField
            label={tm('form.purpose')}
            value={purpose}
            onChange={setPurpose}
            placeholder={tm('form.purposePlaceholder')}
          />
        </div>

        {/* Что доступно только на большом экране */}
        <p className="px-2 pt-3 text-[11px] leading-relaxed text-slate-400">{tm('form.desktopOnly')}</p>
      </div>

      {/* Одна кнопка, закреплённая внизу */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] py-4 text-[16px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {busy && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {editGuid ? tc('save') : tc('create')}
        </button>
      </div>
    </div>
  )
})

export default MobileOperationFormPage
