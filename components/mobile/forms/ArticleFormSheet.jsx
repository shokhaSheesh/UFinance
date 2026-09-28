'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { CATEGORY_TYPES } from '@/components/directories/CategoryTypes'
import { MFieldRow, MSelectField } from '@/components/mobile/fields'
import { useUcodeRequestMutation, useUpdateChartOfAccounts } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Учётная статья: раздел плана счетов, название и родительская статья.
 *
 * Раздел выбирается чипами с тем же значком и цветом, что в списке, —
 * так видно, куда попадёт статья, не открывая список заново.
 */

const TIP_BY_KEY = {
  income: 'Доходы',
  expense: 'Расходы',
  assets: 'Актив',
  liabilities: 'Обязательства',
  capital: 'Капитал',
}

export default function ArticleFormSheet({ open, onClose, article, section, parentOptions = [] }) {
  if (!open) return null
  return <ArticleForm onClose={onClose} article={article} section={section} parentOptions={parentOptions} />
}

function ArticleForm({ onClose, article, section, parentOptions }) {
  const t = useTranslations('Directories.chartOfAccounts')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')

  const isEdit = Boolean(article?.guid)
  const [type, setType] = useState(section || 'income')
  const [form, setForm] = useState({
    nazvanie: article?.name || article?.nazvanie || '',
    parent: article?.chart_of_accounts_id_2 || '',
    komentariy: article?.komentariy || '',
  })
  const [error, setError] = useState('')

  const { mutateAsync: createArticle, isPending: creating } = useUcodeRequestMutation()
  const updateMutation = useUpdateChartOfAccounts()
  const saving = creating || updateMutation.isPending

  const submit = async () => {
    if (!form.nazvanie.trim()) {
      setError(t('errors.nameRequired'))
      return
    }

    const payload = {
      nazvanie: form.nazvanie.trim(),
      tip: [TIP_BY_KEY[type]],
      ...(form.parent ? { chart_of_accounts_id_2: form.parent } : {}),
      ...(form.komentariy ? { komentariy: form.komentariy } : {}),
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ ...payload, guid: article.guid })
      } else {
        await createArticle({
          method: 'create_chart_of_account',
          data: {
            ...payload,
            static: false,
            attributes: null,
            legal_entity_id: authStore?.userData?.legal_entity_id,
          },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['get_chart_of_accounts'] })
      onClose()
    } catch (saveError) {
      showErrorNotification(saveError?.message || tm('form.saveFailed'))
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={isEdit ? t('editTitle') : t('createTitle')}
      className="h-[80vh]"
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
      {/* Раздел плана счетов */}
      <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none]">
        {CATEGORY_TYPES.map(({ key, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold',
              type === key ? 'bg-[#0e73f6] text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            <Icon size={15} aria-hidden="true" />
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <MFieldRow label={t('fields.name')} required error={error} className="bg-slate-50">
          <input
            autoFocus
            value={form.nazvanie}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, nazvanie: event.target.value }))
              setError('')
            }}
            placeholder={t('placeholders.name')}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <MSelectField
          label={t('fields.parent')}
          placeholder={t('placeholders.selectParent')}
          value={form.parent}
          onChange={(value) => setForm((prev) => ({ ...prev, parent: value }))}
          options={parentOptions}
        />

        <MFieldRow label={t('fields.comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.komentariy}
            onChange={(event) => setForm((prev) => ({ ...prev, komentariy: event.target.value }))}
            placeholder={t('placeholders.comment')}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}
