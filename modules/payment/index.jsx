'use client'
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import CustomDialog from '@/components/shared/CustomDialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'; // shadcn
import { ClickLogo, PaymeLogo, UzumLogo } from '@/constants/icons';
import { useLocaleSwitcher } from '@/hooks/useLocaleSwitcher';
import useMounted from '@/hooks/useMounted';
import { apiClient } from '@/lib/api/ucode/base';
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications';
import { formatNumber } from '@/utils/helpers';
import { useMutation } from '@tanstack/react-query';
import { Lobster } from "next/font/google";
import Link from 'next/link';
import { useParams } from 'next/navigation';

const lobster = Lobster({
  style: "normal",
  weight: ['400'],
  subsets: ['latin']
})

const Payment = ({ payment }) => {
  const { id } = useParams()
  const mounted = useMounted()
  const t = useTranslations('Payment');
  const { changeLocale, locale, locales } = useLocaleSwitcher();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(locale)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [amount, setAmount] = useState('')

  let originUrl = ''

  if (typeof window !== 'undefined') {
    originUrl = `${window.location.origin}/operations`
  }

  // OTP dialog state
  const [otpOpen, setOtpOpen] = useState(false)
  const [otp, setOtp] = useState('')
  // Stored from card payment response to use in OTP check
  const [otpMeta, setOtpMeta] = useState(null)



  // ─── Queries ────────────────────────────────────────────────────────────────

  const paymentData = useMemo(() => ({
    amount: payment?.amount,
    guid: payment?.guid,
    salesId: payment?.sales_transactions_id,
  }), [payment])

  // ─── Derived state ────────────────────────────────────────────────────────────
  const isReadOnly = Boolean(payment?.amount) // null, 0, undefined → editable

  const displayAmount = isReadOnly
    ? formatNumber(payment.amount)
    : formatNumber(amount)

  // ─── Payment Methods ─────────────────────────────────────────────────────────

  const paymentMethods = [
    { id: 'click', name: t('paymentMethods.click'), commission: t('paymentMethods.clickCommission'), logo: <ClickLogo width={40} height={40} />, fee: 1.5 },
    { id: 'uzum', name: t('paymentMethods.uzum'), commission: t('paymentMethods.uzumCommission'), logo: <UzumLogo width={38} height={38} />, fee: 1 },
    { id: 'payme', name: t('paymentMethods.payme'), commission: t('paymentMethods.paymeCommission'), logo: <PaymeLogo width={38} height={38} />, fee: 1 },
  ]

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const calculateFinalAmount = () => {
    const baseAmount = isReadOnly
      ? payment.amount
      : parseInt(amount?.replace(/\s/g, '')) || 0

    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod)
    const fee = selectedMethod?.fee || 0
    return (baseAmount + (baseAmount * fee / 100)).toLocaleString('uz-UZ')
  }

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language)
    changeLocale(language)
  }

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    return cleaned
  }

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryChange = (e) => {
    setExpiry(formatExpiry(e.target.value))
  }

  // ─── Mutation: Card Payment ───────────────────────────────────────────────────
  // POST create_wlcm_payment_for_card
  // Expects back: { transaction_id, cid } to use in OTP step

  const { mutate: createPaymentWithCard, isPending: isLoadingWithCard } = useMutation({
    mutationKey: ['create_payment_with_card'],
    mutationFn: () => apiClient.invokeFunction({
      method: 'create_wlcm_payment_for_card',
      type: 'role',
      data: {
        amount: parseInt(amount) || 0,
        wlcm_link_id: id,        // active payment method
        card_number: cardNumber.replace(/\s/g, ''),
        card_expiry_date: expiry.replace('/', '').replace(/^(\d{2})(\d{2})$/, '$2$1')     // "MM/YY" → "MMYY"
      }
    }),
    onSuccess: (res) => {
      const result = res?.data
      if (result?.transaction_id && result?.cid) {
        setOtpMeta({ transactionId: result.transaction_id, cid: result.cid })
        setOtpOpen(true)
      }
    },
    onError: () => {
      showErrorNotification(t('error_card'))
    }
  })

  // ─── Mutation: OTP Check ─────────────────────────────────────────────────────
  // POST wlcm_payment_for_card_otp_check

  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useMutation({
    mutationKey: ['wlcm_payment_for_card_otp_check'],
    mutationFn: () => apiClient.invokeFunction({
      method: 'wlcm_payment_for_card_otp_check',
      type: 'role',
      data: {
        amount: parseInt(displayAmount) || 0,
        wlcm_link_id: id,
        transaction_id: otpMeta?.transactionId,
        cid: otpMeta?.cid,
        otp: otp,
      }
    }),
    onSuccess: () => {
      setOtpOpen(false)
      setOtp('')
      setOtpMeta(null)
      // TODO: navigate to success page or show toast
      showSuccessNotification(t('success'))
      setCardNumber('')
      setExpiry('')
    },
    onError: (err) => {
      console.error('OTP verification error', err)
    }
  })

  // ─── Mutation: Online Payment ─────────────────────────────────────────────────
  // POST create_wlcm_payment_for_online
  // Redirects user to the payment gateway URL returned in the response

  const { mutate: createOnlinePayment, isPending: isLoadingOnline } = useMutation({
    mutationKey: ['create_wlcm_payment_for_online'],
    mutationFn: () => apiClient.invokeFunction({
      method: 'create_wlcm_payment_for_online',
      type: 'role',
      data: {
        amount: parseInt(amount) || 0,
        wlcm_link_id: id,
        payment_type: selectedPaymentMethod,   // 'payme' | 'click' | 'uzum'
      }
    }),
    onSuccess: (res) => {
      const redirectUrl = res?.data?.checkout_url
      if (redirectUrl) {
        window.open(redirectUrl, '_blank')
      }
    },
    onError: (err) => {
      console.error('Online payment error', err)
    }
  })

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleCardPay = () => {
    if (!cardNumber || !expiry) return
    createPaymentWithCard()
  }

  const handleOnlinePay = () => {
    createOnlinePayment()
  }

  const handleOtpConfirm = () => {
    if (otp.length !== 6) return
    verifyOtp()
  }

  const handleOtpClose = () => {
    setOtpOpen(false)
    setOtp('')
    setOtpMeta(null)
  }

  const handleSubmit = () => {
    if (selectedPaymentMethod) {
      handleOnlinePay()
    } else {
      handleCardPay()
    }
  }

  if (!mounted) return null

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex items-start justify-center">
      <div className="rounded-2xl px-8 py-10 w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="gap-2 text-center text-4xl tracking-tighter text-brand-orange">
            <span className={`${lobster.className} text-[#db8a53]`}>wlcm</span>
            <span className="px-6 font-sans text-neutral-300">{t('header.to')}</span>
            <Link href={originUrl}>
              <span className="font-sans hover:text-primary text-gray-800">{t('header.uFinance')}</span>
            </Link>
          </h1>
        </div>

        {/* Payment Amount */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-600 mb-3">
            {t('paymentAmount.label')}
          </label>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {t('paymentAmount.currency')}
            </div>
            <input
              type="text"
              value={displayAmount}
              readOnly={isReadOnly}
              onChange={isReadOnly ? undefined : (e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-2xl outline-none text-lg text-gray-900 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
                }`}
              placeholder="0"
            />
          </div>
        </div>
        {/* By Card Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{t('byCard.title')}</h3>
            <span className="text-green-600 font-medium text-sm">{t('byCard.commission')}</span>
          </div>

          <div className="flex flex-col lg:flex-row items-center space-y-3 gap-2 border-2 border-primary rounded-xl p-3">
            <label htmlFor="card_number" className="w-full m-0">
              <span>{t('byCard.cardNumber')}</span>
              <input
                type="text"
                id="card_number"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder={t('byCard.cardPlaceholder')}
                maxLength={19}
                className="w-full px-4 py-3 border m-0 bg-gray-50 border-gray-300 rounded-lg outline-none"
              />
            </label>

            <label htmlFor="expited_date" className='flex flex-col lg:w-fit w-full'>
              <span>{t('byCard.expiry')}</span>
              <input
                type="text"
                id="expited_date"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder={t('byCard.expiryPlaceholder')}
                maxLength={5}
                className="px-4 py-3 w-fit border m-0 bg-gray-50 border-gray-300 rounded-lg outline-none"
              />
            </label>
          </div>

          {/* Card Pay Button */}
        </div>

        {/* Online Payment Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('onlinePayment.title')}</h3>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(prev => prev === method.id ? '' : method.id)}
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
            {locales.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${selectedLanguage === lang.code
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="mb-6">
          <p className="text-xs text-gray-600 text-center">{t('terms.text')}</p>
        </div>

        {/* Online Pay Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoadingOnline}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isLoadingOnline || isLoadingWithCard ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t('payButton.processing')}
            </span>
          ) : (
            <>
              <span>{t('payButton.text', { amount: calculateFinalAmount() })}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* ── OTP Dialog ─────────────────────────────────────────────────────────── */}
      <CustomDialog open={otpOpen} onClose={handleOtpClose}>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              {t('otp.title')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('otp.description')}
            </p>
          </div>

          {/* Shadcn OTP Input */}
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <div className="flex flex-col gap-3 w-full lg:flex-row ">
            <button
              onClick={handleOtpClose}
              className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {t('otp.cancel')}
            </button>
            <button
              onClick={handleOtpConfirm}
              disabled={otp.length !== 6 || isVerifyingOtp}
              className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isVerifyingOtp ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {t('payButton.processing')}
                </>
              ) : (
                t('otp.confirm')
              )}
            </button>
          </div>
        </div>
      </CustomDialog>
    </div>
  )
}

export default Payment