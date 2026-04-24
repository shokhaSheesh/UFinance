import AccountBalance from '../../../components/Indicators/AccountBalance'
import CashFlow from '../../../components/Indicators/CashFlow'
import Expenses from '../../../components/Indicators/Expenses'
import IndicatorsNavbar from '../../../components/Indicators/Header'
import Income from '../../../components/Indicators/Income'
import Profit from '../../../components/Indicators/Profit'
import ProfitableClients from '../../../components/Indicators/ProfitableClients'

const IndicatorsPage = () => {
  return (
    <div className='fixed left-[80px] bg-white w-[calc(100%-80px)] top-[60px] h-[calc(100%-60px)] overflow-y-auto overflow-x-visible'>
      <div className='w-full sticky top-0 z-1000'>
        <IndicatorsNavbar />
      </div>
      <div className="max-w-[1600px] mx-auto p-4 space-y-6">
        <Profit />
        <CashFlow />
        <AccountBalance />
        <Income />
        <Expenses />
        <ProfitableClients />
      </div>
    </div>
  )
}

export default IndicatorsPage