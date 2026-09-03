'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import {
  INTERFACE_SETTING_FIELDS,
  INTERFACE_SETTING_GROUPS,
} from '@/constants/generalSettings'
import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const CURRENCY_DEPENDENT_QUERY_KEYS = [
  'get_general_settings',
  'get_my_accounts',
  'find_operations',
  'list_sales_operations',
  'list_products_and_services',
  'get_counterparties',
  'get_counterparties_groups',
  'cash_flow',
  'profit_and_loss',
  'get_sales_list_simple',
  'get_legal_entities',
  'balance_report',
]

// Длинные подписи чекбоксов не должны обрезаться в одну строку
const CHECKBOX_CLASS = 'items-start [&>span]:line-clamp-none [&>span]:leading-5'

const SettingsCard = ({ title, children }) => (
  <section className="bg-white rounded-xl border border-gray-200 p-5">
    <h2 className="text-[15px] font-bold text-slate-900 mb-4">{title}</h2>
    {children}
  </section>
)

const SettingsGroup = ({ title, children }) => (
  <div className="flex flex-col gap-2.5 items-start">
    <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    {children}
  </div>
)

const SettingsPage = observer(() => {
  const tg = useTranslations('Settings.general')
  const tc = useTranslations('Settings.common')
  const { mutateAsync: updateSettings, isPending: isSaving } = useUcodeRequestMutation()

  // Значения, пришедшие с бэка (get_general_settings через AppProvider).
  // Форма сравнивается с ними, чтобы понять что изменилось.
  const baseline = {
    companyName: appStore.companyName || '',
    currencyId: appStore?.currency?.guid || '',
    isPayment: Boolean(appStore.isPayment),
    isAccrualDate: Boolean(appStore.isAccrualDate),
    projectActive: Boolean(appStore.projectActive),
    attendanceActive: Boolean(appStore.attendanceActive),
    ...appStore.interfaceSettings,
  }
  const baselineKey = JSON.stringify(baseline)

  const [form, setForm] = useState(baseline)

  // appStore ещё гидратируется из `get_general_settings`, когда страница
  // монтируется, поэтому начальное значение useState может быть устаревшим.
  // Пересинхронизируем форму, как только приходят реальные значения.
  useEffect(() => {
    setForm(JSON.parse(baselineKey))
  }, [baselineKey])

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const toggle = key => setForm(prev => ({ ...prev, [key]: !prev[key] }))
  const isChanged = key => form[key] !== baseline[key]

  const currenciesList = appStore.currencies?.map(c => ({
    value: c.guid,
    label: `${c?.kod} (${c.nazvanie})`,
  }))

  const trimmedCompanyName = form.companyName?.trim() || ''
  // Пустое название бэк игнорирует, поэтому и за изменение его не считаем
  const isCompanyNameChanged = Boolean(trimmedCompanyName) && trimmedCompanyName !== baseline.companyName
  const isCurrencyChanged = isChanged('currencyId')
  // давомат есть только у школ/садов — у остальных чекбокс не показываем
  const isAttendanceChanged = appStore.isDonoSchool && isChanged('attendanceActive')

  const hasChanges =
    isCompanyNameChanged ||
    isCurrencyChanged ||
    isAttendanceChanged ||
    isChanged('isPayment') ||
    isChanged('isAccrualDate') ||
    isChanged('projectActive') ||
    INTERFACE_SETTING_FIELDS.some(field => isChanged(field.storeKey))

  const handleSaveSettings = async () => {
    const selectedCurrency = appStore.currencies?.find(c => c.guid === form.currencyId)

    const data = {
      // Валюту и режимы учёта бэк перезаписывает при каждом сохранении:
      // если их не отправить, is_payment / is_accural_date сбросятся в false
      default_currency_id: form.currencyId,
      default_currency_code: selectedCurrency?.kod,
      is_payment: form.isPayment,
      is_accural_date: form.isAccrualDate,
      // чекбоксы «Мой склад» и «Возвраты» скрыты из UI — значения,
      // пришедшие с бэка, отправляем обратно без изменений
      warehouse_active: appStore.warehouseActive,
      return_active: appStore.returnActive,
    }

    // Остальные поля partial — шлём только изменённые
    if (isChanged('projectActive')) data.project_active = form.projectActive
    if (isAttendanceChanged) data.attendance_active = form.attendanceActive
    if (isCompanyNameChanged) data.company_name = trimmedCompanyName
    INTERFACE_SETTING_FIELDS.forEach(field => {
      if (isChanged(field.storeKey)) data[field.apiKey] = form[field.storeKey]
    })

    try {
      const response = await updateSettings({
        method: 'update_general_settings',
        data,
      })

      // Ответ update_general_settings — это уже сохранённое состояние целиком,
      // поэтому пишем его в стор напрямую и не дёргаем get_general_settings.
      // Локальная форма остаётся страховкой, если ответ пришёл пустым.
      const localState = INTERFACE_SETTING_FIELDS.reduce(
        (acc, field) => {
          acc[field.apiKey] = form[field.storeKey]
          return acc
        },
        {
          company_name: trimmedCompanyName || baseline.companyName,
          is_payment: form.isPayment,
          is_accural_date: form.isAccrualDate,
          project_active: form.projectActive,
          attendance_active: form.attendanceActive,
          warehouse_active: appStore.warehouseActive,
          return_active: appStore.returnActive,
          default_currency_id: form.currencyId,
        },
      )
      const saved = { ...localState, ...(response?.data?.data || {}) }

      const wasAccrualDateChanged = isChanged('isAccrualDate')

      appStore.setCompanyName(saved.company_name)
      appStore.setIsPayment(Boolean(saved.is_payment))
      appStore.setIsAccrualDate(Boolean(saved.is_accural_date))
      if (wasAccrualDateChanged && saved.is_accural_date) {
        appStore.setAccuralDateBranch(authStore?.branch_id)
      }
      appStore.setWarehouseActive(Boolean(saved.warehouse_active))
      appStore.setReturnActive(Boolean(saved.return_active))
      appStore.setProjectActive(Boolean(saved.project_active))
      appStore.setAttendanceActive(Boolean(saved.attendance_active))
      appStore.setInterfaceSettingsFromApi(saved)

      if (isCurrencyChanged) {
        const currency =
          appStore.currencies?.find(c => c.guid === saved.default_currency_id) || selectedCurrency
        appStore.setCurrency({
          name: currency?.icon,
          guid: currency?.guid,
          code: currency?.kod ?? currency?.code,
        })
        CURRENCY_DEPENDENT_QUERY_KEYS.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }

      showSuccessNotification(tg('success'))
    } catch (error) {
      console.error('Error saving settings:', error)
      showErrorNotification(tg('error'))
    }
  }

  return (
    <div className="w-full bg-slate-50 min-h-full">
      <h1 className="text-xl sticky top-0 z-10 bg-slate-50 px-5 pt-5 pb-4 font-bold text-slate-900">
        {tg('pageTitle')}
      </h1>

      <div className="px-5 pb-5 flex flex-col gap-4 max-w-[820px]">
        {/* Настройки аккаунта */}
        <SettingsCard title={tg('account.title')}>
          <div className="flex flex-col gap-4 max-w-[320px]">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1.5">
                {tg('account.businessName')}
              </label>
              <Input
                value={form.companyName}
                onChange={event => setField('companyName', event.target.value)}
                placeholder={tg('account.businessNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1.5">
                {tg('account.currency')}
              </label>
              <div className="relative">
                <SingleSelect
                  data={currenciesList}
                  value={form.currencyId}
                  onChange={value => setField('currencyId', value)}
                  placeholder={tg('account.placeholder')}
                  isClearable={false}
                  className="bg-white text-neutral-700"
                />
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Настройки учёта */}
        <SettingsCard title={tg('accounting.title')}>
          <div className="flex flex-col gap-6">
            {INTERFACE_SETTING_GROUPS.map(group => (
              <SettingsGroup key={group.id} title={tg(group.titleKey)}>
                {/* Режимы учёта живут в той же группе, что и настройки форм операций */}
                {group.id === 'operations' && (
                  <>
                    <OperationCheckbox
                      checked={form.isPayment}
                      onChange={() => toggle('isPayment')}
                      label={tg('accounting.paymentType')}
                      className={CHECKBOX_CLASS}
                    />
                    <OperationCheckbox
                      checked={form.isAccrualDate}
                      onChange={() => toggle('isAccrualDate')}
                      label={tg('accounting.accrualDate')}
                      className={CHECKBOX_CLASS}
                    />
                  </>
                )}
                {group.items.map(item => (
                  <OperationCheckbox
                    key={item.storeKey}
                    checked={Boolean(form[item.storeKey])}
                    onChange={() => toggle(item.storeKey)}
                    label={tg(item.labelKey)}
                    className={CHECKBOX_CLASS}
                  />
                ))}
              </SettingsGroup>
            ))}
          </div>
        </SettingsCard>

        {/* Модули */}
        <SettingsCard title={tg('modules.title')}>
          <div className="flex flex-col gap-2.5 items-start">
            {/* «Мой склад» и «Возвраты» временно скрыты из UI — при сохранении
                их значения уходят на бэк как есть (см. handleSaveSettings) */}
            <OperationCheckbox
              checked={form.projectActive}
              onChange={() => toggle('projectActive')}
              label={tg('modules.projects')}
              className={CHECKBOX_CLASS}
            />
            {/* Давомат: перекличка в боте, руководители групп, причины отсутствия.
                Модуль школьный — остальным компаниям чекбокс не нужен */}
            {appStore.isDonoSchool && (
              <OperationCheckbox
                checked={form.attendanceActive}
                onChange={() => toggle('attendanceActive')}
                label={tg('modules.attendance')}
                className={CHECKBOX_CLASS}
              />
            )}
          </div>
        </SettingsCard>
      </div>

      <div className="sticky bottom-0 bg-slate-50 border-t border-gray-200 px-5 py-3 flex justify-start">
        <button
          onClick={handleSaveSettings}
          disabled={!hasChanges || !form.currencyId || isSaving}
          className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? tc('saving') : tc('save')}
        </button>
      </div>
    </div>
  )
})

export default SettingsPage
