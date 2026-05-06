import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useUcodeDefaultApiMutation } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import Modal from '../../common/Modal/Modal'
import Input from '../../shared/Input'
import Loader from '../../shared/Loader'
import TextArea from '../../shared/TextArea'
import styles from './style.module.scss'

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
    <Modal
      open={open}
      className={styles.modalBackdrop}
      onClose={setOpen}
    >
      <div className={styles.groupcontainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {initialData?.guid ? t('editGroupTitle') : t('createGroupTitle')}
          </h2>

          <div className={styles.headerActions}>
            <button type="button" className={styles.closeButton} onClick={setOpen}>
              <X size={20} color="#9ca3af" />
            </button>
          </div>
        </div>

        <div className={styles.body}>

          <div className={styles.formRow}>
            <div className={styles.label}>{t('fields.groupName')}</div>
            <div className={styles.fieldContainer}>
              <Input
                placeholder={t('placeholders.groupName')}
                className={styles.fullWidth}
                value={formData.name}
                error={isSubmitted && !formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
              />
              {isSubmitted && !formData.name && <span className={styles.errorMessage}>{t('errors.nameRequired')}</span>}
            </div>
          </div>

          <div className={styles.formRowTop}>
            <div className={styles.label}>{t('fields.groupComment')}</div>
            <div className={styles.fieldContainer}>
              <TextArea
                placeholder={t('placeholders.groupComment')}
                className={styles.textArea}
                rows={4}
                value={formData.commentary}
                onChange={e => handleFieldChange('commentary', e.target.value)}
                hasError={false}
              />
            </div>
          </div>

        </div>

        <div className={styles.footer}>
          <div className={styles.footerButtons}>
            <button type="button" className={styles.cancelButton} onClick={setOpen}>
              {tc('cancel')}
            </button>
            <button type="button" className={styles.saveButton} onClick={handleSubmit}>
              {isPending ? <Loader /> : initialData?.guid ? tc('save') : tc('create')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CreateGroup