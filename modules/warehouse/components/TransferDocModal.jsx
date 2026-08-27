'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Loader from '@/components/shared/Loader'
import { useWarehouseTransfer } from '@/hooks/useDashboard'
import { FormatDateRu, formatNumber } from '@/utils/helpers'
import { X } from 'lucide-react'
import moment from 'moment'
import { useMemo } from 'react'

// Номер документа собирается из даты перемещения: TRN-MM-DD
const readDocNumber = (doc) => {
  const parsed = moment.parseZone(doc?.transfer_date || '')
  return parsed.isValid() ? `TRN-${parsed.format('MM-DD')}` : '—'
}

const readUnit = (row) =>
  row?.unit_name || row?.units_of_measurement_id_data?.full_name || '—'

/**
 * Готовое перемещение только для чтения: бэкенд не поддерживает
 * update/delete — ошибочный документ исправляют обратным перемещением.
 */
const TransferDocModal = ({ open, onClose, item, t }) => {
  const guid = item?.guid

  const { data: fetched, isFetching } = useWarehouseTransfer(guid, { skip: !open })

  // до ответа рисуем шапку по строке списка — она уже содержит склады и суммы
  const doc = fetched || item

  const products = useMemo(
    () => (Array.isArray(doc?.product_and_service_data) ? doc.product_and_service_data : []),
    [doc]
  )

  const field = (label, value) => (
    <div className="flex gap-2">
      <span className="w-40 shrink-0 text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  )

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      elevated
      contentClass="w-[900px] max-w-[calc(100vw-2rem)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-bold tracking-wide text-neutral-800">
          {t('transfer.docTitle')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X size={18} />
        </button>
      </div>

      {isFetching && !fetched ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 px-6 py-4 text-[13.5px]">
            {field(t('transfer.docNumber'), readDocNumber(doc))}
            {field(t('transfer.docDate'), FormatDateRu(doc?.transfer_date) || '—')}
            {field(t('transfer.from'), doc?.from_warehouse_name || '—')}
            {field(t('transfer.to'), doc?.to_warehouse_name || '—')}
            {field(t('transfer.docAuthor'), doc?.plan_fakt_admin_name || '—')}
            {field(t('transfer.comment'), doc?.description || '—')}
          </div>

          <div className="max-h-[45vh] overflow-auto px-6 pb-4">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-emerald-50 text-neutral-700">
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('transfer.thNum')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('transfer.thSku')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('transfer.thName')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('transfer.thUnit')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('transfer.thQuantity')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('transfer.thCost')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('transfer.thSum')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border border-neutral-200 py-8 text-center text-neutral-400"
                    >
                      {t('transfer.noProducts')}
                    </td>
                  </tr>
                ) : (
                  products.map((row, index) => (
                    <tr key={row?.guid || index}>
                      <td className="border border-neutral-200 px-2 py-1.5 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-neutral-200 px-2 py-1.5">
                        {row?.Artikul || '—'}
                      </td>
                      <td className="border border-neutral-200 px-2 py-1.5">
                        {row?.Naimenovanie || '—'}
                      </td>
                      <td className="border border-neutral-200 px-2 py-1.5 text-center">
                        {readUnit(row)}
                      </td>
                      <td className="border border-neutral-200 px-2 py-1.5 text-right">
                        {formatNumber(Math.abs(Number(row?.Kol_vo) || 0))}
                      </td>
                      <td className="border border-neutral-200 px-2 py-1.5 text-right">
                        {formatNumber(Number(row?.TSena_za_ed) || 0)}
                      </td>
                      <td className="border border-neutral-200 px-2 py-1.5 text-right">
                        {formatNumber(Number(row?.Summa) || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="text-neutral-400">{t('transfer.totalPositions')}:</span>
          <b className="text-neutral-800">{doc?.items_count ?? products.length}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-neutral-400">{t('transfer.totalQuantity')}:</span>
          <b className="text-neutral-800">{formatNumber(Number(doc?.total_quantity) || 0)}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-neutral-400">{t('transfer.totalAmount')}:</span>
          <b className="text-neutral-800">{formatNumber(Number(doc?.total_amount) || 0)}</b>
        </span>
        <span className="ml-auto text-xs text-neutral-400">{t('transfer.readOnlyHint')}</span>
      </div>
    </CustomDialog>
  )
}

export default TransferDocModal
