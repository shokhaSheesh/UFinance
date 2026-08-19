import LocaleSwitcher from '@/components/shared/LocaleSwitcher/LocaleSwitcher'
import { AuthLogo } from '@/constants/icons'
import { getTranslations } from 'next-intl/server'

// Почта поддержки для запросов на удаление аккаунта
const SUPPORT_EMAIL = 'udevs4help@gmail.com'

export async function generateMetadata() {
  const t = await getTranslations('DeleteAccount')
  return { title: `${t('title')} — UFinance` }
}

export default async function DeleteAccountPage() {
  const t = await getTranslations('DeleteAccount')

  return (
    <div className="fixed flex flex-col w-full h-full bg-linear-to-br from-[#456fad] to-[#022565] items-center justify-center">
      <div className="absolute top-10 left-10">
        <AuthLogo color="#ffffff" width="114" height="27" />
      </div>
      <div className="absolute top-10 right-10">
        <LocaleSwitcher />
      </div>

      <div className="w-[500px] max-w-[calc(100vw-2rem)] p-6">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-center">
            <AuthLogo color="#000000" width="150" height="36" />
          </div>

          <h1 className="text-2xl font-bold text-black mb-3">{t('title')}</h1>

          <p className="text-[15px] leading-relaxed text-neutral-600">
            {t('description')}
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 flex items-center justify-center rounded-xl border border-gray-ucode-200 bg-gray-ucode-25 px-4 py-3 text-base font-semibold text-primary transition-colors hover:bg-gray-100"
          >
            {SUPPORT_EMAIL}
          </a>

          <p className="mt-4 text-[13px] leading-relaxed text-neutral-400">
            {t('note')}
          </p>
        </div>
      </div>
    </div>
  )
}
