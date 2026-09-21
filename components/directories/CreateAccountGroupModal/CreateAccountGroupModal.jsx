"use client"

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useUcodeRequestMutation } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
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
    <CustomDialog open={isOpen} onClose={onClose} contentClass="w-[560px]">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
        <DialogHeader title={editingGroup ? t('editTitle') : t('createTitle')} onClose={onClose} />
        <DialogBody className="flex flex-col gap-5">
          <FormRow label={t('fields.name')} required error={errors.nazvanie_gruppy}>
            <Input
              type="text"
              value={formData.nazvanie_gruppy}
              onChange={(e) => setFormData({ ...formData, nazvanie_gruppy: e.target.value })}
              placeholder={t('placeholders.name')}
              className={cn(errors.nazvanie_gruppy && "border-red-500")}
            />
          </FormRow>
          <FormRow label={t('fields.comment')} align="start">
            <TextArea
              value={formData.opisanie_gruppy}
              onChange={(e) => setFormData({ ...formData, opisanie_gruppy: e.target.value })}
              placeholder={t('placeholders.comment')}
              rows={4}
              hasError={!!errors.opisanie_gruppy}
            />
          </FormRow>
          {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={onClose} className="secondary-btn h-9">
            {tc('cancel')}
          </button>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? <Loader /> : (editingGroup ? tc('save') : tc('create'))}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}
