'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import { useTranslations } from 'next-intl'

export default function DeleteWarehouseConfirmModal({ isOpen, warehouse, onConfirm, onCancel, isDeleting }) {
  const t = useTranslations('Warehouse.deleteModal')
  const tc = useTranslations('Common')

  return (
    <CustomDialog open={isOpen} onClose={isDeleting ? undefined : onCancel} contentClass="p-0">
      <div className="flex flex-col bg-white rounded-lg w-[440px]" role="dialog" aria-modal="true" aria-labelledby="delete-warehouse-title">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 id="delete-warehouse-title" className="text-lg font-semibold text-slate-900 m-0">
            {t('title')}
          </h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-neutral-600 leading-relaxed">
            {t('message', { name: warehouse?.name || tc('noName') })}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            className="secondary-btn"
            onClick={onCancel}
            disabled={isDeleting}
          >
            {tc('cancel')}
          </button>
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#F04438] rounded-md hover:bg-[#D92D20] transition-colors cursor-pointer min-w-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t('deleting') : tc('delete')}
          </button>
        </div>
      </div>
    </CustomDialog>
  )
}
