'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ACTION_STYLES } from '@/modules/settings/action-history/utils/constants'
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
          // Показываем событие целиком, как прислал бэк: часть до тире («Добавлена
          // операция») тоже нужна, без неё непонятно, к чему относятся поля
          const comment = String(row?.event || '').trim()
          return (
          <tr key={row?.guid} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 border-b text-xss text-gray-ucode-600 align-top whitespace-nowrap tabular-nums">
              {row?.event_time ? moment(row.event_time).format('DD.MM.YYYY HH:mm') : '—'}
            </td>
            <td className="px-4 py-3 border-b text-xss text-gray-ucode-800 align-top break-all">
              {row?.user_name || '—'}
            </td>
            <td className="px-4 py-3 border-b text-xss text-gray-ucode-800 align-top">
              <div className="flex items-center">
                <span
                  className={`text-[11px] leading-none px-2 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                    ACTION_STYLES[row?.action] || 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {row?.action ? th(`actions.${row.action}`) : '—'}
                </span>
              </div>
            </td>
            <td className="px-4 py-3 border-b text-xss align-top">
              {comment ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <p className="line-clamp-2 leading-relaxed text-gray-ucode-800 break-words cursor-default" />
                    }
                  >
                    {comment}
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[520px] max-h-[50vh] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {comment}
                  </TooltipContent>
                </Tooltip>
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
