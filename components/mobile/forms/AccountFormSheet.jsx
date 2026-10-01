'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MDateField, MFieldRow, MSelectField } from '@/components/mobile/fields'
import { useCreateMyAccount, useUcodeRequestQuery, useUpdateMyAccount } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { formatAmountInput, formatDecimal, StringtoNumber } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Счёт: создание и правка.
 *
 * Поля те же, что в окне на компьютере: название, группа, юрлицо, тип,
 * реквизиты (у безналичного счёта и карты), номер (у электронного),
 * начальный остаток с датой, валюта и комментарий. Тип выбирается
 * четырьмя кнопками с текстом — без значков и цветов, как на главной. Мутации —
 * те же хуки, что у окна на компьютере.
 */

const TYPES = [
  { value: 'Наличный', label: 'types.cash' },
  { value: 'Безналичный', label: 'types.nonCash' },
  { value: 'Карта физлица', label: 'types.card' },
  { value: 'Электронный', label: 'types.electronic' },
]

const inputClass = 'w-full bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400'

export default function AccountFormSheet({ open, onClose, account }) {
  if (!open) return null
  return <AccountForm onClose={onClose} account={account} />
}

function AccountForm({ onClose, account }) {
  const t = useTranslations('Directories.account')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')

  const isEdit = Boolean(account?.guid)
  // ленивая инициализация: дата по умолчанию — сегодня
  const [form, setForm] = useState(() => ({
    name: account?.nazvanie || '',
    group: account?.account_groups_id || account?.account_group_id || account?.group_id || '',
    legalEntity: account?.legal_entity_id || '',
    type: (Array.isArray(account?.tip) ? account.tip[0] : account?.tip) || 'Наличный',
    bik: account?.bik || '',
    bank: account?.bank_name || account?.bank || '',
    accountNumber: account?.nomer_scheta || '',
    corrAccount: account?.kor_schet || account?.korr_schet || '',
    number: account?.nomer || '',
    balance: account?.nachalьnyy_ostatok_val ? formatAmountInput(account.nachalьnyy_ostatok_val) : '',
    date: (account?.data_sozdaniya ? moment.parseZone(account.data_sozdaniya) : moment()).format('YYYY-MM-DD'),
    currency: account?.currenies_id || appStore.currency?.guid || '',
    comment: account?.komentariy || '',
  }))
  const [errors, setErrors] = useState({})

  const createMutation = useCreateMyAccount()
  const updateMutation = useUpdateMyAccount()
  const saving = createMutation.isPending || updateMutation.isPending

  const { data: entities = [], isLoading: loadingEntities } = useUcodeRequestQuery({
    method: 'get_legal_entities',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })
  const { data: groups = [], isLoading: loadingGroups } = useUcodeRequestQuery({
    method: 'get_account_groups',
    data: { page: 1, limit: 100, search: '' },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 30 },
  })

  const entityOptions = useMemo(() => entities.map((item) => ({ value: item.guid, label: item.nazvanie })), [entities])
  const groupOptions = useMemo(
    () => groups.map((item) => ({ value: item.guid, label: item.name || item.nazvanie || tc('noName') })),
    [groups, tc]
  )
  const currencyOptions = useMemo(
    () =>
      (appStore.currencies || []).map((item) => ({
        value: item.guid,
        label: `${item?.kod || ''} (${item?.nazvanie || ''})`.trim(),
      })),
    []
  )

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const hasRequisites = form.type === 'Безналичный' || form.type === 'Карта физлица'

  const submit = async () => {
    const next = {}
    if (!form.name.trim()) next.name = t('errors.nameRequired')
    if (!form.legalEntity) next.legalEntity = t('errors.legalEntityRequired')
    setErrors(next)
    if (Object.keys(next).length) return

    // То же тело запроса, что отправляет окно на компьютере
    const payload = {
      nazvanie: form.name.trim(),
      tip: [form.type],
      nachalьnyy_ostatok: form.balance ? formatDecimal(StringtoNumber(form.balance)) : null,
      data_sozdaniya: form.date || null,
      currenies_id: form.currency || null,
      komentariy: form.comment || null,
      legal_entity_id: form.legalEntity || null,
      bik: form.bik || null,
      bank_name: form.bank || null,
      nomer: form.number,
      nomer_scheta: form.accountNumber,
      kor_schet: form.corrAccount || null,
      account_groups_id: form.group || null,
    }

    try {
      if (isEdit) {
        // архивный статус меняется отдельно — здесь сохраняем текущий
        await updateMutation.mutateAsync({ ...payload, guid: account.guid, is_archived: Boolean(account.is_archived) })
      } else {
        await createMutation.mutateAsync(payload)
      }
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })
      onClose()
    } catch {
      // уведомление об ошибке показывает сама мутация
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={isEdit ? t('editTitle') : t('createTitle')}
      className="h-[92vh]"
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {isEdit ? tc('save') : tc('create')}
        </button>
      }
    >
      <div className="flex flex-col gap-2 [&>button]:bg-slate-50">
        <MFieldRow label={t('fields.name')} required error={errors.name} className="bg-slate-50">
          <input
            autoFocus={!isEdit}
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder={t('placeholders.name')}
            className={cn(inputClass, 'font-semibold')}
          />
        </MFieldRow>

        {/* Тип счёта — четыре кнопки с текстом */}
        <div className="pt-1 pb-1">
          <div className="px-1 pb-2 text-[12px] text-slate-500">{t('types.type')}</div>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((type) => {
              const active = form.type === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => set('type', type.value)}
                  aria-pressed={active}
                  className={cn(
                    'h-11 truncate rounded-2xl border px-3 text-[14px] font-semibold transition-colors',
                    active ? 'border-[#0e73f6] bg-[#f5f9ff] text-[#0e73f6]' : 'border-slate-200 bg-white text-slate-700'
                  )}
                >
                  {t(type.label)}
                </button>
              )
            })}
          </div>
        </div>

        <MSelectField
          label={t('fields.legalEntity')}
          required
          placeholder={tm('form.choose')}
          value={form.legalEntity}
          onChange={(value) => set('legalEntity', value)}
          options={entityOptions}
          loading={loadingEntities}
          error={errors.legalEntity}
        />
        <MSelectField
          label={t('fields.group')}
          placeholder={tm('form.choose')}
          value={form.group}
          onChange={(value) => set('group', value)}
          options={groupOptions}
          loading={loadingGroups}
        />

        {/* Реквизиты — у безналичного счёта и карты */}
        {hasRequisites && (
          <>
            <MFieldRow label={t('fields.bank')} className="bg-slate-50">
              <input value={form.bank} onChange={(event) => set('bank', event.target.value)} className={inputClass} />
            </MFieldRow>
            <MFieldRow label={t('fields.bik')} className="bg-slate-50">
              <input inputMode="numeric" value={form.bik} onChange={(event) => set('bik', event.target.value)} className={inputClass} />
            </MFieldRow>
            <MFieldRow label={t('fields.accountNumber')} className="bg-slate-50">
              <input
                inputMode="numeric"
                value={form.accountNumber}
                onChange={(event) => set('accountNumber', event.target.value)}
                className={inputClass}
              />
            </MFieldRow>
            <MFieldRow label={t('fields.corrAccount')} className="bg-slate-50">
              <input
                inputMode="numeric"
                value={form.corrAccount}
                onChange={(event) => set('corrAccount', event.target.value)}
                className={inputClass}
              />
            </MFieldRow>
          </>
        )}

        {form.type === 'Электронный' && (
          <MFieldRow label={t('fields.number')} className="bg-slate-50">
            <input value={form.number} onChange={(event) => set('number', event.target.value)} className={inputClass} />
          </MFieldRow>
        )}

        <MFieldRow label={t('fields.initialBalance')} className="bg-slate-50">
          <input
            inputMode="decimal"
            value={form.balance}
            onChange={(event) => set('balance', formatAmountInput(event.target.value))}
            placeholder="0"
            className={cn(inputClass, 'font-semibold tabular-nums')}
          />
        </MFieldRow>
        <MDateField label={t('placeholders.selectDate')} value={form.date} onChange={(value) => set('date', value)} />

        <MSelectField
          label={t('fields.currency')}
          placeholder={tc('placeholders.selectCurrency')}
          value={form.currency}
          onChange={(value) => set('currency', value)}
          options={currencyOptions}
        />

        <MFieldRow label={t('fields.comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => set('comment', event.target.value)}
            placeholder={t('placeholders.comment')}
            className={cn(inputClass, 'resize-none')}
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}
