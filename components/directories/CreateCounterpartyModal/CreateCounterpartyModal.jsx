"use client"

import { cn } from '@/app/lib/utils'
import SinglSelectStatiya from '@/components/ReadyComponents/SingleSelectStatiya'
import { DeleteGroupConfirmModal } from '@/components/directories/DeleteGroupConfirmModal/DeleteGroupConfirmModal'
import EditCounterpartyGroupModal from '@/components/directories/EditCounterpartyGroupModal/EditCounterpartyGroupModal'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { useCreateCounterpartiesGroup, useCreateCounterparty, useDeleteCounterpartiesGroups, useUpdateCounterparty } from '@/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import SelectCounterPartyGroup from '../../ReadyComponents/SelectCounterPartyGroup'
import CustomDialog from '../../shared/CustomDialog'
import styles from './CreateCounterpartyModal.module.scss'


export default function CreateCounterpartyModal({ isOpen, onClose, preselectedGroupId = null, counterpartyData = null, onSuccess = null }) {
  const t = useTranslations('Directories.counterparty')
  const queryClient = useQueryClient()
  const createMutation = useCreateCounterparty()
  const updateMutation = useUpdateCounterparty()
  const createGroupMutation = useCreateCounterpartiesGroup()
  const deleteGroupMutation = useDeleteCounterpartiesGroups()


  const [activeTab, setActiveTab] = useState('counterparty') // 'counterparty' or 'group'
  const [details, setDetails] = useState(false)

  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deletingGroup, setDeletingGroup] = useState(null)

  const defaultData = useMemo(() => {
    if (counterpartyData) {
      const raw = counterpartyData.rawData || counterpartyData

      const getCounterpartiesGroupId = () => {
        if (raw.counterparties_group_id) {
          if (typeof raw.counterparties_group_id === 'string' && raw.counterparties_group_id.length === 36) return raw.counterparties_group_id
        }
        if (raw.counterparties_group_id_data?.guid) return raw.counterparties_group_id_data.guid
        return preselectedGroupId || ''
      }

      const mapArrayToFields = (arr) => {
        if (Array.isArray(arr) && arr.filter(Boolean).length > 0) {
          return arr.filter(Boolean).map(v => ({ value: String(v) }))
        }
        return [{ value: '' }]
      }

      return {
        nazvanie: raw.nazvanie || '',
        polnoe_imya: raw.polnoe_imya || '',
        counterparties_group_id: getCounterpartiesGroupId(),
        gruppa: raw.gruppa || [],
        inn: raw.inn ? String(raw.inn) : '',
        kpp: mapArrayToFields(raw.kpp),
        account_number: mapArrayToFields(raw.account_number || raw.nomer_scheta),
        primenyat_stat_i_po_umolchaniyu: raw.primenyatь_statьi_po_umolchaniyu ?? raw.primenyat_stat_i_po_umolchaniyu ?? false,
        chart_of_accounts_id: counterpartyData?.chart_of_accounts_id,
        chart_of_accounts_id_2: counterpartyData?.chart_of_accounts_id_2,
        komentariy: raw.komentariy || ''
      }
    }

    return {
      nazvanie: '',
      polnoe_imya: '',
      counterparties_group_id: preselectedGroupId || '',
      gruppa: [],
      inn: '',
      kpp: [{ value: '' }],
      account_number: [{ value: '' }],
      primenyat_stat_i_po_umolchaniyu: false,
      chart_of_accounts_id: '',
      chart_of_accounts_id_2: '',
      komentariy: ''
    }
  }, [counterpartyData, preselectedGroupId])

  const { register, handleSubmit, control, watch, reset, setError, formState: { errors, isSubmitting: isSubmittingCounterparty, } } = useForm({
    defaultValues: defaultData,
    values: defaultData
  })

  const { fields: kppFields, append: appendKpp, remove: removeKpp } = useFieldArray({
    control,
    name: "kpp"
  })

  const { fields: accountFields, append: appendAccount, remove: removeAccount, } = useFieldArray({
    control,
    name: "account_number"
  })

  const primenyat_stat_i_po_umolchaniyu = watch('primenyat_stat_i_po_umolchaniyu')

  const groupForm = useForm({
    defaultValues: {
      nazvanie_gruppy: '',
      opisanie_gruppy: ''
    }
  })

  const { register: registerGroup, handleSubmit: handleSubmitGroup, formState: { errors: groupErrors, isSubmitting: isSubmittingGroup }, reset: resetGroup, setError: setErrorGroup } = groupForm

  const isSubmitting = isSubmittingCounterparty || isSubmittingGroup


  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
      reset()
      resetGroup()
    }, 250)
  }

  const onSubmitGroup = async (data) => {
    try {
      const submitData = {
        nazvanie_gruppy: data.nazvanie_gruppy.trim(),
        ...(data.opisanie_gruppy && { opisanie_gruppy: data.opisanie_gruppy }),
      }

      await createGroupMutation.mutateAsync(submitData)
      queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
      queryClient.invalidateQueries({ queryKey: ['counterpartiesPlanFact'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      handleClose()
    } catch (error) {
      console.error('Error creating counterparties group:', error)
      setErrorGroup('root', { message: error.message || t('errors.createGroupFailed') })
    }
  }

  const onSubmitCounterparty = async (data) => {
    try {
      const processDynamicField = (fieldArray) => {
        if (!fieldArray) return null
        const values = fieldArray
          .map(item => item.value?.toString().trim())
          .filter(v => !!v)

        if (values.length === 0) return null
        return values.length > 1 ? values : values[0]
      }

      const validKpp = processDynamicField(data.kpp)
      const validAccount = processDynamicField(data.account_number)

      const isEdit = !!counterpartyData
      const guid = counterpartyData?.guid || counterpartyData?.rawData?.guid

      // ...(tip.length > 0 && { tip }),
      const submitData = {
        ...(isEdit && { guid }),
        nazvanie: data.nazvanie.trim(),
        polnoe_imya: data.polnoe_imya || null,
        inn: data.inn || null,
        kpp: validKpp,
        account_number: validAccount,
        counterparties_group_id: data.counterparties_group_id,
        primenyat_stat_i_po_umolchaniyu: data.primenyat_stat_i_po_umolchaniyu,
        chart_of_accounts_id: data.chart_of_accounts_id || null,
        chart_of_accounts_id_2: data.chart_of_accounts_id_2 || null,
        komentariy: data.komentariy || null,
        ...(isEdit && { data_obnovleniya: new Date().toISOString() }),
        attributes: {}
      }

      if (isEdit) {
        await updateMutation.mutateAsync(submitData)
      } else {
        await createMutation.mutateAsync(submitData)
      }

      queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
      queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsV2'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
      if (onSuccess) onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error creating counterparty:', error)
      setError('root', { message: error.message || t('errors.createFailed') })
    }
  }


  return (
    <CustomDialog contentClass={'p-0'} open={isOpen} onClose={onClose} >
      <div className='w-[640px]'>
        <div onClick={handleClose} />
        <div>
          <div className={styles.header}>
            <h2 className={styles.title}>
              {activeTab === 'group'
                ? t('createGroupTitle')
                : (counterpartyData ? t('editTitle') : t('createTitle'))}
            </h2>
          </div>

          <div className={styles.content}>
            {/* Tabs */}

            <div className={styles.tabsContainer}>
              <button
                onClick={() => setActiveTab('counterparty')}
                className={cn(
                  styles.tab,
                  styles.first,
                  activeTab === 'counterparty' ? styles.active : styles.inactive
                )}
              >
                {t('tabCounterparty')}
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={cn(
                  styles.tab,
                  styles.last,
                  styles.notFirst,
                  activeTab === 'group' ? styles.active : styles.inactive
                )}
              >
                {t('tabGroup')}
              </button>
            </div>


            {/* Form */}
            {activeTab === 'counterparty' ? (
              <form id="counterparty-form" className={styles.form} onSubmit={handleSubmit(onSubmitCounterparty)}>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    Название <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputContainer}>
                    <Input
                      type="text"
                      placeholder={t('placeholders.name')}
                      className={cn(styles.input, errors.nazvanie && styles.inputError)}
                      {...register('nazvanie', { required: t('errors.nameRequired') })}
                    />
                    {errors.nazvanie && (
                      <div className={styles.errorMessage}>{errors.nazvanie.message}</div>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>{t('fields.fullName')}</label>
                  <div className={styles.inputContainer}>
                    <Input
                      type="text"
                      placeholder={t('placeholders.fullName')}
                      className={styles.input}
                      {...register('polnoe_imya')}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>{t('fields.group')}</label>
                  <div className={styles.inputContainer}>
                    <Controller
                      name="counterparties_group_id"
                      control={control}
                      render={({ field }) => (
                        <SelectCounterPartyGroup
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t('placeholders.selectGroup')}
                          className="flex-1"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}></label>
                  <div onClick={() => setDetails(!details)} className={styles.requisites}>
                    <p>{t('requisites')}</p>
                  </div>
                </div>

                <div className={cn(styles.requisitesContainer, details && styles.active)}>
                  <div className={styles.formRow}>
                    <label className={styles.label}>
                      {t('fields.inn')} <span className={styles.infoIcon}>?</span>
                    </label>
                    <div className={styles.inputContainer}>
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={t('placeholders.inn')}
                        className={cn(styles.input, styles.requisitesInput)}
                        {...register('inn')}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.label}>{t('fields.kpp')}</label>
                    <div className={styles.multiInputContainer}>
                      {kppFields.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-center">
                          <Input
                            key={item.id}
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={t('placeholders.kpp')}
                            className={cn(styles.input, styles.requisitesInput)}
                            {...register(`kpp.${index}.value`)}
                          />
                          {kppFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeKpp(index)}
                              className="text-neutral-400 hover:text-[#f43f5e] shrink-0 outline-none"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {index === kppFields.length - 1 && (
                            <button
                              type="button"
                              onClick={() => appendKpp({ value: '' })}
                              className="text-neutral-400 hover:text-[#0e73f6] shrink-0 outline-none"
                            >
                              <PlusCircle size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.label}>{t('fields.accountNumber')}</label>
                    <div className={styles.multiInputContainer}>
                      {accountFields.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-center">
                          <Input
                            key={item.id}
                            type="text"
                            autoComplete="off"
                            placeholder={t('placeholders.account')}
                            className={cn(styles.input, styles.requisitesInput)}
                            {...register(`account_number.${index}.value`)}
                          />
                          {accountFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAccount(index)}
                              className="text-neutral-400 hover:text-[#f43f5e] shrink-0 outline-none"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {index === accountFields.length - 1 && (
                            <button
                              type="button"
                              onClick={() => appendAccount({ value: '' })}
                              className="text-neutral-400 hover:text-[#0e73f6] shrink-0 outline-none"
                            >
                              <PlusCircle size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}></label>
                  <Controller
                    name="primenyat_stat_i_po_umolchaniyu"
                    control={control}
                    render={({ field }) => (
                      <OperationCheckbox
                        checked={field.value}
                        onChange={field.onChange}
                        label={t('fields.defaultArticles')}
                      />
                    )}
                  />
                  {/* <label className={styles.infoIcon}>?</label> */}
                </div>

                {primenyat_stat_i_po_umolchaniyu && (
                  <>
                    <div className={styles.formRow}>
                      <label className={styles.label}>{t('fields.articleIn')}</label>
                      <div className={styles.inputContainer}>
                        <Controller
                          name="chart_of_accounts_id"
                          control={control}
                          render={({ field }) => (
                            <SinglSelectStatiya
                              selectedValue={field.value}
                              setSelectedValue={field.onChange}
                              placeholder="Выберите статью"
                              className="flex-1 bg-white"
                              type="Расходы"
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <label className={styles.label}>{t('fields.articleOut')}</label>
                      <div className={styles.inputContainer}>
                        <Controller
                          name="chart_of_accounts_id_2"
                          control={control}
                          render={({ field }) => (
                            <SinglSelectStatiya
                              selectedValue={field.value}
                              setSelectedValue={field.onChange}
                              placeholder="Выберите статью"
                              className="flex-1 bg-white"
                              type="Доходы"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.formRow}>
                  <label className={styles.label}>{t('fields.comment')}</label>
                  <div className={styles.inputContainer}>
                    <TextArea
                      placeholder={t('placeholders.comment')}
                      className={styles.textarea}
                      rows={4}
                      hasError={!!errors.komentariy}
                      {...register('komentariy')}
                    />
                  </div>
                </div>

                {/* {errors.root && (
                <div className={styles.errorMessage}>{errors.root.message}</div>
              )} */}
              </form>
            ) : (
              <form id="group-form" className={styles.form} onSubmit={handleSubmitGroup(onSubmitGroup)}>
                <div className={styles.formRow}>
                  <label className={styles.label}>
                      {t('fields.groupName')} <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputContainer}>
                    <Input
                      type="text"
                        placeholder={t('placeholders.groupName')}
                      className={cn(styles.input, groupErrors.nazvanie_gruppy && styles.inputError)}
                        {...registerGroup('nazvanie_gruppy', { required: t('errors.groupNameRequired') })}
                    />
                    {groupErrors.nazvanie_gruppy && (
                      <div className={styles.errorMessage}>{groupErrors.nazvanie_gruppy.message}</div>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                    <label className={styles.label}>{t('fields.groupComment')}</label>
                  <div className={styles.inputContainer}>
                    <TextArea
                        placeholder={t('placeholders.groupComment')}
                      className={styles.textarea}
                      rows={4}
                      hasError={!!groupErrors.opisanie_gruppy}
                      {...registerGroup('opisanie_gruppy')}
                    />
                  </div>
                </div>

                {/* {groupErrors.root && (
                  <div className={styles.errorMessage}>{groupErrors.root.message}</div>
                )} */}
              </form>
            )}
          </div>

          <div className="border-t flex items-center justify-end p-2">
            <button
              type="button"
              onClick={handleClose}
              className="secondary-btn"
              disabled={isSubmitting}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              form={activeTab === 'counterparty' ? 'counterparty-form' : 'group-form'}
              className="primary-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (activeTab === 'counterparty' && counterpartyData ? t('saving') : t('creating'))
                : (activeTab === 'counterparty' && counterpartyData ? t('save') : t('create'))}
            </button>
          </div>
        </div>

        {/* Edit Group Modal */}
        {editingGroup && (
          <EditCounterpartyGroupModal
            isOpen={!!editingGroup}
            onClose={() => setEditingGroup(null)}
            group={editingGroup}
          />
        )}

        {/* Delete Group Confirmation Modal */}
        <DeleteGroupConfirmModal
          isOpen={!!deletingGroup}
          group={deletingGroup}
          onConfirm={async () => {
            if (deletingGroup?.guid) {
              try {
                await deleteGroupMutation.mutateAsync([deletingGroup.guid])
                setDeletingGroup(null)
                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsV2'] })
                queryClient.invalidateQueries({ queryKey: ['counterpartiesV2'] })
              } catch (error) {
                console.error('Error deleting group:', error)
              }
            }
          }}
          onCancel={() => setDeletingGroup(null)}
          isDeleting={deleteGroupMutation.isPending}
        />
      </div>
    </CustomDialog>
  )
}
