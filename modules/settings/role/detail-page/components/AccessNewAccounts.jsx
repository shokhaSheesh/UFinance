'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import HintQuestion from '@/components/shared/HintQuestion'
import CustomTooltip from '@/components/shared/Tooltip'

/**
 * «Разрешать доступ к новым юрлицам и счетам» — флаг access_new_accounts.
 * Бэк перезаписывает его на каждом update_role_permissions, поэтому текущее
 * значение уходит вместе с деревом из вкладки «Юрлица и счета».
 */
const AccessNewAccounts = ({ checked, onChange, t }) => {
  return (
    <div className="flex items-center gap-2 pb-4">
      <OperationCheckbox
        checked={!!checked}
        onChange={() => onChange(!checked)}
        label={t('accounts.accessNew')}
      />
      <CustomTooltip content={t('accounts.accessNewHint')} side="right">
        <span className="flex items-center cursor-help">
          <HintQuestion size={15} />
        </span>
      </CustomTooltip>
    </div>
  )
}

export default AccessNewAccounts
