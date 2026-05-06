import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export const LOCALE_COOKIE = 'NEXT_LOCALE'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = routing.locales.includes(cookieLocale)
    ? cookieLocale
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
