import { getPayment } from '@/lib/api/dashboard'
import Payment from '@/modules/payment'

export async function generateMetadata({
  params,
}) {
  const { id } = await params
  const payment = await getPayment(id)

  return {
    title: `Оплата ${payment?.amount || ''} сум — UFinance`,
    description: `Оплатите ${payment?.amount || ''} сум через QR-код или перейдите по ссылке на платформу UFinance.`,
    openGraph: {
      title: `Оплата ${payment?.amount || ''} сум — UFinance`,
      description: `Отсканируйте QR-код для оплаты или перейдите по ссылке. Быстро и безопасно через платформу UFinance.`,
      images: [
        {
          url: payment?.qrcode,
          width: 1024,
          height: 1024,
          alt: `QR-код для оплаты ${payment?.amount || ''} сум`,
        },
      ],
      type: "website",
    },
  }
}

const PaymentPage = async ({
  params,
}) => {
  const { id } = await params
  const payment = await getPayment(id)
  return <Payment payment={payment} />
}

export default PaymentPage