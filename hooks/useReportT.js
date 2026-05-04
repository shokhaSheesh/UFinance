import { languageStore } from '../store/language.store'
import { reportsLocales } from '../locales/reports'

export function useReportT() {
  const lang = languageStore.currentLanguage
  return reportsLocales[lang] || reportsLocales.ru
}
