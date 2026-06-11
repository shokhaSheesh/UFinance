'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

const SettingsHeader = ({ hasChanges, isSaving, onSave, children }) => {
  const tg = useTranslations('Settings.general')
  const tc = useTranslations('Settings.common')

  return (
    <>
      <h1 className="text-xl sticky top-0 bg-white p-3 font-bold text-slate-900 mb-7">
        {tg('pageTitle')}
      </h1>
      {children}
      <div className="sticky bottom-0 bg-white p-3 flex justify-start">
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? tc('saving') : tc('save')}
        </button>
      </div>
    </>
  )
}

export default SettingsHeader
