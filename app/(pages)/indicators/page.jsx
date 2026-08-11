import Debts from '@/components/Indicators/Debts'
import Students from '@/components/Indicators/Students'
import AccountBalance from '../../../components/Indicators/AccountBalance'
import CashFlow from '../../../components/Indicators/CashFlow'
import IndicatorsNavbar from '../../../components/Indicators/Header'
import PaymentStructure from '../../../components/Indicators/PaymentStructure'
import Profit from '../../../components/Indicators/Profit'
import ProfitableClients from '../../../components/Indicators/ProfitableClients'

const IndicatorsPage = () => {
  return (
    <div className='fixed left-[80px] bg-white w-[calc(100%-80px)] top-[60px] h-[calc(100%-60px)] overflow-y-auto overflow-x-visible'>
      <div className='w-full sticky top-0 z-1000'>
        <IndicatorsNavbar />
      </div>
      <div className="  p-4 space-y-6">
        <Students />
        <Profit />
        <CashFlow />
        <AccountBalance />
        <PaymentStructure />
        <ProfitableClients />
        <Debts />
      </div>
    </div>
  )
}

export default IndicatorsPage