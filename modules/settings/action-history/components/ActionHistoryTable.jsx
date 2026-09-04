'use client'

import { ACTION_STYLES, splitDetails, splitEvent } from '@/modules/settings/action-history/utils/constants'
import { Loader } from 'lucide-react'
import moment from 'moment'
import { useTranslations } from 'next-intl'

const ActionHistoryTable = ({ rows, isFetching }) => {
  const th = useTranslations('Settings.actionHistory')

  if (isFetching && !rows.length) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader size={24} className="animate-spin text-[#0E73F6]" />
      </div>
    )
  }

  if (!rows.length) {
    return <div className="px-6 py-10 text-center text-sm text-gray-500">{th('empty')}</div>
  }

  return (
    <table className="w-full border-collapse bg-white">
      <thead className="sticky top-0 bg-white z-10">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b w-[160px]">
            {th('columns.dateTime')}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b w-[220px]">
            {th('columns.user')}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b w-[300px]">
            {th('columns.event')}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">
            {th('columns.details')}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const { title, details } = splitEvent(row?.event)
          const detailItems = splitDetails(details)
          return (
          <tr key={row?.guid} className="hover:bg-gray-50 transition-colors">
            {/* event_time приходит в UTC — moment сам переводит в местное время */}
            <td className="px-4 py-3 border-b text-xss text-gray-ucode-600 align-top whitespace-nowrap tabular-nums">
              {row?.event_time ? moment(row.event_time).format('DD.MM.YYYY HH:mm') : '—'}
            </td>
            <td className="px-4 py-3 border-b text-xss text-gray-ucode-800 align-top break-all">
              {row?.user_name || '—'}
            </td>
            <td className="px-4 py-3 border-b text-xss text-gray-ucode-800 align-top">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] leading-none px-2 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                    ACTION_STYLES[row?.action] || 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {row?.action ? th(`actions.${row.action}`) : '—'}
                </span>
                <span className="font-medium leading-relaxed">{title || '—'}</span>
              </div>
            </td>
            {/* Перечень полей записи — отдельной колонкой, каждое поле своей строкой */}
            <td className="px-4 py-3 border-b text-xss align-top">
              {detailItems.length ? (
                <div className="flex flex-col gap-1">
                  {detailItems.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex gap-1.5 leading-relaxed">
                      {item.label && (
                        <span className="text-gray-ucode-500 shrink-0">{item.label}:</span>
                      )}
                      <span className="text-gray-ucode-800 break-words">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-ucode-500">—</span>
              )}
            </td>
          </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default ActionHistoryTable
