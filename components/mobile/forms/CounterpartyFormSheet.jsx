'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MFieldRow, MSelectField } from '@/components/mobile/fields'
import { useCreateCounterparty, useUcodeRequestQuery, useUpdateCounterparty } from '@/hooks/useDashboard'
import { Loader2 } from '@/components/mobile/icons'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Контрагент: создание и правка панелью снизу.
 *
 * На телефоне заполняют минимум — название, группу и то, что помогает
 * узнать контрагента. Реквизиты (банк, МФО, расчётный счёт) остаются на
 * большом экране: их вбивают с бумаги за столом, а не в дороге.
 */
export default function CounterpartyFormSheet({ open, onClose, counterparty }) {
  if (!open) return null
  return <CounterpartyForm onClose={onClose} counterparty={counterparty} />
}

function CounterpartyForm({ onClose, counterparty }) {
  const t = useTranslations('Directories.counterparty')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')

  const isEdit = Boolean(counterparty?.guid)
  const [form, setForm] = useState({
    nazvanie: counterparty?.nazvanie || '',
    polnoe_imya: counterparty?.polnoe_imya || '',
    counterparties_group_id: counterparty?.counterparties_group_id || '',
    inn: counterparty?.inn || '',
    address: counterparty?.address || '',
    komentariy: counterparty?.komentariy || '',
  })
  const [errors, setErrors] = useState({})

  const createMutation = useCreateCounterparty()
  const updateMutation = useUpdateCounterparty()
  const saving = createMutation.isPending || updateMutation.isPending

  const { data: groups = [], isLoading: loadingGroups } = useUcodeRequestQuery({
    method: 'get_counterparties_group',
    data: { page: 1, limit: 200 },
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const groupOptions = useMemo(
    () => groups.map((group) => ({ value: group?.guid, label: group?.nazvanie || group?.name })),
    [groups]
  )

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const submit = async () => {
    if (!form.nazvanie.trim()) {
      setErrors({ nazvanie: t('errors.nameRequired') })
      return
    }

    const payload = {
      nazvanie: form.nazvanie.trim(),
      polnoe_imya: form.polnoe_imya || null,
      address: form.address || null,
      inn: form.inn || null,
      counterparties_group_id: form.counterparties_group_id || null,
      komentariy: form.komentariy || null,
      attributes: {},
    }

    try {
      if (isEdit) await updateMutation.mutateAsync({ ...payload, guid: counterparty.guid })
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
        <MFieldRow label={t('fields.name')} required error={errors.nazvanie} className="bg-slate-50">
          <input
            autoFocus
            value={form.nazvanie}
            onChange={(event) => set('nazvanie', event.target.value)}
            placeholder={t('placeholders.name')}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MFieldRow label={t('fields.fullName')} className="bg-slate-50">
          <input
            value={form.polnoe_imya}
            onChange={(event) => set('polnoe_imya', event.target.value)}
            placeholder={t('placeholders.fullName')}
            className="w-full bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MSelectField
          label={t('fields.group')}
          placeholder={tm('form.choose')}
          value={form.counterparties_group_id}
          onChange={(value) => set('counterparties_group_id', value)}
          options={groupOptions}
          loading={loadingGroups}
        />

        <MFieldRow label={t('fields.inn')} className="bg-slate-50">
          <input
            value={form.inn}
            inputMode="numeric"
            onChange={(event) => set('inn', event.target.value)}
            placeholder={t('placeholders.inn')}
            className="w-full bg-transparent text-[16px] tabular-nums text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MFieldRow label={t('fields.address')} className="bg-slate-50">
          <input
            value={form.address}
            onChange={(event) => set('address', event.target.value)}
            placeholder={t('placeholders.address')}
            className="w-full bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MFieldRow label={t('fields.comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.komentariy}
            onChange={(event) => set('komentariy', event.target.value)}
            placeholder={t('placeholders.comment')}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}
