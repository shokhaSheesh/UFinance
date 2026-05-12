'use client'
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

import { Lobster } from "next/font/google";

const lobster = Lobster({
  style: "normal",
  weight: ['400'],
  subsets: ['latin']
})

const Payment = () => {
  const t = useTranslations('Payment');
  const [paymentAmount, setPaymentAmount] = useState('100 000')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('click')
  const [selectedLanguage, setSelectedLanguage] = useState('O\'zb')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')

  const paymentMethods = [
    { id: 'click', name: t('paymentMethods.click'), commission: t('paymentMethods.clickCommission'), logo: <Image className='rounded-md' src="/assets/images/click.jpeg" width={30} height={30} alt='click' /> },
    { id: 'uzum', name: t('paymentMethods.uzum'), commission: t('paymentMethods.uzumCommission'), logo: <Image className='rounded-md' src="/assets/images/uzum.jpeg" width={30} height={30} alt='uzum' /> },
    { id: 'payme', name: t('paymentMethods.payme'), commission: t('paymentMethods.paymeCommission'), logo: <Image className='rounded-md' src="/assets/images/payme.png" width={30} height={30} alt='paymen' /> }
  ]

  const languages = ['O\'zb', 'Pyc']

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value)
    setExpiry(formatted)
  }

  const handlePaymentAmountChange = (e) => {
    const value = e.target.value.replace(/\s/g, '')
    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    setPaymentAmount(formatted)
  }

  return (
    <div className="min-h-screen bg-white  flex items-start justify-center">
      <div className=" rounded-2xl px-8 pt-5 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`gap-2 text-center  text-4xl tracking-tighter text-brand-orange`}>
            <span className={`${lobster.className}  text-[#db8a53]`}>wlcm</span>
            <span className="px-6 font-sans text-neutral-300">{t('header.to')}</span>
            <span className="font-sans text-gray-800">{t('header.uFinance')}</span>
          </h1>
        </div>

        {/* Payment Amount */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-600 mb-3">
            {t('paymentAmount.label')}
          </label>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500  text-sm">
              {t('paymentAmount.currency')}
            </div>
            <input
              type="text"
              value={paymentAmount}
              onChange={handlePaymentAmountChange}
              className="w-full px-4 py-3  border border-gray-300 rounded-2xl  outline-none text-lg  text-gray-900 bg-gray-50"
              placeholder="0"
            />
          </div>
        </div>

        {/* By Card Section */}
        <div className="mb-6 ">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{t('byCard.title')}</h3>
            <span className="text-green-600 font-medium text-sm">{t('byCard.commission')}</span>
          </div>

          <div className="flex items-center space-y-3 gap-2 border-2 border-primary rounded-xl p-3 ">
            <label htmlFor="card_number" className='w-full m-0'>
              <span>{t('byCard.cardNumber')}</span>
              <input
                type="text"
                id='card_number'
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder={t('byCard.cardPlaceholder')}
                maxLength={19}
                className="w-full px-4 py-3 border m-0 bg-gray-50 border-gray-300  rounded-lg   outline-none"
              />
            </label>


            <label htmlFor="expited_date">
              <span>{t('byCard.expiry')}</span>
              <input
                type="text"
                id='expited_date'
                value={expiry}
                onChange={handleExpiryChange}
                placeholder={t('byCard.expiryPlaceholder')}
                maxLength={5}
                className="px-4 py-3 w-fit border m-0 bg-gray-50 border-gray-300  rounded-lg   outline-none"
              />
            </label>
          </div>
        </div>

        {/* Online Payment Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('onlinePayment.title')}</h3>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedPaymentMethod === method.id
                  ? 'border-primary bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  {method.logo}
                  <span className="font-medium text-gray-800">{method.name}</span>
                </div>
                <span className="text-sm text-gray-600">{method.commission}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${selectedLanguage === lang
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-6">
          <p className="text-xs text-gray-600 text-center">
            {t('terms.text')}
          </p>
        </div>

        {/* Pay Button */}
        <button className="w-full bg-primary hover:bg-primary-dark cursor-pointer text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2">
          <span>{t('payButton.text', { amount: paymentAmount })}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Payment