'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { useTranslations } from 'next-intl'

const PaymentSetting = ({ isPayment, setIsPayment }) => {
  const tg = useTranslations('Settings.general')

  return (
    <OperationCheckbox
      checked={isPayment}
      onChange={() => setIsPayment(!isPayment)}
      label={tg('accounting.paymentType')}
    />
  )
}

export default PaymentSetting
