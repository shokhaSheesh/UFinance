'use client'

import { showErrorNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { useTranslations } from 'next-intl'

/**
 * Закрытый период роли: до какой даты нельзя трогать операции.
 *
 * `minDate` отдаём прямо в react-multi-date-picker, чтобы закрытые дни
 * нельзя было выбрать, а `ensureAllowed` страхует отправку формы
 * (дата могла остаться с прошлого открытия или прийти из копии).
 *
 * Компонент-потребитель должен быть `observer`, иначе не перерисуется
 * после смены филиала.
 */
export const useDataEditingRestriction = () => {
  const t = useTranslations('Settings.roles.restriction')

  const minDate = appStore.getEditableFromDate()
  const isAllowed = (dates) => appStore.canEditDates(dates)

  const ensureAllowed = (dates) => {
    if (isAllowed(dates)) return true
    showErrorNotification(t('blocked'))
    return false
  }

  return { minDate, isAllowed, ensureAllowed }
}

export default useDataEditingRestriction
