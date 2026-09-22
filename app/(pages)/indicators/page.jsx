'use client'

import Debts from '@/components/Indicators/Debts'
import CashRunway from '@/components/Indicators/CashRunway'
import DealsByStatus from '@/components/Indicators/DealsByStatus'
import MarginTrend from '@/components/Indicators/MarginTrend'
import Students from '@/components/Indicators/Students'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import AccountBalance from '../../../components/Indicators/AccountBalance'
import CashFlow from '../../../components/Indicators/CashFlow'
import IndicatorsNavbar, { IndicatorsSectionNav } from '../../../components/Indicators/Header'
import PaymentStructure from '../../../components/Indicators/PaymentStructure'
import Profit from '../../../components/Indicators/Profit'
import ProfitableClients from '../../../components/Indicators/ProfitableClients'

/**
 * Показатели — длинная страница из десяти графиков. Каждый график теперь в
 * одинаковой карточке с рамкой (раньше: где белый блок, где просто текст на
 * сером фоне, заголовки разного размера), а сверху — строка разделов:
 * к нужному графику можно перейти одним кликом, текущий подсвечен.
 */
const Section = ({ id, padded = false, children }) => (
  <section
    id={id}
    data-indicator-section
    // дочерний блок тоже скругляем: без overflow-hidden (он резал бы подсказки графиков)
    className={cn('rounded-xl border border-slate-200 bg-white [&>*]:rounded-xl', padded && 'p-6')}
  >
    {children}
  </section>
)

const IndicatorsPage = () => {
  const t = useTranslations('Indicators')
  const scrollRef = useRef(null)
  const [activeSection, setActiveSection] = useState(null)
  const isSchool = appStore.isDonoSchool

  const sections = [
    appStore.isDonoSchool && { id: 'students', label: t('students.title') },
    { id: 'profit', label: t('profit.title') },
    { id: 'margin', label: t('margin.title') },
    { id: 'cash-flow', label: t('cashFlow.title') },
    { id: 'cash-runway', label: t('cashRunway.title') },
    { id: 'account-balance', label: t('accountBalance.title') },
    { id: 'payment-structure', label: t('paymentStructure.title') },
    { id: 'profitable-clients', label: t('profitableClients.title') },
    { id: 'deals-by-status', label: t('dealsByStatus.title') },
    { id: 'debts', label: t('debts.title') },
  ].filter(Boolean)

  // Подсвечиваем раздел, который сейчас в верхней части экрана
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { root, rootMargin: '-35% 0px -55% 0px' }
    )
    root.querySelectorAll('[data-indicator-section]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isSchool])

  const jumpTo = useCallback((id) => {
    const root = scrollRef.current
    const target = root?.querySelector(`#${id}`)
    const header = root?.querySelector('#indicator_sticky')
    if (!root || !target) return
    const offset = (header?.offsetHeight || 0) + 16
    const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - offset
    root.scrollTo({ top, behavior: 'smooth' })
    setActiveSection(id)
  }, [])

  return (
    <div
      ref={scrollRef}
      className='fixed left-[var(--sidebar-w)] bg-canvas w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))] top-[60px] h-[calc(100%-60px)] overflow-y-auto overflow-x-visible'
    >
      {/* Фильтры прокручиваются вместе со страницей, строка разделов — прилипает */}
      <IndicatorsNavbar />
      <div id="indicator_sticky" className='sticky top-0 z-[1000] w-full'>
        <IndicatorsSectionNav sections={sections} activeSection={activeSection} onJump={jumpTo} />
      </div>
      <div className="relative flex flex-col gap-4 p-6">
        {appStore.isDonoSchool && (
          <Section id="students"><Students /></Section>
        )}
        <Section id="profit"><Profit /></Section>
        {/* Новые блоки стоят рядом с теми, чьи данные дополняют */}
        <Section id="margin"><MarginTrend /></Section>
        <Section id="cash-flow"><CashFlow /></Section>
        <Section id="cash-runway"><CashRunway /></Section>
        <Section id="account-balance"><AccountBalance /></Section>
        <Section id="payment-structure" padded><PaymentStructure /></Section>
        <Section id="profitable-clients" padded><ProfitableClients /></Section>
        <Section id="deals-by-status"><DealsByStatus /></Section>
        <Section id="debts"><Debts /></Section>
      </div>
    </div>
  )
}

export default observer(IndicatorsPage)
