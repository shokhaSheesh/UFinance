'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader } from '@/components/shared/CustomDialog'
import CustomDatePicker from '@/components/shared/DatePicker'
import Input from '@/components/shared/Input'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { Search } from 'lucide-react'

/**
 * UI-only modal for attaching operations (payments) to a purchase deal.
 * Matches the reference design. Data wiring (API) to be added later.
 */
export default function AttachOperationsModal({
  open,
  onClose,
  onCreateNew,
  attachedOperations = [],
  attachableOperations = [],
  totalSum = 0,
}) {
  const columns = [
    { key: 'date', label: 'Дата', align: 'text-left' },
    { key: 'account', label: 'Счет', align: 'text-left' },
    { key: 'type', label: 'Тип', align: 'text-left' },
    { key: 'counterparty', label: 'Контрагент', align: 'text-left' },
    { key: 'article', label: 'Статья', align: 'text-left' },
    { key: 'project', label: 'Проект', align: 'text-left' },
    { key: 'amount', label: 'Сумма', align: 'text-right' },
  ]

  const renderRows = (rows) =>
    rows.map((row, i) => (
      <div
        key={row.guid || i}
        className="flex items-center h-11 border-b border-neutral-100 hover:bg-neutral-50 text-xs cursor-pointer"
      >
        <div className="flex-1 px-3 text-left">{row.date || '-'}</div>
        <div className="flex-1 px-3 text-left">{row.account || '-'}</div>
        <div className="flex-1 px-3 text-left">{row.type || '-'}</div>
        <div className="flex-1 px-3 text-left">{row.counterparty || '-'}</div>
        <div className="flex-1 px-3 text-left">{row.article || '-'}</div>
        <div className="flex-1 px-3 text-left">{row.project || '-'}</div>
        <div className="flex-1 px-3 text-right">{row.amount || '-'}</div>
      </div>
    ))

  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[1024px] h-[85vh]">
      <DialogHeader
        title={
          <>
            Добавьте операции к сделке или{' '}
            <button
              type="button"
              onClick={onCreateNew}
              className="text-blue-600 hover:text-blue-700 underline underline-offset-2 bg-transparent border-none cursor-pointer p-0 font-semibold"
            >
              создайте новую
            </button>
          </>
        }
        onClose={onClose}
      />

      <DialogBody className="flex flex-col p-0">
        {/* Filters */}
        <div className="flex items-center gap-3 px-8 py-4 shrink-0">
          <div className="w-56">
            <Input
              type="text"
              placeholder="Поиск по операциям"
              leftIcon={<Search size={16} />}
            />
          </div>
          <div className="w-48">
            <CustomDatePicker
              placeholder="Дата операции"
              format="DD.MM.YYYY"
              onChange={() => { }}
            />
          </div>
          <div className="w-28">
            <Input type="text" placeholder="Сумма от" />
          </div>
          <span className="text-neutral-400">—</span>
          <div className="w-28">
            <Input type="text" placeholder="до" />
          </div>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-transparent border-none cursor-pointer ml-auto whitespace-nowrap"
          >
            Сбросить
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-4">
          {/* Column header */}
          <div className="flex items-center h-11 sticky top-0 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-500 z-10">
            {columns.map((col) => (
              <div key={col.key} className={`flex-1 px-3 ${col.align}`}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Attached section */}
          <div className="flex items-center h-11 bg-neutral-50/60 border-b border-neutral-100 text-xs font-semibold text-neutral-800 px-3 gap-2">
            <span>Прикрепленные к сделке</span>
            <span className="text-neutral-400 font-normal">{attachedOperations.length}</span>
          </div>
          {renderRows(attachedOperations)}

          {/* Attachable section */}
          <div className="flex items-center h-11 bg-neutral-50/60 border-b border-neutral-100 text-xs font-semibold text-neutral-800 px-3 gap-2">
            <span>Можно прикрепить к сделке</span>
            <span className="text-neutral-400 font-normal">{attachableOperations.length}</span>
          </div>
          {renderRows(attachableOperations)}
        </div>
      </DialogBody>

      <DialogFooter
        left={
          <span className="flex items-center gap-1.5 text-sm text-neutral-600">
            Сумма выплат в сделке:
            <span className="font-semibold text-neutral-900">{totalSum}</span>
            <span className="font-semibold text-neutral-900">{GlobalCurrency?.name}</span>
          </span>
        }
      >
        <button type="button" onClick={onClose} className="primary-btn">
          Закрыть
        </button>
      </DialogFooter>
    </CustomDialog>
  )
}
