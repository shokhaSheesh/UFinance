'use client'
import CustomDialog from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import { usePathname } from '@/i18n/navigation'
import { apiClient } from '@/lib/api/ucode/base'
import { useMutation } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

const PaymentModal = ({ open, onClose, dealId }) => {
  const t = useTranslations('Deals.detail.payment')
  const pathName = usePathname()
  const [amount, setAmount] = useState('')
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  let linkHead = ''

  if (typeof window !== 'undefined') {
    linkHead = `${window.location.origin}`
  }

  const { mutate: createWLCMLink, isPending } = useMutation({
    mutationKey: ['create-wlcm-link'],
    mutationFn: (data) => apiClient.invokeFunction({ method: "create_wlcm_link", data, type: 'role' }),
    onSuccess: (response) => {
      if (response?.data?.guid) {
        const paymentLink = `${linkHead}/payment/${response.data.guid}`
        setLink(paymentLink)
        showSuccessNotification('WLCM link created successfully!')
      }
    },
    onError: (error) => {
      console.error('Error creating WLCM link:', error)
    }
  })

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return

    createWLCMLink({
      amount: parseFloat(amount),
      sales_transactions_id: dealId,
      path: `${linkHead}/payment/`,
      branch_id: 'd597e800-2643-4446-8d69-5b35bd6b208b'
    })
  }

  const handleCopy = async () => {
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }


  return (
    <CustomDialog open={open} onClose={onClose}>
      <div className="bg-white rounded-lg p-3 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t('createPayment')}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('paymentAmount')}
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('enterAmount')}
              className="w-full"
              min="0"
              step="0.01"
            />
          </div>

          {link && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('paymentLink')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L4 17l-1.293 1.293a1 1 0 01-1.414 1.414L8.586 20.414a2 2 0 01-2.828 0L7 16a2 2 0 01-2.828 0L4 12a2 2 0 01-2.828 0z" />
                      </svg>
                      <span className="text-sm">{t('copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span className="text-sm">{t('copy')}</span>
                    </>
                  )}
                </button>
                <button onClick={() => {
                  setAmount('')
                  setLink('')
                }} className='primary-btn'>
                  {t('change_price')}
                </button>
              </div>
            </div>
          )}
        </div>

        {!link && <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !amount || parseFloat(amount) <= 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? t('creating') : t('createLink')}
          </button>
        </div>}
      </div>
    </CustomDialog>
  )
}

export default PaymentModal
