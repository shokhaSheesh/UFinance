'use client'

import CustomRadio from '@/components/shared/Radio'
import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { showSuccessNotification } from '@/lib/utils/notifications'
import ConfirmDeleteDataModal from '@/modules/settings/data-deletion/components/ConfirmDeleteDataModal'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

// Область удаления → флаг is_all в delete_all_data
const SCOPES = [
  { id: 'operations', isAll: false, labelKey: 'scope.operations' },
  { id: 'all', isAll: true, labelKey: 'scope.all' },
]

const DataDeletionPage = observer(() => {
  const td = useTranslations('Settings.dataDeletion')

  const { mutateAsync: deleteAllData, isPending } = useUcodeRequestMutation()

  const [scopeId, setScopeId] = useState(SCOPES[0].id)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Страница разрушительная — открываем её только тем, кому разрешено удаление
  const canDelete = appStore?.permission?.settings?.general?.delete

  const scope = SCOPES.find(item => item.id === scopeId) || SCOPES[0]

  const handleClose = () => {
    setIsConfirmOpen(false)
    setPassword('')
    setPasswordError('')
  }

  const handleConfirm = async () => {
    if (!password.trim()) {
      setPasswordError(td('confirm.passwordRequired'))
      return
    }

    try {
      // branch_id подставляется автоматически в buildInvokeFunctionBody
      await deleteAllData({
        method: 'delete_all_data',
        data: {
          password: password.trim(),
          is_all: scope.isAll,
        },
      })

      // Данных, на которых держится кэш, больше нет — сбрасываем его целиком
      queryClient.clear()
      showSuccessNotification(td('success'))
      handleClose()
    } catch (error) {
      console.error('delete_all_data failed:', error)
      setPasswordError(error?.message || td('error'))
    }
  }

  if (!canDelete) {
    return (
      <div className="flex flex-col h-full w-full bg-white">
        <div className="flex items-center h-16 px-6 border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-semibold text-gray-ucode-800">{td('pageTitle')}</h1>
        </div>
        <p className="px-6 py-5 text-sm text-gray-ucode-600">{td('noAccess')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-auto">
      <div className="flex items-center h-16 sticky top-0 bg-white z-20 px-6 border-b border-gray-200 shrink-0">
        <h1 className="text-xl font-semibold text-gray-ucode-800">{td('pageTitle')}</h1>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5 items-start max-w-[720px]">
        <p className="text-sm text-gray-ucode-600 leading-relaxed">{td('description')}</p>

        <div className="flex flex-col gap-3">
          {SCOPES.map(item => (
            <label key={item.id} className="flex items-center gap-2.5 cursor-pointer w-fit">
              <CustomRadio
                name="delete-scope"
                value={item.id}
                checked={scopeId === item.id}
                onChange={() => setScopeId(item.id)}
              />
              <span className="text-sm text-neutral-700">{td(item.labelKey)}</span>
            </label>
          ))}
        </div>

        <button className="delete-btn" onClick={() => setIsConfirmOpen(true)}>
          {td('continue')}
        </button>
      </div>

      <ConfirmDeleteDataModal
        open={isConfirmOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        password={password}
        onPasswordChange={value => {
          setPassword(value)
          setPasswordError('')
        }}
        error={passwordError}
        loading={isPending}
        scopeLabel={td(scope.labelKey)}
      />
    </div>
  )
})

export default DataDeletionPage
