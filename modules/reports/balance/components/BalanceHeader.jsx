import { balanceStore } from '@/components/reports/balance/balance.store'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { appStore } from '@/store/app.store'
import { Loader2 } from 'lucide-react'

const BalanceHeader = ({ t, onExport, isExporting }) => (
  <div className="flex px-4 h-16 items-center sticky top-0 z-20 bg-white justify-between">
    <div className="flex items-center gap-4">
      <h1 className='text-xl whitespace-nowrap font-semibold'>{t('balance.title')}</h1>
      <SingleSelect
        data={appStore.myCurrencies}
        value={balanceStore.selectedCurrency}
        onChange={(value) => {
          balanceStore.setSelectedCurrency(value)
          balanceStore.fetchBalance()
        }}
        isClearable={false}
        withSearch={false}
        className={'bg-white w-28'}
        dropdownClassName={'w-28'}
      />
    </div>
    <div>
      <button onClick={onExport} type='button' className="primary-btn">
        {t('common.downloadExcel')} {isExporting && <Loader2 size={16} className="animate-spin" />}
      </button>
    </div>
  </div>
)

export default BalanceHeader
