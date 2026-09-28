'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import DirectoryScreen from '@/components/mobile/DirectoryScreen'
import { MFieldRow } from '@/components/mobile/fields'
import {
  useCreateLegalEntity,
  useDeleteLegalEntities,
  useUcodeRequestQuery,
  useUpdateLegalEntity,
} from '@/hooks/useDashboard'
import { showErrorNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { Building2, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Мои юрлица: список и правка.
 *
 * У юрлица на телефоне нужны название и ИНН — по ним его узнают в
 * операциях и отчётах; остальное (КПП, полное название) в форме тоже
 * есть, но идёт ниже.
 */
const MobileEntitiesPage = observer(() => {
  const t = useTranslations('Directories.legalEntity')

  const [search, setSearch] = useState('')
  const [formFor, setFormFor] = useState(null)

  const permissions = appStore.permission?.directories?.legalentities || {}
  const deleteMutation = useDeleteLegalEntities()

  const { data = [], isLoading } = useUcodeRequestQuery({
    method: 'get_legal_entities',
    data: { page: 1, limit: 100 },
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const items = useMemo(() => {
    const query = search.trim().toLowerCase()
    return data
      .map((item) => ({ ...item, id: item.guid, name: item.nazvanie }))
      .filter(
        (item) =>
          !query ||
          (item.name || '').toLowerCase().includes(query) ||
          String(item.inn || '').includes(query)
      )
  }, [data, search])

  return (
    <>
      <DirectoryScreen
        title={t('pageTitle')}
        search={search}
        onSearch={setSearch}
        items={items}
        isLoading={isLoading}
        emptyIcon={Building2}
        emptyTitle={t('noData')}
        permissions={permissions}
        onCreate={() => setFormFor({})}
        onEdit={(entity) => setFormFor(entity)}
        onDelete={(entity) => deleteMutation.mutateAsync([entity.guid])}
        deleting={deleteMutation.isPending}
        renderRow={(entity) => (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Building2 size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-slate-900">{entity.name}</span>
              <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                {entity.inn ? `ИНН ${entity.inn}` : entity.polnoe_nazvanie}
              </span>
            </span>
          </>
        )}
      />

      <EntityFormSheet open={Boolean(formFor)} entity={formFor?.guid ? formFor : null} onClose={() => setFormFor(null)} />
    </>
  )
})

/** Юрлицо: название, полное название, ИНН и КПП. */
function EntityFormSheet({ open, onClose, entity }) {
  const t = useTranslations('Directories.legalEntity')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')

  const [form, setForm] = useState({
    nazvanie: entity?.nazvanie || '',
    polnoe_nazvanie: entity?.polnoe_nazvanie || '',
    inn: entity?.inn || '',
    kpp: entity?.kpp || '',
    komentariy: entity?.komentariy || '',
  })
  const [error, setError] = useState('')

  const createMutation = useCreateLegalEntity()
  const updateMutation = useUpdateLegalEntity()
  const saving = createMutation.isPending || updateMutation.isPending

  if (!open) return null

  const submit = async () => {
    if (!form.nazvanie.trim()) {
      setError(t('errors.nameRequired'))
      return
    }

    const payload = {
      nazvanie: form.nazvanie.trim(),
      polnoe_nazvanie: form.polnoe_nazvanie?.trim() || null,
      inn: form.inn || null,
      kpp: form.kpp || null,
      komentariy: form.komentariy?.trim() || null,
      legal_entity_id: authStore.userData?.legal_entity_id || null,
    }

    try {
      if (entity?.guid) await updateMutation.mutateAsync({ ...payload, guid: entity.guid })
      else await createMutation.mutateAsync(payload)
      onClose()
    } catch (saveError) {
      showErrorNotification(saveError?.message || tm('form.saveFailed'))
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={entity?.guid ? t('editTitle') : t('createTitle')}
      className="h-[80vh]"
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {entity?.guid ? tc('save') : tc('create')}
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        {[
          { key: 'nazvanie', label: t('fields.name'), required: true },
          { key: 'polnoe_nazvanie', label: t('fields.fullName') },
          { key: 'inn', label: 'ИНН', numeric: true },
          { key: 'kpp', label: 'КПП', numeric: true },
          { key: 'komentariy', label: t('fields.comment') },
        ].map((field) => (
          <MFieldRow
            key={field.key}
            label={field.label}
            required={field.required}
            error={field.required ? error : ''}
            className="bg-slate-50"
          >
            <input
              value={form[field.key]}
              inputMode={field.numeric ? 'numeric' : 'text'}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                setError('')
              }}
              className="w-full bg-transparent text-[16px] text-slate-900 outline-none"
            />
          </MFieldRow>
        ))}
      </div>
    </BottomSheet>
  )
}

export default MobileEntitiesPage
