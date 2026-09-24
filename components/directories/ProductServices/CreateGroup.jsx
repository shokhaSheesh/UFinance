import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useUcodeDefaultApiMutation } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import Input from '../../shared/Input'
import Loader from '../../shared/Loader'
import TextArea from '../../shared/TextArea'

const CreateGroup = ({ open = true, setOpen, initialData }) => {
  const t = useTranslations('Directories.product')
  const tc = useTranslations('Common')

  const { mutateAsync: createProductServiceGroup, isPending } = useUcodeDefaultApiMutation({
    mutationKey: 'product_services_groups'
  })

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    commentary: initialData?.commentary || ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitted(true)
    if (!formData.name) {
      return
    }

    const payload = {
      ...formData,
    }

    if (initialData?.guid) {
      payload.guid = initialData.guid
    }

    try {
      await createProductServiceGroup({
        urlMethod: initialData?.guid ? "PUT" : "POST",
        urlParams: "/items/group_product_and_service?from-ofs=true",
        data: payload,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["product_services_groups"] })
        queryClient.invalidateQueries({ queryKey: ["get_product_services_list"] })
        queryClient.invalidateQueries({ queryKey: ["product-services-grouped"] })
      })

      setOpen(false)
      setFormData({ name: "", commentary: "" })
    } catch (error) {
      console.error('createProductServiceGroup', error)
    }
  }

  return (
    <CustomDialog open={open} onClose={setOpen} contentClass="w-[560px]">
      <DialogHeader
        title={initialData?.guid ? t('editGroupTitle') : t('createGroupTitle')}
        onClose={setOpen}
      />

      <DialogBody className="flex flex-col gap-4">
        <FormRow
          label={t('fields.groupName')}
          required
          error={isSubmitted && !formData.name ? t('errors.nameRequired') : undefined}
        >
          <Input
            placeholder={t('placeholders.groupName')}
            value={formData.name}
            error={isSubmitted && !formData.name}
            onChange={e => handleFieldChange('name', e.target.value)}
          />
        </FormRow>

        <FormRow label={t('fields.groupComment')} align="start">
          <TextArea
            placeholder={t('placeholders.groupComment')}
            className="w-full resize-y min-h-20"
            rows={4}
            value={formData.commentary}
            onChange={e => handleFieldChange('commentary', e.target.value)}
            hasError={false}
          />
        </FormRow>
      </DialogBody>

      <DialogFooter>
        <button type="button" className="secondary-btn h-9" onClick={setOpen} disabled={isPending}>
          {tc('cancel')}
        </button>
        <button type="button" className="primary-btn" onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader /> : initialData?.guid ? tc('save') : tc('create')}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
}

export default CreateGroup
