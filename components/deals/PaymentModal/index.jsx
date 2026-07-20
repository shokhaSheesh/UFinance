'use client'
import CustomDialog from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import { apiClient } from '@/lib/api/ucode/base'
import { useMutation } from '@tanstack/react-query'
import { CheckCheck, CircleQuestionMark, Copy, Mail, Send, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

const PaymentModal = ({ open, onClose, dealId }) => {
  const t = useTranslations('Deals.detail.payment')
  const [amount, setAmount] = useState('')
  const [link, setLink] = useState('')
  const [linkId, setLinkId] = useState('')
  const [copied, setCopied] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const emailSentTimerRef = useRef(null)
  const copiedTimerRef = useRef(null)

  useEffect(() => () => {
    clearTimeout(emailSentTimerRef.current)
    clearTimeout(copiedTimerRef.current)
  }, [])

  let linkHead = ''
  if (typeof window !== 'undefined') {
    linkHead = `${window.location.origin}`
  }

  const { mutate: createWLCMLink, isPending } = useMutation({
    mutationKey: ['create-wlcm-link'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'create_wlcm_link', data, type: 'role' }),
    onSuccess: (response) => {
      if (response?.data?.guid) {
        const paymentLink = `${linkHead}/payment/${response.data.guid}`
        setLink(paymentLink)
        setLinkId(response.data.guid)
        showSuccessNotification('WLCM link created successfully!')
      }
    },
    onError: (error) => {
      console.error('Error creating WLCM link:', error)
    },
  })

  const { mutate: sendToEmail, isPending: isSendingEmail } = useMutation({
    mutationKey: ['send-wlcm-link-email'],
    mutationFn: () =>
      apiClient.invokeFunction({
        method: 'send_wlcm_link_to_email',
        type: "role",
        data: {
          email,
          wlcm_link_id: linkId,
        },
      }),
    onSuccess: () => {
      setEmailSent(true)
      setShowEmailInput(false)
      setEmail('')
      clearTimeout(emailSentTimerRef.current)
      emailSentTimerRef.current = setTimeout(() => setEmailSent(false), 3000)
    },
    onError: (error) => {
      console.error('Error sending email:', error)
    },
  })

  const handleSubmit = () => {
    createWLCMLink({
      amount: parseFloat(amount) || 0,
      sales_transactions_id: dealId,
      path: `${linkHead}/payment/`,
      branch_id: 'd597e800-2643-4446-8d69-5b35bd6b208b',
    })
  }

  const handleCopy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleReset = () => {
    setAmount('')
    setLink('')
    setLinkId('')
    setShowEmailInput(false)
    setEmail('')
    setEmailSent(false)
  }

  const handleSendEmail = () => {
    if (!email.trim()) return
    sendToEmail()
  }

  return (
    <CustomDialog open={open} onClose={onClose}>
      <div className="bg-white rounded-lg p-3 w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t('createPayment')}</h2>
        </div>

        <div className="space-y-4">
          {/* Amount input */}
          <div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('enterAmount')}
              className="w-full"
              min="0"
              step="0.01"
            />
            <div className="flex items-start gap-2 mt-2">
              <CircleQuestionMark color="#4a5565" size={20} />
              <p className="text-sm text-gray-600">{t('payment_rule')}</p>
            </div>
          </div>

          {/* Link section */}
          {link && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('paymentLink')}
              </label>

              {/* Link actions row */}
              <div className="space-y-2">
                {/* Copy button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 justify-center cursor-pointer flex-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCheck size={16} />
                        <span className="text-sm">{t('copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span className="text-sm">{t('copy')}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="primary-btn flex-1 cursor-pointer justify-center py-2!"
                  >
                    {t('change_price')}
                  </button>
                </div>
                <button
                  onClick={() => setShowEmailInput((prev) => !prev)}
                  className={`px-3 py-2 rounded-md flex cursor-pointer items-center w-full justify-center gap-2 text-sm transition-colors ${showEmailInput
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                >
                  {showEmailInput ? <X size={16} /> : <Mail size={16} />}
                  <span>{showEmailInput ? t('cancel') : t('sendToEmail')}</span>
                </button>
              </div>

              {/* Email sent success message */}
              {emailSent && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('emailSentSuccess')}
                </div>
              )}

              {/* Email input panel */}
              {showEmailInput && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
                  <p className="text-sm font-medium text-gray-700">{t('enterEmail')}</p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                    />
                    <button
                      onClick={handleSendEmail}
                      disabled={!email.trim() || isSendingEmail}
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <Send size={16} />
                      <span className="text-sm">
                        {isSendingEmail ? t('sending') : t('send')}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!link && (
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-4 py-2 bg-blue-500 cursor-pointer text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? t('creating') : t('createLink')}
            </button>
          </div>
        )}
      </div>
    </CustomDialog>
  )
}

export default PaymentModal