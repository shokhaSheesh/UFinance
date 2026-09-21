'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import TextArea from '@/components/shared/TextArea'
import { appStore } from '@/store/app.store'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import MonthRangePicker from './MonthRangePicker'

const currentYear = new Date().getFullYear()

const EMPTY = {
  name: '',
  period: { start: `${currentYear}-01`, end: `${currentYear}-12` },
  legalEntity: null,
  project: null,
  currency: null,
  comment: ''
}

// Справочники приходят как { key, label }; селекты проекта ждут { value, label }.
const toOptions = (list) => list.map((o) => ({ value: o.value ?? o.key, label: o.label }))

/**
 * Модалка создания и редактирования бюджета (БДДС и БДР).
 * Один компонент на оба режима: если передан `budget`, форма работает
 * на редактирование и кнопка меняется на «Сохранить».
 */
const BudgetFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  budget = null,
  t,
  monthLabels,
  legalEntities = [],
  projects = [],
  currencies = [],
  isSaving = false
}) => {
  if (!isOpen) return null

  // key заставляет форму пересоздаться при смене режима/бюджета,
  // поэтому начальные значения задаются в useState без useEffect
  return (
    <BudgetForm
      key={budget?.id ?? 'new'}
      budget={budget}
      onClose={onClose}
      onSubmit={onSubmit}
      t={t}
      monthLabels={monthLabels}
      legalEntities={legalEntities}
      projects={projects}
      currencies={currencies}
      isSaving={isSaving}
    />
  )
}

// У бюджета может не быть дат (start_date/end_date приходят null) —
// подставляем период по умолчанию, чтобы форма и пикер показывали одно и то же
const withPeriod = (budget) => ({
  ...EMPTY,
  ...budget,
  period: {
    start: budget?.period?.start || EMPTY.period.start,
    end: budget?.period?.end || EMPTY.period.end
  }
})

const BudgetForm = ({ budget, onClose, onSubmit, t, monthLabels, legalEntities, projects, currencies, isSaving }) => {
  const isEdit = !!budget
  const [form, setForm] = useState(() => (budget ? withPeriod(budget) : EMPTY))
  const [errors, setErrors] = useState({})

  // Валюта обязательна: пока не выбрана — подставляем первую из справочника
  // (он может догрузиться уже после открытия модалки)
  if (!form.currency && currencies.length) {
    setForm((prev) => (prev.currency ? prev : { ...prev, currency: currencies[0].value ?? currencies[0].key }))
  }

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = t('form.errors.name')
    if (!form.legalEntity) nextErrors.legalEntity = t('form.errors.legalEntity')
    if (!form.currency) nextErrors.currency = t('form.errors.currency')
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    // onSubmit может вернуть промис мутации — тогда закрываемся после успеха
    const result = onSubmit({ ...form, name: form.name.trim() })
    if (result?.then) result.then(() => onClose()).catch(() => {})
    else onClose()
  }

  return (
    <CustomDialog open onClose={onClose} contentClass="w-[560px]">
      <DialogHeader title={isEdit ? t('form.editTitle') : t('form.createTitle')} onClose={onClose} />

      <DialogBody className="flex flex-col gap-4">
        <FormRow label={t('form.name')} required error={errors.name}>
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('form.namePlaceholder')}
            error={!!errors.name}
          />
        </FormRow>

        <FormRow label={t('form.period')}>
          <MonthRangePicker
            value={form.period}
            onChange={(period) => set('period', period)}
            monthLabels={monthLabels}
            width="100%"
          />
        </FormRow>

        <FormRow label={t('form.legalEntity')} required error={errors.legalEntity}>
          <SingleSelect
            data={toOptions(legalEntities)}
            value={form.legalEntity}
            onChange={(v) => set('legalEntity', v)}
            placeholder={t('form.legalEntityPlaceholder')}
            hasError={!!errors.legalEntity}
            className="bg-white"
          />
        </FormRow>

        {/* Проект — только при включённом модуле «Проекты» */}
        {appStore.projectActive && (
          <FormRow label={t('form.project')}>
            <SingleSelect
              data={toOptions(projects)}
              value={form.project}
              onChange={(v) => set('project', v)}
              placeholder={t('form.projectPlaceholder')}
              className="bg-white"
            />
          </FormRow>
        )}

        <FormRow label={t('form.currency')} required error={errors.currency}>
          <SingleSelect
            data={toOptions(currencies)}
            value={form.currency}
            onChange={(v) => set('currency', v)}
            isClearable={false}
            placeholder={t('form.currencyPlaceholder')}
            hasError={!!errors.currency}
            className="bg-white"
          />
        </FormRow>

        <FormRow label={t('form.comment')} align="start">
          <TextArea
            value={form.comment}
            onChange={(e) => set('comment', e.target.value)}
            placeholder={t('form.commentPlaceholder')}
          />
        </FormRow>
      </DialogBody>

      <DialogFooter>
        <button type="button" onClick={onClose} className="secondary-btn h-9" disabled={isSaving}>
          {t('form.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="primary-btn flex items-center gap-2"
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? t('form.save') : t('form.create')}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
}

export default BudgetFormModal
