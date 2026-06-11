'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { useTranslations } from 'next-intl'

const AccrualDateSetting = ({ isAccrualDate, setIsAccrualDate }) => {
  const tg = useTranslations('Settings.general')

  return (
    <OperationCheckbox
      checked={isAccrualDate}
      onChange={() => setIsAccrualDate(!isAccrualDate)}
      label={tg('accounting.accrualDate')}
    />
  )
}

export default AccrualDateSetting
