'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { colorOf, initialsOf } from '../utils/avatar'

const COLUMNS = ['name', 'leaders', 'count']

function TableHead({ tg }) {
  return (
    <thead className="sticky top-0 bg-gray-50 z-10">
      <tr>
        <th className="px-4 py-3 w-12 text-left text-xs font-medium text-gray-ucode-800 border-b border-gray-200">
          #
        </th>
        {COLUMNS.map((column) => (
          <th
            key={column}
            className={`px-4 py-3 text-left text-xs font-medium text-gray-ucode-800 border-b border-gray-200 whitespace-nowrap ${column === 'count' ? 'w-28' : ''
              }`}
          >
            {tg(column)}
          </th>
        ))}
        <th className="px-4 py-3 w-12 border-b border-gray-200">&nbsp;</th>
      </tr>
    </thead>
  )
}

// Аватарки ответственных внахлёст: показываем до трёх, остальных сворачиваем в «+N»
function LeaderAvatars({ leaders }) {
  const visible = leaders.slice(0, 3)
  const rest = leaders.length - visible.length

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex -space-x-2 shrink-0">
        {visible.map((leader) => (
          <span
            key={leader?.guid}
            title={leader?.user_name}
            className="size-7 rounded-full grid place-items-center text-mini font-semibold text-white ring-2 ring-white"
            style={{ background: colorOf(leader?.user_id || leader?.guid) }}
          >
            {initialsOf(leader?.user_name)}
          </span>
        ))}
        {rest > 0 && (
          <span className="size-7 rounded-full grid place-items-center text-mini font-semibold text-gray-ucode-600 bg-gray-ucode-100 ring-2 ring-white">
            +{rest}
          </span>
        )}
      </div>
      <span className="text-sm text-gray-ucode-600 truncate">
        {leaders.map((leader) => leader?.user_name).filter(Boolean).join(', ')}
      </span>
    </div>
  )
}

export default function GroupsTable({ groups, leadersByGroup, isLoading, onOpen }) {
  const tg = useTranslations('Settings.groups')

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <TableHead tg={tg} />
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-b border-gray-200">
                <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                <td className="px-4 py-3"><Skeleton className="h-7 w-32 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!groups?.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16 bg-white">
        <div className="size-14 rounded-full bg-gray-ucode-50 grid place-items-center mb-4">
          <Users size={26} className="text-gray-ucode-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-ucode-800 mb-1.5">{tg('empty.title')}</h2>
        <p className="text-sm text-gray-ucode-500 max-w-md leading-relaxed">
          {tg('empty.description')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full border-collapse">
        <TableHead tg={tg} />
        <tbody>
          {groups.map((group, index) => {
            const leaders = leadersByGroup.get(group?.guid) || []

            return (
              <tr
                key={group?.guid}
                onClick={() => onOpen?.(group)}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 text-sm text-gray-ucode-400">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-ucode-800">
                  {group?.nazvanie_gruppy || '—'}
                </td>
                <td className="px-4 py-3 max-w-0">
                  {leaders.length ? (
                    <LeaderAvatars leaders={leaders} />
                  ) : (
                    <span className="text-sm text-gray-ucode-400">{tg('noLeaders')}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-ucode-100 text-gray-ucode-600">
                    {leaders.length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight
                    size={16}
                    className="text-gray-ucode-300 group-hover:text-gray-ucode-500 transition-colors"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
