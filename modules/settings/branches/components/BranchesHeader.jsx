'use client'

import { useTranslations } from 'next-intl'

function BranchesHeader({ onCreateClick }) {
  const tb = useTranslations('Settings.branches')

  return (
    <div className="flex p-5 h-16 sticky top-0 bg-white z-20 items-center gap-4 mb-6">
      <h1 className="text-xl font-bold text-slate-900">{tb('pageTitle')}</h1>
      <button onClick={onCreateClick} className="px-5 py-2 primary-btn">
        {tb('add')}
      </button>
    </div>
  )
}

export default BranchesHeader
