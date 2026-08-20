"use client"

import SelectCounterPartyGroup from '@/components/ReadyComponents/SelectCounterPartyGroup'
import SinglSelectStatiya from '@/components/ReadyComponents/SingleSelectStatiya'
import { DeleteGroupConfirmModal } from '@/components/directories/DeleteGroupConfirmModal/DeleteGroupConfirmModal'
import EditCounterpartyGroupModal from '@/components/directories/EditCounterpartyGroupModal/EditCounterpartyGroupModal'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import CustomDialog from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import {
  useCreateCounterpartiesGroup,
  useCreateCounterparty,
  useDeleteCounterpartiesGroups,
  useUpdateCounterparty,
} from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { includeNumber } from '@/utils/helpers'
import { useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import styles from './CreateCounterpartyModal.module.scss'



// ─── Helpers ──────────────────────────────────────────────────────────────────

const toFields = (arr) => {
  const filtered = Array.isArray(arr) ? arr.filter(Boolean) : []
  return filtered.length > 0 ? filtered.map(v => ({ value: String(v) })) : [{ value: '' }]
}

const processFieldArray = (fields) => {
  const values = fields.map(f => f.value?.toString().trim()).filter(Boolean)
  if (values.length === 0) return null
  return values.length > 1 ? values : values[0]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DynamicFieldList({ fields, onAppend, onRemove, renderInput }) {
  return (
    <div className={styles.multiInputContainer}>
      {fields.map((item, index) => (
        <div key={item.id} className="flex gap-2 items-center">
          {renderInput(index)}
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-neutral-400 hover:text-[#f43f5e] shrink-0 outline-none"
            >
              <Trash2 size={18} />
            </button>
          )}
          {index === fields.length - 1 && (
            <button
              type="button"
              onClick={onAppend}
              className="text-neutral-400 hover:text-primary shrink-0 outline-none"
            >
              <PlusCircle size={20} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ──i─ Man Component ───────────────────────────────────────────────────────────

const CreateCounterpartyModal = observer(function CreateCounterpartyModal({
  isOpen,
  onClose,
  preselectedGroupId = null,
  counterpartyData = null,
  onSuccess = null,
  activetab = 'counterparty'
}) {
  const t = useTranslations('Directories.counterparty')
  const queryClient = useQueryClient()

  const createMutation = useCreateCounterparty()
  const updateMutation = useUpdateCounterparty()
  const createGroupMutation = useCreateCounterpartiesGroup()
  const deleteGroupMutation = useDeleteCounterpartiesGroups()

  const [activeTab, setActiveTab] = useState(activetab)
  const [details, setDetails] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deletingGroup, setDeletingGroup] = useState(null)

  const isEdit = !!counterpartyData

  // ─── Default values ────────────────────────────────────────────────────────

  const counterpartyDefaults = useMemo(() => {
    if (!counterpartyData) {
      return {
        nazvanie: '',
        polnoe_imya: '',
        counterparties_group_id: preselectedGroupId || '',
        address: '',
        inn: '',
        kpp: [{ value: '' }],
        account_number: [{ value: '' }],
        bank: '',
        mfo: '',
        primenyat_stat_i_po_umolchaniyu: false,
        chart_of_accounts_id: '',
        chart_of_accounts_id_2: '',
        komentariy: '',
        not_student: false,
      }
    }

    const raw = counterpartyData.rawData || counterpartyData
    const groupId =
      typeof raw.counterparties_group_id === 'string' && raw.counterparties_group_id.length === 36
        ? raw.counterparties_group_id
        : raw.counterparties_group_id_data?.guid ?? preselectedGroupId ?? ''

    return {
      nazvanie: raw.nazvanie || '',
      polnoe_imya: raw.polnoe_imya || '',
      counterparties_group_id: groupId,
      address: raw.address || '',
      inn: raw.inn ? String(raw.inn) : '',
      kpp: toFields(raw.kpp),
      account_number: toFields(raw.account_number || raw.nomer_scheta),
      bank: raw.bank || '',
      mfo: raw.mfo ? String(raw.mfo) : '',
      primenyat_stat_i_po_umolchaniyu:
        raw.primenyatь_statьi_po_umolchaniyu ?? raw.primenyat_stat_i_po_umolchaniyu ?? false,
      chart_of_accounts_id: counterpartyData.chart_of_accounts_id || '',
      chart_of_accounts_id_2: counterpartyData.chart_of_accounts_id_2 || '',
      komentariy: raw.komentariy || '',
      not_student: raw.not_student ?? false,
    }
  }, [counterpartyData, preselectedGroupId])

  // ─── Forms ────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting: isSubmittingCounterparty },
  } = useForm({
    defaultValues: counterpartyDefaults,
    values: counterpartyDefaults,
  })


  const {
    register: registerGroup,
    handleSubmit: handleSubmitGroup,
    reset: resetGroup,
    setError: setErrorGroup,
    formState: { errors: groupErrors, isSubmitting: isSubmittingGroup },
  } = useForm({
    defaultValues: { nazvanie_gruppy: '', opisanie_gruppy: '' },
  })

  const { fields: kppFields, append: appendKpp, remove: removeKpp } = useFieldArray({ control, name: 'kpp' })
  const { fields: accountFields, append: appendAccount, remove: removeAccount } = useFieldArray({ control, name: 'account_number' })

  const showArticles = watch('primenyat_stat_i_po_umolchaniyu')
  const isSubmitting = isSubmittingCounterparty || isSubmittingGroup

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = () => {
    onClose()
    reset()
    resetGroup()
  }

  const invalidateCounterpartyQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
    queryClient.invalidateQueries({ queryKey: ['get_counterpaties_total'] })
    queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
    queryClient.invalidateQueries({ queryKey: ['get_counterparties_group'] })
    queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
  }

  const onSubmitCounterparty = async (data) => {
    try {
      const guid = counterpartyData?.guid || counterpartyData?.rawData?.guid

      const payload = {
        ...(isEdit && { guid }),
        nazvanie: data.nazvanie.trim(),
        polnoe_imya: data.polnoe_imya || null,
        address: data.address || null,
        inn: (data.inn) || null,
        kpp: processFieldArray(data.kpp),
        account_number: processFieldArray(data.account_number),
        bank: data.bank || null,
        mfo: (data.mfo) || null,
        counterparties_group_id: data.counterparties_group_id,
        primenyat_stat_i_po_umolchaniyu: data.primenyat_stat_i_po_umolchaniyu,
        chart_of_accounts_id: data.chart_of_accounts_id || null,
        chart_of_accounts_id_2: data.chart_of_accounts_id_2 || null,
        komentariy: data.komentariy || null,
        ...(appStore.isDonoSchool && { not_student: !!data.not_student }),
        ...(isEdit && { data_obnovleniya: new Date().toISOString() }),
        attributes: {},
      }

      if (isEdit) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }

      invalidateCounterpartyQueries()
      onSuccess?.()
      handleClose()
    } catch (error) {
      setError('root', { message: error.message || t('errors.createFailed') })
    }
  }

  const onSubmitGroup = async (data) => {
    try {
      await createGroupMutation.mutateAsync({
        nazvanie_gruppy: data.nazvanie_gruppy.trim(),
        ...(data.opisanie_gruppy && { opisanie_gruppy: data.opisanie_gruppy }),
      })
      queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
      queryClient.invalidateQueries({ queryKey: ['counterpartiesPlanFact'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      handleClose()
    } catch (error) {
      setErrorGroup('root', { message: error.message || t('errors.createGroupFailed') })
    }
  }

  const handleDeleteGroup = async () => {
    if (!deletingGroup?.guid) return
    try {
      await deleteGroupMutation.mutateAsync([deletingGroup.guid])
      setDeletingGroup(null)
      queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsV2'] })
      queryClient.invalidateQueries({ queryKey: ['counterpartiesV2'] })
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <CustomDialog contentClass="p-0" open={isOpen} onClose={handleClose}>
      <div className="w-[640px]">

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {activeTab === 'group'
              ? t('createGroupTitle')
              : isEdit ? t('editTitle') : t('createTitle')}
          </h2>
        </div>

        <div className={styles.content}>

          {/* Tabs */}
          <div className={styles.tabsContainer}>
            {(['counterparty', 'group']).map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  styles.tab,
                  i === 0 ? styles.first : cn(styles.last, styles.notFirst),
                  activeTab === tab ? styles.active : styles.inactive
                )}
              >
                {t(tab === 'counterparty' ? 'tabCounterparty' : 'tabGroup')}
              </button>
            ))}
          </div>

          {/* ── Counterparty Form ── */}
          {activeTab === 'counterparty' ? (
            <form id="counterparty-form" className={styles.form} onSubmit={handleSubmit(onSubmitCounterparty)}>

              {/* Name */}
              <div className={styles.formRow}>
                <label className={styles.label}>
                  {t('fields.name')} <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputContainer}>
                  <Input
                    placeholder={t('placeholders.name')}
                    className={cn(styles.input, errors.nazvanie && styles.inputError)}
                    {...register('nazvanie', { required: t('errors.nameRequired') })}
                  />
                  {errors.nazvanie && <p className={styles.errorMessage}>{errors.nazvanie.message}</p>}
                </div>
              </div>

              {/* Full name */}
              <div className={styles.formRow}>
                <label className={styles.label}>{t('fields.fullName')}</label>
                <div className={styles.inputContainer}>
                  <Input
                    placeholder={t('placeholders.fullName')}
                    className={styles.input}
                    {...register('polnoe_imya')}
                  />
                </div>
              </div>

              {/* Address */}
              <div className={styles.formRow}>
                <label className={styles.label}>{t('fields.address')}</label>
                <div className={styles.inputContainer}>
                  <Input
                    placeholder={t('placeholders.address')}
                    className={styles.input}
                    {...register('address')}
                  />
                </div>
              </div>

              {/* Group */}
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
                        className="flex-1 bg-white"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Requisites toggle */}
              <div className={styles.formRow}>
                <label className={styles.label} />
                <button
                  type="button"
                  onClick={() => setDetails(prev => !prev)}
                  className={styles.requisites}
                >
                  <p>{t('requisites')}</p>
                </button>
              </div>

              {/* Requisites fields */}
              <div className={cn(styles.requisitesContainer, details && styles.active)}>

                {/* INN */}
                <div className={styles.formRow}>
                  <label className={styles.label}>
                    {t('fields.inn')} <span className={styles.infoIcon}>?</span>
                  </label>
                  <div className={styles.inputContainer}>
                    <Controller
                      name="inn"
                      control={control}
                      render={({ field }) => (
                        <Input
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder={t('placeholders.inn')}
                          className={cn(styles.input, styles.requisitesInput)}
                          value={field.value}
                          onChange={e => field.onChange(includeNumber(e.target.value))}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* KPP */}
                <div className={styles.formRow}>
                  <label className={styles.label}>{t('fields.kpp')}</label>
                  <DynamicFieldList
                    fields={kppFields}
                    onAppend={() => appendKpp({ value: '' })}
                    onRemove={removeKpp}
                    renderInput={(index) => (
                      <Controller
                        name={`kpp.${index}.value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={t('placeholders.kpp')}
                            className={cn(styles.input, styles.requisitesInput)}
                            value={field.value}
                            onChange={e => field.onChange(includeNumber(e.target.value))}
                          />
                        )}
                      />
                    )}
                  />
                </div>

                {/* Account number */}
                <div className={styles.formRow}>
                  <label className={styles.label}>{t('fields.accountNumber')}</label>
                  <DynamicFieldList
                    fields={accountFields}
                    onAppend={() => appendAccount({ value: '' })}
                    onRemove={removeAccount}
                    renderInput={(index) => (
                      <Controller
                        name={`account_number.${index}.value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={t('placeholders.account')}
                            className={cn(styles.input, styles.requisitesInput)}
                            value={field.value}
                            onChange={e => field.onChange(includeNumber(e.target.value))}
                          />
                        )}
                      />
                    )}
                  />
                </div>

                {/* Bank */}
                <div className={styles.formRow}>
                  <label className={styles.label}>{t('fields.bank')}</label>
                  <div className={styles.inputContainer}>
                    <Input
                      placeholder={t('placeholders.bank')}
                      className={cn(styles.input, styles.requisitesInput)}
                      {...register('bank')}
                    />
                  </div>
                </div>

                {/* MFO */}
                <div className={styles.formRow}>
                  <label className={styles.label}>{t('fields.mfo')}</label>
                  <div className={styles.inputContainer}>
                    <Input
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={t('placeholders.mfo')}
                      className={cn(styles.input, styles.requisitesInput)}
                      {...register('mfo')}
                    />
                  </div>
                </div>
              </div>
              {appStore.isDonoSchool && (
                <div className={styles.formRow}>
                  <label className={styles.label} />
                  <Controller
                    name="not_student"
                    control={control}
                    render={({ field }) => (
                      <OperationCheckbox
                        checked={field.value}
                        onChange={field.onChange}
                        label={t('fields.notStudent')}
                      />
                    )}
                  />
                </div>
              )}

              <div className={styles.formRow}>
                <label className={styles.label} />
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
              </div>

              {/* Article selects */}
              {showArticles && (
                <>
                  {([{
                    name: 'chart_of_accounts_id',
                    label: 'fields.articleIn',
                    placeholder: 'fields.articleIn'
                  }, {
                    name: 'chart_of_accounts_id_2',
                    label: 'fields.articleOut',
                    placeholder: 'fields.articleIn'

                  }]).map((fieldName, i) => (
                    <div key={fieldName.name} className={styles.formRow}>
                      <label className={styles.label}>
                        {t(fieldName.label)}
                      </label>
                      <div className={styles.inputContainer}>
                        <Controller
                          name={fieldName?.name}
                          control={control}
                          render={({ field }) => (
                            <SinglSelectStatiya
                              selectedValue={field.value}
                              setSelectedValue={field.onChange}
                              placeholder={t(fieldName.placeholder)}
                              className="flex-1 bg-white"
                              type={i === 0 ? 'Расходы' : 'Доходы'}
                            />
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Comment */}
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
            </form>

          ) : (
            /* ── Group Form ── */
            <form id="group-form" className={styles.form} onSubmit={handleSubmitGroup(onSubmitGroup)}>
              <div className={styles.formRow}>
                <label className={styles.label}>
                  {t('fields.groupName')} <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputContainer}>
                  <Input
                    placeholder={t('placeholders.groupName')}
                    className={cn(styles.input, groupErrors.nazvanie_gruppy && styles.inputError)}
                    {...registerGroup('nazvanie_gruppy', { required: t('errors.groupNameRequired') })}
                  />
                  {groupErrors.nazvanie_gruppy && (
                    <p className={styles.errorMessage}>{groupErrors.nazvanie_gruppy.message}</p>
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
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t flex items-center justify-end p-2 gap-2">
          <button type="button" onClick={handleClose} className="secondary-btn" disabled={isSubmitting}>
            {t('cancel')}
          </button>
          <button
            type="submit"
            form={activeTab === 'counterparty' ? 'counterparty-form' : 'group-form'}
            className="primary-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isEdit ? t('saving') : t('creating'))
              : (isEdit ? t('save') : t('create'))}
          </button>
        </div>
      </div>

      {/* Edit Group Modal */}
      {editingGroup && (
        <EditCounterpartyGroupModal
          isOpen
          onClose={() => setEditingGroup(null)}
          group={editingGroup}
        />
      )}

      {/* Delete Group Modal */}
      <DeleteGroupConfirmModal
        isOpen={!!deletingGroup}
        group={deletingGroup}
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeletingGroup(null)}
        isDeleting={deleteGroupMutation.isPending}
      />
    </CustomDialog>
  )
})

export default CreateCounterpartyModal