"use client"

import { cn } from '@/app/lib/utils'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useUcodeRequestMutation } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import CustomModal from '../../shared/CustomModal'
import Loader from '../../shared/Loader'

export default function CreateAccountGroupModal({ isOpen, onClose, editingGroup, editId }) {
  const t = useTranslations('Directories.accountGroup')
  const tc = useTranslations('Common')
  const [formData, setFormData] = useState({
    nazvanie_gruppy: '',
    opisanie_gruppy: ''
  })


  const { mutateAsync: createAccountGroup } = useUcodeRequestMutation()

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setFormData({
          nazvanie_gruppy: editingGroup.name || editingGroup.nazvanie || '',
          opisanie_gruppy: editingGroup.description || editingGroup.komentariy || ''
        })
      } else {
        setFormData({
          nazvanie_gruppy: '',
          opisanie_gruppy: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, editingGroup])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.nazvanie_gruppy.trim()) {
      newErrors.nazvanie_gruppy = t('errors.nameRequired')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (editingGroup) {
        await createAccountGroup({
          method: 'update_account_group',
          data: {
            guid: editingGroup.guid,
            name: formData.nazvanie_gruppy,
            description: formData.opisanie_gruppy
          }
        })
      } else {
        await createAccountGroup({
          method: 'create_account_group',
          data: {
            name: formData.nazvanie_gruppy,
            description: formData.opisanie_gruppy
          }
        })
      }
      queryClient.invalidateQueries({ queryKey: ['bankAccountsPlanFact'] })
      queryClient.invalidateQueries({ queryKey: ['get_account_groups'] })
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      onClose()
    } catch (error) {
      console.error('Error creating group:', error)
      setErrors({ submit: error.message || t('errors.createFailed') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomModal
      className="w-[500px] p-0 overflow-hidden"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col h-full text-slate-900 bg-white">
        <div className="border-b pb-3 p-4 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-xl font-semibold">{editingGroup ? t('editTitle') : t('createTitle')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-6 space-y-6 overflow-y-auto max-h-[60vh]">
            <div className="flex flex-row items-center gap-4">
              <label className="w-[35%] text-sm  text-slate-700">
                {t('fields.name')} <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <Input
                  type="text"
                  value={formData.nazvanie_gruppy}
                  onChange={(e) => setFormData({ ...formData, nazvanie_gruppy: e.target.value })}
                  placeholder={t('placeholders.name')}
                  className={cn(errors.nazvanie_gruppy && "border-red-500")}
                />
                {errors.nazvanie_gruppy && (
                  <div className="text-xs text-red-500 mt-1">{errors.nazvanie_gruppy}</div>
                )}
              </div>
            </div>

            <div className="flex flex-row items-start gap-4">
              <label className="w-[35%] text-sm  text-slate-700 pt-2">
                {t('fields.comment')}
              </label>
              <div className="flex-1">
                <TextArea
                  value={formData.opisanie_gruppy}
                  onChange={(e) => setFormData({ ...formData, opisanie_gruppy: e.target.value })}
                  placeholder={t('placeholders.comment')}
                  rows={4}
                  hasError={!!errors.opisanie_gruppy}
                />
              </div>
            </div>

            {errors.submit && (
              <div className="text-red-500 text-sm mt-2">{errors.submit}</div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-4 py-2 border-t ">
            <button
              type="button"
              onClick={onClose}
              className="secondary-btn"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              className="primary-btn px-4! rounded-sm!"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader /> : (editingGroup ? tc('save') : tc('create'))}
            </button>
          </div>
        </form>
      </div>
    </CustomModal>
  )
}
