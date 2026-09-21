'use client'

import { ConfirmDialog } from '@/components/shared/CustomDialog'
import PasswordInput from '@/modules/settings/profile/components/PasswordInput'
import { TriangleAlert } from 'lucide-react'
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
    <ConfirmDialog
      open={open}
      // пока идёт удаление, окно не закрывается
      onClose={loading ? () => {} : onClose}
      onConfirm={onConfirm}
      loading={loading}
      confirmDisabled={!password}
      icon={TriangleAlert}
      title={td('confirm.title')}
      cancelLabel={tc('cancel')}
      confirmLabel={td('confirm.submit')}
    >
      <div className="flex flex-col gap-1 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm">
        <span className="font-medium text-red-700">{scopeLabel}</span>
        <span className="leading-relaxed text-red-600">{td('confirm.warning')}</span>
      </div>
      <PasswordInput
        label={td('confirm.passwordLabel')}
        value={password}
        onChange={event => onPasswordChange(event.target.value)}
        placeholder={td('confirm.passwordPlaceholder')}
        error={error}
      />
    </ConfirmDialog>
  )
}

export default ConfirmDeleteDataModal
