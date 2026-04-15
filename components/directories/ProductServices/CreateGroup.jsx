import Modal from '../../common/Modal/Modal'
import styles from './style.module.scss'
import { X } from 'lucide-react'
import { useState } from 'react'
import Input from '../../shared/Input'
import TextArea from '../../shared/TextArea'
import { useUcodeDefaultApiMutation } from '../../../hooks/useDashboard'
import Loader from '../../shared/Loader'
import { queryClient } from '../../../lib/queryClient'

const CreateGroup = ({ open = true, setOpen, initialData }) => {

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
            {initialData?.guid ? 'Редактирование группы' : 'Создание группы'}
          </h2>

          <div className={styles.headerActions}>
            <button type="button" className={styles.closeButton} onClick={setOpen}>
              <X size={20} color="#9ca3af" />
            </button>
          </div>
        </div>

        <div className={styles.body}>

          <div className={styles.formRow}>
            <div className={styles.label}>Название группы</div>
            <div className={styles.fieldContainer}>
              <Input
                placeholder="Например, кафельная плитка"
                className={styles.fullWidth}
                value={formData.name}
                error={isSubmitted && !formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
              />
              {isSubmitted && !formData.name && <span className={styles.errorMessage}>Укажите название</span>}
            </div>
          </div>

          <div className={styles.formRowTop}>
            <div className={styles.label}>Комментарий</div>
            <div className={styles.fieldContainer}>
              <TextArea
                placeholder="Добавьте комментарий к этой группе"
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
              Отменить
            </button>
            <button type="button" className={styles.saveButton} onClick={handleSubmit}>
              {isPending ? <Loader /> : initialData?.guid ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CreateGroup