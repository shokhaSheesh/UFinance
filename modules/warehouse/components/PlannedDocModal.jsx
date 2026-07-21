'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Loader from '@/components/shared/Loader'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { FormatDateRu, formatNumber } from '@/utils/helpers'
import { X } from 'lucide-react'
import moment from 'moment'

const GET_METHOD = {
  shipment: 'get_shipment_transaction',
  supply: 'get_supply_transaction',
}

const UPDATE_METHOD = {
  shipment: 'update_shipment_transaction',
  supply: 'update_supply_transaction',
}

// Флаг «плановый», который снимаем при закрытии документа
const PLANNED_FIELD = {
  shipment: 'planned_shipment',
  supply: 'planned_supply',
}

// Четыре формы документа: продажа/закупка × обычный/возврат.
// Названия колонок количества берутся из бумажных форм.
const DOC_SHAPE = {
  'shipment:normal': {
    title: 'planned.docDeliveryNote',
    party: 'planned.docBuyer',
    colPlanned: 'planned.thOrdered',
    colFact: 'planned.thShipped',
  },
  'shipment:return': {
    title: 'planned.docCustomerReturn',
    party: 'planned.docBuyer',
    colPlanned: 'planned.thShipped',
    colFact: 'planned.thReturned',
  },
  'supply:normal': {
    title: 'planned.docGrn',
    party: 'planned.docSupplier',
    colPlanned: 'planned.thOrdered',
    colFact: 'planned.thReceived',
  },
  'supply:return': {
    title: 'planned.docReturnToVendor',
    party: 'planned.docSupplier',
    colPlanned: 'planned.thGot',
    colFact: 'planned.thReturned',
  },
}

const readDate = (doc, item) =>
  doc?.data_nachislenie ||
  doc?.data_operatsii ||
  item?.data_operatsii ||
  doc?.data_nachisleniya ||
  ''

const readParty = (doc, item) =>
  doc?.counterparties_name ||
  doc?.partners_name ||
  item?.counterparties_name ||
  doc?.partner_name ||
  '—'

// Номер документа собирается из даты начисления: CRN-MM-DD
const readDocNumber = doc => {
  const date = doc?.data_nachislenie
  if (!date) return '—'
  const parsed = moment.parseZone(date)
  return parsed.isValid() ? `CRN-${parsed.format('MM-DD')}` : '—'
}

const readUnit = row => row?.units_of_measurement_id_data?.full_name || '—'

// Эти поля лежат на уровне документа, но читаем и со строки — на случай,
// если бэкенд начнёт отдавать их по позициям
const readRowField = (row, doc, key) => row?.[key] || doc?.[key] || '—'

const PlannedDocModal = ({
  open,
  onClose,
  type,
  item,
  warehouseName,
  onClosed,
  t,
}) => {
  const guid = item?.guid

  const { data: doc, isFetching } = useUcodeRequestQuery({
    method: GET_METHOD[type] || GET_METHOD.shipment,
    data: { guid },
    skip: !open || !guid,
    querySetting: { select: res => res?.data },
  })

  const { mutate: closeDoc, isPending } = useUcodeRequestMutation()

  // Возврат отличают по отрицательной сумме — та же конвенция, что в сделках
  const isReturn = Number(doc?.summa ?? item?.summa) < 0

  // Закрывать можно только плановый документ: у исполненного (planned = false)
  // действие уже выполнено, повторное закрытие ничего не меняет
  const isExecutedDoc =
    (doc?.planned_supply ??
      doc?.planned_shipment ??
      item?.planned_supply ??
      item?.planned_shipment) === false
  const shape =
    DOC_SHAPE[`${type}:${isReturn ? 'return' : 'normal'}`] ||
    DOC_SHAPE['shipment:normal']

  const products = Array.isArray(doc?.product_and_service_data)
    ? doc.product_and_service_data
    : []

  const handleClose = () => {
    if (!guid) return
    closeDoc(
      {
        method: UPDATE_METHOD[type] || UPDATE_METHOD.shipment,
        data: { guid, [PLANNED_FIELD[type] || PLANNED_FIELD.shipment]: false },
      },
      {
        onSuccess: () => {
          showSuccessNotification(t('planned.closeSuccess'))
          onClosed?.()
        },
        onError: error =>
          showErrorNotification(error?.message || t('planned.closeError')),
      }
    )
  }

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
        <h2 className="text-center text-base font-bold tracking-wide text-neutral-800">
          {t(shape.title)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X size={18} />
        </button>
      </div>

      {isFetching && !doc ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 px-6 py-4 text-[13.5px]">
            {field(t('planned.docNumber'), readDocNumber(doc))}
            {field(t('planned.docDate'), FormatDateRu(readDate(doc, item)) || '—')}
            {field(t('planned.docWarehouse'), warehouseName || '—')}
            {field(t(shape.party), readParty(doc, item))}
          </div>

          <div className="max-h-[45vh] overflow-auto px-6 pb-4">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-emerald-50 text-neutral-700">
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('planned.thNum')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('planned.thSku')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('planned.thName')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('planned.thUnit')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('planned.thQuantity')}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t(shape.colPlanned)}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t(shape.colFact)}
                  </th>
                  <th className="border border-neutral-200 px-2 py-2 font-semibold">
                    {t('planned.thCondition')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border border-neutral-200 py-8 text-center text-neutral-400"
                    >
                      {t('planned.noProducts')}
                    </td>
                  </tr>
                ) : (
                  products.map((row, index) => {
                    const qty = Math.abs(Number(row?.Kol_vo) || 0)
                    return (
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
                        <td className="border border-neutral-200 px-2 py-1.5 text-center">
                          {formatNumber(qty)}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1.5 text-center">
                          {readRowField(row, doc, 'plan_fakt_admin_name')}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1.5 text-center">
                          {readRowField(row, doc, 'plan_fakt_admin_name_2')}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1.5 text-center">
                          {readRowField(row, doc, 'warehouse_name')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4">
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending || !guid || isExecutedDoc}
          className="primary-btn cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? t('planned.closing') : t('planned.closeDoc')}
        </button>
      </div>
    </CustomDialog>
  )
}

export default PlannedDocModal
