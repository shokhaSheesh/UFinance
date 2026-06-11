'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DeleteRoleModal({ open, onClose, onConfirm, role, loading }) {
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')

  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[480px] max-w-[95vw] p-0 overflow-hidden">
      <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-gray-200 pr-14">
        <h3 className="text-lg font-bold text-slate-900">{tc('delete')}</h3>
      </div>

      <div className="px-7 py-6">
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {tr('delete.confirm') || 'Вы уверены, что хотите удалить роль?'}
        </p>
        {role && (
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2.5">
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 font-medium min-w-[120px]">{tr('name')}:</span>
              <span className="text-slate-900 font-medium">{role?.name || '—'}</span>
            </div>
            {role?.description && (
              <div className="flex gap-2 text-sm">
                <span className="text-slate-500 font-medium min-w-[120px]">{tr('description')}:</span>
                <span className="text-slate-900 font-medium">{role?.description}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2.5 px-7 pb-6">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {tc('cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
        >
          {loading && <Loader size={14} className="animate-spin" />}
          {tc('delete')}
        </button>
      </div>
    </CustomDialog>
  )
}
