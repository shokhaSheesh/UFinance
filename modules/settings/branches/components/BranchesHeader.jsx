'use client'

import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Шапка списка филиалов: заголовок слева, создание — справа. */
function BranchesHeader({ onCreateClick }) {
  const tb = useTranslations('Settings.branches')

  return (
    <PageHeader
      className="sticky top-0 z-20 px-5"
      title={tb('pageTitle')}
      actions={
        <button onClick={onCreateClick} className="primary-btn gap-1.5">
          <Plus size={16} />
          {tb('add')}
        </button>
      }
    />
  )
}

export default BranchesHeader
