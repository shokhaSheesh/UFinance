'use client'

import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Шапка списка ролей: заголовок слева, создание — справа. */
export default function RolesHeader({ canAdd, onAdd }) {
  const tr = useTranslations('Settings.roles')

  return (
    <PageHeader
      className="sticky top-0 z-20 border-b border-gray-100 px-6"
      title={tr('pageTitle')}
      actions={
        canAdd && (
          <button onClick={onAdd} className="primary-btn gap-1.5">
            <Plus size={16} />
            {tr('add')}
          </button>
        )
      }
    />
  )
}
