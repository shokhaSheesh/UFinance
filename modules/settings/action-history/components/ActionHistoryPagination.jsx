'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

const ActionHistoryPagination = ({ page, totalPages, total, onChange, isFetching }) => {
  const th = useTranslations('Settings.actionHistory')

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-gray-200 bg-white shrink-0">
      <span className="text-xs text-gray-ucode-600">{th('total', { total })}</span>
      <div className="flex items-center gap-2">
        <button
          className="outline-btn flex items-center gap-1"
          disabled={page <= 1 || isFetching}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={14} />
          {th('prev')}
        </button>
        <span className="text-xs text-gray-ucode-600 tabular-nums">
          {th('pageOf', { page, totalPages })}
        </span>
        <button
          className="outline-btn flex items-center gap-1"
          disabled={page >= totalPages || isFetching}
          onClick={() => onChange(page + 1)}
        >
          {th('next')}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default ActionHistoryPagination
