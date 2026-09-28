'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import DirectoryScreen from '@/components/mobile/DirectoryScreen'
import { MFieldRow, MSelectField } from '@/components/mobile/fields'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { formatDecimal, StringtoNumber } from '@/utils/helpers'
import { Loader2, Package, Wrench } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

/**
 * Товары и услуги: список с ценой, создание и правка.
 *
 * Группы товаров остаются на большом экране — на телефоне ими не
 * пользуются, а форма от них удлиняется.
 */
const MobileProductsPage = observer(() => {
  const t = useTranslations('Directories.product')
  const tm = useTranslations('Mobile')
  const mounted = useMounted()

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [formFor, setFormFor] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const permissions = appStore.permission?.directories?.productsServices || {}
  const { mutateAsync: removeItem, isPending: deleting } = useUcodeRequestMutation()

  const { data = [], isLoading } = useUcodeRequestQuery({
    method: 'list_products_and_services',
    data: { page: 1, limit: 100, search: debounced },
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const items = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        id: item.guid,
        name: item.Naimenovanie || item.naimenovanie || '',
        price: Number(item.TSena_za_ed ?? item.amount) || 0,
        type: item.Tip || item.tip,
        article: item.Artikul,
      })),
    [data]
  )

  const currency = mounted ? GlobalCurrency?.name : ''

  return (
    <>
      <DirectoryScreen
        title={t('pageTitle')}
        search={search}
        onSearch={setSearch}
        items={items}
        isLoading={isLoading}
        emptyIcon={Package}
        emptyTitle={tm('products.empty')}
        permissions={permissions}
        onCreate={() => setFormFor({})}
        onEdit={(item) => setFormFor(item)}
        onDelete={async (item) => {
          await removeItem({ method: 'delete_product_and_service', data: { guid: item.guid } })
          queryClient.invalidateQueries({ queryKey: ['list_products_and_services'] })
        }}
        deleting={deleting}
        renderRow={(item) => {
          const isService = item.type === 'service'
          return (
            <>
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  isService ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-500'
                )}
              >
                {isService ? <Wrench size={18} aria-hidden="true" /> : <Package size={18} aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-slate-900">{item.name}</span>
                <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                  {item.article || (isService ? tm('products.service') : tm('products.product'))}
                </span>
              </span>
              <span className="shrink-0 text-[15px] font-semibold tabular-nums text-slate-900">
                <Money value={item.price} currency={currency} />
              </span>
            </>
          )
        }}
      />

      <ProductFormSheet open={Boolean(formFor)} item={formFor?.guid ? formFor : null} onClose={() => setFormFor(null)} />
    </>
  )
})

/** Товар или услуга: тип, название, артикул, цена и единица. */
function ProductFormSheet({ open, onClose, item }) {
  const t = useTranslations('Directories.product')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')

  const [form, setForm] = useState({
    type: item?.Tip || 'product',
    name: item?.Naimenovanie || '',
    article: item?.Artikul || '',
    price: item?.TSena_za_ed ? String(item.TSena_za_ed) : '',
    unit: item?.unit_of_measurement_id || '',
    comment: item?.kommentariy || '',
  })
  const [error, setError] = useState('')

  const { mutateAsync: save, isPending } = useUcodeRequestMutation()

  const { data: units = [] } = useUcodeRequestQuery({
    method: 'get_unit_of_measurements',
    data: { page: 1, limit: 100 },
    skip: !open,
    querySetting: { select: (response) => response?.data?.data || [] },
  })

  const unitOptions = useMemo(
    () => units.map((unit) => ({ value: unit?.guid, label: unit?.nazvanie || unit?.name })),
    [units]
  )

  if (!open) return null

  const submit = async () => {
    if (!form.name.trim()) {
      setError(tc('required'))
      return
    }

    const payload = {
      Naimenovanie: form.name.trim(),
      TSena_za_ed: formatDecimal(StringtoNumber(form.price)) || 0,
      amount: formatDecimal(StringtoNumber(form.price)) || 0,
      unit_of_measurement_id: form.unit || null,
      Tip: form.type,
      kommentariy: form.comment || null,
      currenies_id: appStore.currency?.guid,
      ...(form.type === 'product' ? { Artikul: form.article || null } : {}),
      ...(item?.guid ? { guid: item.guid } : {}),
    }

    try {
      await save({ method: item?.guid ? 'update_product_and_service' : 'create_product_and_service', data: payload })
      queryClient.invalidateQueries({ queryKey: ['list_products_and_services'] })
      onClose()
    } catch (saveError) {
      showErrorNotification(saveError?.message || tm('form.saveFailed'))
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={item?.guid ? t('editProductTitle') : t('createProductTitle')}
      className="h-[84vh]"
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {item?.guid ? tc('save') : tc('create')}
        </button>
      }
    >
      {/* Товар или услуга */}
      <div className="flex gap-2 pb-3">
        {[
          { value: 'product', label: tm('products.product'), icon: Package },
          { value: 'service', label: tm('products.service'), icon: Wrench },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, type: option.value }))}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-semibold',
              form.type === option.value ? 'bg-[#0e73f6] text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            <option.icon size={15} aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <MFieldRow label={t('fields.name')} required error={error} className="bg-slate-50">
          <input
            autoFocus
            value={form.name}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, name: event.target.value }))
              setError('')
            }}
            className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none"
          />
        </MFieldRow>

        {form.type === 'product' && (
          <MFieldRow label={t('fields.article')} className="bg-slate-50">
            <input
              value={form.article}
              onChange={(event) => setForm((prev) => ({ ...prev, article: event.target.value }))}
              className="w-full bg-transparent text-[16px] text-slate-900 outline-none"
            />
          </MFieldRow>
        )}

        <MFieldRow label={t('fields.price')} className="bg-slate-50">
          <input
            value={form.price}
            inputMode="decimal"
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            className="w-full bg-transparent text-[16px] font-semibold tabular-nums text-slate-900 outline-none"
          />
        </MFieldRow>

        <MSelectField
          label={t('fields.unit')}
          placeholder={tm('form.choose')}
          value={form.unit}
          onChange={(value) => setForm((prev) => ({ ...prev, unit: value }))}
          options={unitOptions}
        />

        <MFieldRow label={t('fields.comment')} className="bg-slate-50">
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
            className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none"
          />
        </MFieldRow>
      </div>
    </BottomSheet>
  )
}

export default MobileProductsPage
