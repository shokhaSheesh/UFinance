// Интерфейсные настройки из get_general_settings (раздел 2.3 API).
// Бэк всегда возвращает их булевыми и хранит в записи компании,
// в update_general_settings они partial — шлём только изменённые.
//
// apiKey   — имя поля в object_data
// storeKey — имя поля в appStore.interfaceSettings
// aliasKey — устаревший синоним, который бэк тоже возвращает
export const INTERFACE_SETTING_GROUPS = [
  {
    id: 'operations',
    titleKey: 'accounting.operations',
    items: [
      {
        apiKey: 'set_current_date_on_copy',
        storeKey: 'setCurrentDateOnCopy',
        labelKey: 'interface.setCurrentDateOnCopy',
      },
      {
        apiKey: 'show_accrual_date_on_create',
        storeKey: 'showAccrualDateOnCreate',
        labelKey: 'interface.showAccrualDateOnCreate',
      },
      {
        apiKey: 'is_payment_purpose_optional',
        storeKey: 'isPaymentPurposeOptional',
        labelKey: 'interface.isPaymentPurposeOptional',
      },
    ],
  },
  {
    id: 'operationsList',
    titleKey: 'accounting.operationsList',
    items: [
      {
        apiKey: 'show_accrual_date_filter',
        storeKey: 'showAccrualDateFilter',
        labelKey: 'interface.showAccrualDateFilter',
      },
      {
        apiKey: 'show_article_category_in_list',
        storeKey: 'showArticleCategoryInList',
        labelKey: 'interface.showArticleCategoryInList',
      },
      {
        apiKey: 'show_payment_order_number',
        storeKey: 'showPaymentOrderNumber',
        labelKey: 'interface.showPaymentOrderNumber',
      },
    ],
  },
  {
    id: 'display',
    titleKey: 'accounting.display',
    items: [
      {
        apiKey: 'show_cents',
        // бэк отдаёт оба поля с одинаковым значением, show_cents приоритетнее
        aliasKey: 'show_fractional_part',
        storeKey: 'showCents',
        labelKey: 'interface.showCents',
      },
      {
        apiKey: 'show_past_cash_gaps',
        storeKey: 'showPastCashGaps',
        labelKey: 'interface.showPastCashGaps',
      },
      {
        apiKey: 'hide_tooltip_questions',
        storeKey: 'hideTooltipQuestions',
        labelKey: 'interface.hideTooltipQuestions',
      },
    ],
  },
]

export const INTERFACE_SETTING_FIELDS = INTERFACE_SETTING_GROUPS.flatMap(group => group.items)

export const DEFAULT_INTERFACE_SETTINGS = INTERFACE_SETTING_FIELDS.reduce((acc, field) => {
  acc[field.storeKey] = false
  return acc
}, {})

// Ответ get_general_settings / update_general_settings → форма appStore
export const mapInterfaceSettingsFromApi = data =>
  INTERFACE_SETTING_FIELDS.reduce((acc, field) => {
    const raw = data?.[field.apiKey] ?? (field.aliasKey ? data?.[field.aliasKey] : undefined)
    acc[field.storeKey] = Boolean(raw)
    return acc
  }, {})
