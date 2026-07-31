'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import TextArea from '@/components/shared/TextArea'
import { appStore } from '@/store/app.store'
import { Loader2, X } from 'lucide-react'
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

const Row = ({ label, required, children }) => (
  <div className="grid grid-cols-7 gap-2">
    <label className="col-span-2 flex items-center text-sm text-gray-700">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    <div className="col-span-5">{children}</div>
  </div>
)

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

const BudgetForm = ({ budget, onClose, onSubmit, t, monthLabels, legalEntities, projects, currencies, isSaving }) => {
  const isEdit = !!budget
  const [form, setForm] = useState(() => (budget ? { ...EMPTY, ...budget } : EMPTY))
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
    <CustomDialog
      open
      onClose={onClose}
      contentClass="min-w-[560px]! max-w-[560px] p-0 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="m-0 text-lg font-semibold text-slate-900">
          {isEdit ? t('form.editTitle') : t('form.createTitle')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          aria-label={t('form.close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3 p-5 text-sm">
        <Row label={t('form.name')} required>
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('form.namePlaceholder')}
            error={!!errors.name}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </Row>

        <Row label={t('form.period')}>
          <MonthRangePicker
            value={form.period}
            onChange={(period) => set('period', period)}
            monthLabels={monthLabels}
            width="100%"
          />
        </Row>

        <Row label={t('form.legalEntity')} required>
          <SingleSelect
            data={toOptions(legalEntities)}
            value={form.legalEntity}
            onChange={(v) => set('legalEntity', v)}
            placeholder={t('form.legalEntityPlaceholder')}
            hasError={!!errors.legalEntity}
            className="bg-white"
          />
          {errors.legalEntity && <p className="mt-1 text-xs text-red-500">{errors.legalEntity}</p>}
        </Row>

        {/* Проект — только при включённом модуле «Проекты» */}
        {appStore.projectActive && (
          <Row label={t('form.project')}>
            <SingleSelect
              data={toOptions(projects)}
              value={form.project}
              onChange={(v) => set('project', v)}
              placeholder={t('form.projectPlaceholder')}
              className="bg-white"
            />
          </Row>
        )}

        <Row label={t('form.currency')} required>
          <SingleSelect
            data={toOptions(currencies)}
            value={form.currency}
            onChange={(v) => set('currency', v)}
            withSearch={false}
            isClearable={false}
            placeholder={t('form.currencyPlaceholder')}
            hasError={!!errors.currency}
            className="bg-white"
          />
          {errors.currency && <p className="mt-1 text-xs text-red-500">{errors.currency}</p>}
        </Row>

        <Row label={t('form.comment')}>
          <TextArea
            value={form.comment}
            onChange={(e) => set('comment', e.target.value)}
            placeholder={t('form.commentPlaceholder')}
          />
        </Row>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
        <button type="button" onClick={onClose} className="secondary-btn" disabled={isSaving}>
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
      </div>
    </CustomDialog>
  )
}

export default BudgetFormModal
