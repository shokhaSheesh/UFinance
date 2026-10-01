'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MFieldRow, MSelectField } from '@/components/mobile/fields'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { useCreateBudget, useUpdateBudget } from '@/modules/plans/hooks/useBudgets'
import { appStore } from '@/store/app.store'
import { Loader2 } from '@/components/mobile/icons'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Бюджет: название, юрлицо, валюта и период в месяцах.
 *
 * Период задаётся месяцами, а не днями: бюджет всегда живёт помесячно, и
 * выбирать 1-е число каждый раз незачем.
 */
export default function BudgetFormSheet({ open, onClose, budget, type }) {
  if (!open) return null
  return <BudgetForm onClose={onClose} budget={budget} type={type} />
}

/** Список месяцев на три года вокруг текущего. */
const useMonths = () =>
  useMemo(() => {
    const start = moment().startOf('year').subtract(1, 'year')
    return Array.from({ length: 36 }, (_, index) => {
      const month = start.clone().add(index, 'month')
      return { value: month.format('YYYY-MM'), label: month.format('MMMM YYYY') }
    })
  }, [])

function BudgetForm({ onClose, budget, type }) {
  const t = useTranslations('Plans.IncomeExpenseBudgetSingle.form')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')

  const isEdit = Boolean(budget?.id)
  const months = useMonths()

  const [form, setForm] = useState({
    name: budget?.name || '',
    comment: budget?.comment || '',
    legalEntity: budget?.legalEntityKey || '',
    currency: budget?.currencyId || appStore.currency?.guid || '',
    start: budget?.periodValue?.start || moment().format('YYYY-MM'),
    end: budget?.periodValue?.end || moment().add(11, 'month').format('YYYY-MM'),
  })
  const [errors, setErrors] = useState({})

  const createMutation = useCreateBudget(type)
  const updateMutation = useUpdateBudget(type)
  const saving = createMutation.isPending || updateMutation.isPending

  const { data: entities = [] } = useUcodeRequestQuery({
    method: 'get_legal_entities',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const entityOptions = useMemo(
    () => entities.map((item) => ({ value: item?.guid, label: item?.nazvanie || item?.name })),
    [entities]
  )

  const currencyOptions = useMemo(
    () => (appStore.currencies || []).map((item) => ({ value: item?.guid, label: `${item?.kod} · ${item?.nazvanie}` })),
    []
  )

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const submit = async () => {
    const found = {}
    if (!form.name.trim()) found.name = t('errors.name')
    if (form.end < form.start) found.end = tm('plans.periodInvalid')
    setErrors(found)
    if (Object.keys(found).length) return

    const payload = {
      name: form.name.trim(),
      comment: form.comment,
      legalEntity: form.legalEntity,
      currency: form.currency,
      period: { start: form.start, end: form.end },
    }

    try {
      if (isEdit) await updateMutation.mutateAsync({ guid: budget.id, ...payload })
      else await createMutation.mutateAsync(payload)
      onClose()
    } catch {
      // ошибку показывает сама мутация
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={isEdit ? t('editTitle') : t('createTitle')}
      className="h-[86vh]"
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
      <div className="flex flex-col gap-2">
        <MFieldRow label={t('name')} required error={errors.name} className="bg-slate-50">
          <input
            autoFocus
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none"
          />
        </MFieldRow>

        <MSelectField
          label={t('legalEntity')}
          placeholder={tm('form.choose')}
          value={form.legalEntity}
          onChange={(value) => set('legalEntity', value)}
          options={entityOptions}
        />

        <MSelectField
          label={t('currency')}
          placeholder={tm('form.choose')}
          value={form.currency}
          onChange={(value) => set('currency', value)}
          options={currencyOptions}
        />

        <MSelectField
          label={tm('plans.periodStart')}
          placeholder={tm('form.choose')}
          value={form.start}
          onChange={(value) => set('start', value)}
          options={months}
        />

        <MSelectField
          label={tm('plans.periodEnd')}
          placeholder={tm('form.choose')}
          value={form.end}
          onChange={(value) => set('end', value)}
          options={months}
          error={errors.end}
        />

        <MFieldRow label={t('comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => set('comment', event.target.value)}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none"
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}
