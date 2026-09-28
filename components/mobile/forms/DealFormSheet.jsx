'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MDateField, MFieldRow, MSelectField } from '@/components/mobile/fields'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { Loader2 } from 'lucide-react'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Сделка: создание и правка.
 *
 * Поля те же, что в окне на большом экране: название, клиент, дата и
 * комментарий. Товары, поступления и отгрузки добавляются уже внутри
 * сделки — по одному действию за раз.
 */
export default function DealFormSheet({ open, onClose, deal }) {
  if (!open) return null
  return <DealForm onClose={onClose} deal={deal} />
}

function DealForm({ onClose, deal }) {
  const t = useTranslations('Deals.createDealModal')
  const tOps = useTranslations('Operations')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')

  const isEdit = Boolean(deal?.guid)
  const [form, setForm] = useState({
    name: deal?.nazvanie || deal?.name || '',
    counterparty: deal?.counterparties_id || '',
    date: deal?.data_nachala || deal?.sale_date || moment().format('YYYY-MM-DD'),
    comment: deal?.comment || deal?.commentary || '',
  })
  const [errors, setErrors] = useState({})

  const { mutateAsync: saveDeal, isPending } = useUcodeRequestMutation()

  const { data: counterparties = [], isLoading: loadingCounterparties } = useUcodeRequestQuery({
    method: 'get_counterparties',
    data: { page: 1, limit: 200 },
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const counterpartyOptions = useMemo(
    () => counterparties.map((item) => ({ value: item?.guid, label: item?.nazvanie || item?.name })),
    [counterparties]
  )

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const submit = async () => {
    if (!form.name.trim()) {
      setErrors({ name: t('dealNameRequired') })
      return
    }

    const payload = {
      deal_date: moment(form.date).format('YYYY-MM-DD'),
      name: form.name.trim(),
      counterparties_id: form.counterparty || null,
      commentary: form.comment || '',
      currenies_id: appStore?.currency?.guid,
      branch_id: authStore.branch_id,
      ...(isEdit ? { guid: deal.guid } : { status: ['Новая'] }),
    }

    try {
      await saveDeal({
        method: isEdit ? 'update_sales_transaction' : 'create_sales_transaction',
        data: payload,
      })
      queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      showSuccessNotification(isEdit ? tc('saved') : tm('deals.created'))
      onClose()
    } catch (error) {
      showErrorNotification(error?.message || tm('form.saveFailed'))
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={isEdit ? t('titleEdit') : t('titleNew')}
      className="h-[80vh]"
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {isEdit ? tc('save') : tc('create')}
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        <MFieldRow label={t('dealName')} required error={errors.name} className="bg-slate-50">
          <input
            autoFocus
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder={t('dealNamePlaceholder')}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MSelectField
          label={tOps('columns.counterparty')}
          placeholder={tm('form.choose')}
          value={form.counterparty}
          onChange={(value) => set('counterparty', value)}
          options={counterpartyOptions}
          loading={loadingCounterparties}
          avatars
        />

        <MDateField label={tOps('columns.date')} required value={form.date} onChange={(value) => set('date', value)} />

        <MFieldRow label={t('comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => set('comment', event.target.value)}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}
