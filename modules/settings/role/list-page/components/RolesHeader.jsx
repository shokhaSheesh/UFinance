'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function RolesHeader({ canAdd, onAdd }) {
  const tr = useTranslations('Settings.roles')

  return (
    <div className="flex items-center h-16 sticky top-0 bg-white z-20 justify-start gap-5 px-6 py-4 border-b border-gray-100 shrink-0">
      <h1 className="text-xl font-semibold text-gray-900">{tr('pageTitle')}</h1>
      {canAdd && (
        <button
          onClick={onAdd}
          className="primary-btn flex items-center gap-1.5"
        >
          <Plus size={16} />
          {tr('add')}
        </button>
      )}
    </div>
  )
}
