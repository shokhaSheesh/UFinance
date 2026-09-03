'use client'

import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'

/**
 * Значок-подсказка «?» рядом с заголовком или подписью.
 *
 * Настройка «Скрыть подсказки-вопросы» (hide_tooltip_questions
 * из get_general_settings) убирает такие значки по всему интерфейсу —
 * так же, как в ПланФакте, где вместе с ними пропадают «?» у фильтров
 * и заголовков колонок.
 *
 * Компонент — единственная точка, где эти значки рисуются, поэтому
 * новые подсказки нужно добавлять через него, а не через HelpCircle напрямую.
 */
const HintQuestion = observer(({ className, size, ...props }) => {
  if (appStore.interfaceSettings?.hideTooltipQuestions) return null

  return (
    <HelpCircle
      {...props}
      size={size}
      className={cn('text-neutral-400 shrink-0', className)}
    />
  )
})

export default HintQuestion
