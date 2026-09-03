'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import PasswordInput from '@/modules/settings/profile/components/PasswordInput'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Пароль спрашиваем в самом диалоге: delete_all_data требует его в object_data,
// и это единственная защита от случайного нажатия «Продолжить»
const ConfirmDeleteDataModal = ({
  open,
  onClose,
  onConfirm,
  password,
  onPasswordChange,
  error,
  loading,
  scopeLabel,
}) => {
  const td = useTranslations('Settings.dataDeletion')
  const tc = useTranslations('Settings.common')

  return (
    <CustomDialog
      open={open}
      onClose={loading ? undefined : onClose}
      contentClass="w-[480px] max-w-[95vw] p-0 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-ucode-800">{td('confirm.title')}</h3>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex gap-2.5 rounded-md border border-red-200 bg-red-50 p-3.5">
          <TriangleAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-red-700">{scopeLabel}</span>
            <span className="text-red-600 leading-relaxed">{td('confirm.warning')}</span>
          </div>
        </div>

        <PasswordInput
          label={td('confirm.passwordLabel')}
          value={password}
          onChange={event => onPasswordChange(event.target.value)}
          placeholder={td('confirm.passwordPlaceholder')}
          error={error}
        />
      </div>

      <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
        <button onClick={onClose} disabled={loading} className="outline-btn">
          {tc('cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading || !password}
          className="delete-btn flex items-center gap-1.5"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {td('confirm.submit')}
        </button>
      </div>
    </CustomDialog>
  )
}

export default ConfirmDeleteDataModal
