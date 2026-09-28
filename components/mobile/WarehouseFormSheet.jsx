'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MFieldRow, MSwitch } from '@/components/mobile/fields'
import { useCreateWarehouse, useUpdateWarehouse } from '@/hooks/useDashboard'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Создание и правка склада панелью снизу.
 *
 * Полей всего четыре, поэтому отдельный экран здесь лишний: панель
 * открывается поверх списка, и после сохранения сразу видно новый склад.
 */

const EMPTY = { name: '', address: '', comment: '', is_default: false }

export default function WarehouseFormSheet({ open, onClose, warehouse }) {
  if (!open) return null
  return <WarehouseForm onClose={onClose} warehouse={warehouse} />
}

function WarehouseForm({ onClose, warehouse }) {
  const t = useTranslations('Warehouse.createModal')
  const tc = useTranslations('Common')

  const isEdit = Boolean(warehouse?.guid)
  const [form, setForm] = useState(
    warehouse
      ? {
          name: warehouse.name || '',
          address: warehouse.address || '',
          comment: warehouse.comment || '',
          is_default: !!warehouse.is_default,
        }
      : EMPTY
  )
  const [errors, setErrors] = useState({})

  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()
  const saving = createMutation.isPending || updateMutation.isPending

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const submit = async () => {
    if (!form.name.trim()) {
      setErrors({ name: t('nameRequired') })
      return
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      comment: form.comment.trim() || null,
      is_default: form.is_default,
    }

    try {
      if (isEdit) await updateMutation.mutateAsync({ ...payload, guid: warehouse.guid })
      else await createMutation.mutateAsync(payload)
      onClose()
    } catch {
      // уведомление об ошибке показывает сама мутация
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={isEdit ? t('titleEdit') : t('titleNew')}
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
            placeholder={t('namePlaceholder')}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MFieldRow label={t('address')} className="bg-slate-50">
          <input
            value={form.address}
            onChange={(event) => set('address', event.target.value)}
            placeholder={t('addressPlaceholder')}
            className="w-full bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MFieldRow label={t('comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => set('comment', event.target.value)}
            placeholder={t('commentPlaceholder')}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MSwitch
          label={t('isDefault')}
          checked={form.is_default}
          onChange={(value) => set('is_default', value)}
        />
      </div>
    </BottomSheet>
  )
}
