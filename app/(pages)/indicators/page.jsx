import AccountBalance from '@/components/Indicators/AccountBalance'
import CashFlow from '@/components/Indicators/CashFlow'
import IndicatorsNavbar from '@/components/Indicators/Header'
import PaymentStructure from '@/components/Indicators/PaymentStructure'
import Profit from '@/components/Indicators/Profit'
import ProfitableClients from '@/components/Indicators/ProfitableClients'
import Students from '@/components/Indicators/Students'
import FixedContent from '@/layouts/FixedContent'

const IndicatorsPage = () => {
  return (
    <FixedContent className='bg-white overflow-y-auto flex-col overflow-x-visible'>
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
      </div>
    </FixedContent>
  )
}

export default IndicatorsPage