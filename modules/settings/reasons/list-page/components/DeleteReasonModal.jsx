'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DeleteReasonModal({ open, onClose, onConfirm, reason, loading }) {
  const tr = useTranslations('Settings.reasons')
  const tc = useTranslations('Settings.common')

  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[480px] max-w-[95vw] p-0 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-ucode-800">{tc('delete')}</h3>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-ucode-600 mb-4 leading-relaxed">{tr('delete.confirm')}</p>
        {reason && (
          <div className="bg-gray-ucode-25 border border-gray-ucode-200 rounded-md p-3.5 flex gap-2 text-sm">
            <span className="text-gray-ucode-500 shrink-0">{tr('description')}:</span>
            <span className="text-gray-ucode-800 font-medium">{reason?.description || '—'}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
        <button onClick={onClose} className="outline-btn">
          {tc('cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="delete-btn flex items-center gap-1.5"
        >
          {loading && <Loader size={14} className="animate-spin" />}
          {tc('delete')}
        </button>
      </div>
    </CustomDialog>
  )
}
