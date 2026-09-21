'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

/**
 * «← Раздел» над заголовком детальной страницы — одинаковая на всех карточках
 * (сделка, закупка, проект, склад, контрагент, бюджет, роль, филиал).
 * Раньше где-то стояли мелкие хлебные крошки, а где-то пути назад не было вовсе.
 */
export default function BackLink({ href, label, className }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-slate-500 transition-colors hover:text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]',
        className
      )}
    >
      <ArrowLeft size={15} aria-hidden="true" />
      {label}
    </Link>
  )
}
