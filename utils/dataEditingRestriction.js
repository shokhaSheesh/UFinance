/**
 * Ограничение изменения внесённых данных («закрытый период»).
 *
 * Настройка живёт на роли (см. update_role_permissions / get_role_permissions)
 * и приезжает вместе с правами в get_user_role_permissions при входе и при
 * смене филиала. Пользователь с такой ролью может создавать, менять и удалять
 * только те операции (в т.ч. отгрузки и поставки), дата оплаты или начисления
 * которых попадает в разрешённый период.
 *
 * Два варианта периода:
 *   by_days_count      — разрешено N последних дней: дата >= сегодня − N
 *   until_specific_date — разрешено всё, что позднее выбранной даты: дата > дата_ограничения
 */

export const RESTRICTION_TYPES = {
  BY_DAYS: 'by_days_count',
  UNTIL_DATE: 'until_specific_date',
}

export const DEFAULT_DATA_EDITING_RESTRICTION = {
  isRestricted: false,
  type: RESTRICTION_TYPES.BY_DAYS,
  daysCount: 0,
  untilDate: '',
}

const startOfDay = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

// Ответ get_role_permissions / get_user_role_permissions → состояние стора и формы
export const mapRestrictionFromApi = (data) => ({
  isRestricted: !!data?.is_data_editing_restricted,
  type:
    data?.data_editing_restriction_type === RESTRICTION_TYPES.UNTIL_DATE
      ? RESTRICTION_TYPES.UNTIL_DATE
      : RESTRICTION_TYPES.BY_DAYS,
  daysCount: Number(data?.allowed_editing_days_count) || 0,
  untilDate: data?.allowed_editing_until_date || '',
})

// Состояние формы → object_data для update_role_permissions.
// Бэк пишет только поле выбранного типа, поэтому второе не отправляем.
export const mapRestrictionToApi = (restriction) => {
  const isRestricted = !!restriction?.isRestricted
  const type =
    restriction?.type === RESTRICTION_TYPES.UNTIL_DATE
      ? RESTRICTION_TYPES.UNTIL_DATE
      : RESTRICTION_TYPES.BY_DAYS

  if (type === RESTRICTION_TYPES.UNTIL_DATE) {
    return {
      is_data_editing_restricted: isRestricted,
      data_editing_restriction_type: type,
      allowed_editing_until_date: restriction?.untilDate || '',
    }
  }

  return {
    is_data_editing_restricted: isRestricted,
    data_editing_restriction_type: type,
    allowed_editing_days_count: Math.max(0, Number(restriction?.daysCount) || 0),
  }
}

/**
 * Самая ранняя дата, которую разрешено трогать. `null` — ограничения нет.
 */
export const getEditableFromDate = (restriction) => {
  if (!restriction?.isRestricted) return null

  if (restriction?.type === RESTRICTION_TYPES.UNTIL_DATE) {
    const until = startOfDay(restriction?.untilDate)
    if (!until) return null
    // «позднее выбранной даты» — сама дата ограничения уже закрыта
    until.setDate(until.getDate() + 1)
    return until
  }

  const days = Math.max(0, Number(restriction?.daysCount) || 0)
  const from = startOfDay(new Date())
  from.setDate(from.getDate() - days)
  return from
}

/**
 * Дата попадает в разрешённый период.
 */
export const isDateAllowed = (date, restriction) => {
  const from = getEditableFromDate(restriction)
  if (!from) return true
  const target = startOfDay(date)
  if (!target) return true
  return target.getTime() >= from.getTime()
}

/**
 * Операцию можно менять, если хотя бы одна из её дат (оплаты или начисления)
 * попадает в разрешённый период — так сформулирована подсказка в интерфейсе.
 */
export const areDatesAllowed = (dates, restriction) => {
  const from = getEditableFromDate(restriction)
  if (!from) return true

  const parsed = (Array.isArray(dates) ? dates : [dates])
    .map(startOfDay)
    .filter(Boolean)

  if (parsed.length === 0) return true
  return parsed.some((date) => date.getTime() >= from.getTime())
}
