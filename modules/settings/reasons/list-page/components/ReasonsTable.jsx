'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { CalendarX, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

function TableHead({ tr }) {
  return (
    <thead className="sticky top-0 bg-gray-50 z-10">
      <tr>
        <th className="px-4 py-3 w-12 text-left text-xs font-medium text-gray-ucode-800 border-b border-gray-200">
          #
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-ucode-800 border-b border-gray-200">
          {tr('description')}
        </th>
        <th className="px-4 py-3 w-24 border-b border-gray-200">&nbsp;</th>
      </tr>
    </thead>
  )
}

export default function ReasonsTable({
  reasons,
  isLoading,
  canEdit,
  canDelete,
  canAdd,
  onEdit,
  onDelete,
  onCreate,
}) {
  const tr = useTranslations('Settings.reasons')

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <TableHead tr={tr} />
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-b border-gray-200">
                <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-56" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!reasons?.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16 bg-white">
        <div className="size-14 rounded-full bg-gray-ucode-50 grid place-items-center mb-4">
          <CalendarX size={26} className="text-gray-ucode-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-ucode-800 mb-1.5">{tr('empty.title')}</h2>
        <p className="text-sm text-gray-ucode-500 max-w-md leading-relaxed mb-5">
          {tr('empty.description')}
        </p>
        {canAdd && (
          <button onClick={onCreate} className="primary-btn">
            <Plus size={16} />
            {tr('add')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full border-collapse">
        <TableHead tr={tr} />
        <tbody>
          {reasons.map((reason, index) => (
            <tr
              key={reason?.guid}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <td className="px-4 py-3 text-sm text-gray-ucode-400">{index + 1}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-ucode-800">
                {reason?.description || '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <button
                      onClick={() => onEdit?.(reason)}
                      title={tr('edit')}
                      className="p-1.5 rounded-md text-gray-ucode-400 hover:bg-gray-ucode-100 hover:text-gray-ucode-600 transition-colors cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete?.(reason)}
                      className="p-1.5 rounded-md text-gray-ucode-400 hover:bg-red-50 hover:text-red-ucode transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
