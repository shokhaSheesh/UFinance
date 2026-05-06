'use client'

import { observer } from 'mobx-react-lite'
import moment from 'moment/moment'
import { useTranslations } from 'next-intl'
import { appStore } from '../../../../store/app.store'

const CurrenciesPage = observer(() => {
  const tc = useTranslations('Settings.currencies')

  const currentDate = new Date()

  return (
    <div className="flex-1  bg-gray-50 overflow-scroll relative">
      <div className="max-w-7xl mx-auto bg-gray-50">
        <h1 className="text-2xl font-semibold px-6 h-16 sticky top-0 z-10 bg-gray-50 flex items-center">
          {tc('pageTitle')} ({tc('updated')} {moment(currentDate).format('DD.MM.YYYY')})
        </h1> 
        <div className="w-full px-6 pb-6 text-left border-collapse">
          <div className="bg-neutral-100 sticky  top-16 flex border-b border-gray-200">
            <div className="px-6 py-3 w-64 text-sm capitalize font-semibold text-gray-500 tracking-wider">
              {tc('name')}
            </div>
            <div className="px-6 py-3 w-36 text-sm capitalize font-semibold text-gray-500 tracking-wider">
              {tc('code')}
            </div>
            <div className="px-6 py-3 w-36 text-sm capitalize font-semibold text-gray-900 tracking-wider">
              {tc('symbol')}
            </div>
            <div className="px-6 py-3 w-36 text-sm capitalize font-semibold text-gray-500 tracking-wider">
              {tc('rate')}
            </div>
          </div>
          {appStore.currencies.map((currency) => (
            <div key={currency.guid} className="hover:bg-gray-50 bg-white! text-gray-900 text-xss! flex border-b cursor-pointer transition-colors">
              <div className="px-6 py-4 w-64 ">
                {currency.nazvanie}
              </div>
              <div className="px-6 py-4 w-36 ">
                {currency.kod}
              </div>
              <div className="px-6 py-4 w-36  ">
                {currency.icon}
              </div>
              <div className="px-6 py-4 w-36  tabular-nums">
                {Number(currency?.rate).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default CurrenciesPage