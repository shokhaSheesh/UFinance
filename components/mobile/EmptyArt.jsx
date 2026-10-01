'use client'

import { useId } from 'react'

/**
 * Иллюстрация пустого экрана — одна на всё приложение.
 *
 * Открытая коробка с мягкими объёмными гранями, над ней парит пустая
 * карточка, рядом — синяя искра. Сюжет общий: «здесь пока ничего нет» —
 * подходит и к ленте операций, и к уведомлениям, и к справочникам, поэтому
 * экраны не рисуют свои значки. Цвета — серые грани и фирменный синий,
 * как в остальном приложении.
 */
export default function EmptyArt({ size = 132, className }) {
  // свои id градиентов у каждой копии: на одном экране их может быть несколько
  const id = useId().replace(/:/g, '')
  const g = (name) => `${name}-${id}`

  return (
    <svg
      width={size}
      height={size * 0.82}
      viewBox="0 0 160 132"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={g('front')} x1="80" y1="70" x2="80" y2="118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={g('side')} x1="120" y1="70" x2="140" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8edf4" />
          <stop offset="1" stopColor="#cfd8e4" />
        </linearGradient>
        <linearGradient id={g('inner')} x1="80" y1="58" x2="80" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#dde4ee" />
        </linearGradient>
        <linearGradient id={g('flap')} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9eef5" />
        </linearGradient>
        <linearGradient id={g('card')} x1="80" y1="18" x2="80" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef4ff" />
        </linearGradient>
        <radialGradient id={g('spark')} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(126 26) rotate(90) scale(14)">
          <stop stopColor="#5d9dff" />
          <stop offset="1" stopColor="#0e73f6" />
        </radialGradient>
        <radialGradient id={g('shadow')} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 121) scale(56 7)">
          <stop stopColor="#0f172a" stopOpacity=".14" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* мягкая тень под коробкой */}
      <ellipse cx="80" cy="121" rx="56" ry="7" fill={`url(#${g('shadow')})`} />

      {/* откинутые назад клапаны — коробка открыта */}
      <path d="M36 66 L80 54 L68 36 Q66.8 34.2 64.6 34.8 L27.6 45 Q24.6 45.8 25.8 48.6 Z" fill={`url(#${g('flap')})`} stroke="#e2e8f0" strokeWidth="1" />
      <path d="M124 66 L80 54 L92 36 Q93.2 34.2 95.4 34.8 L132.4 45 Q135.4 45.8 134.2 48.6 Z" fill={`url(#${g('flap')})`} stroke="#e2e8f0" strokeWidth="1" />

      {/* внутренняя стенка открытой коробки */}
      <path d="M36 66 L80 54 L124 66 L80 78 Z" fill={`url(#${g('inner')})`} />

      {/* пустая карточка, которая «вылетела» из коробки */}
      <g transform="rotate(-8 80 42)">
        <rect x="58" y="18" width="44" height="50" rx="9" fill={`url(#${g('card')})`} stroke="#d7e3f6" strokeWidth="1.2" />
        <rect x="66" y="29" width="22" height="4.5" rx="2.25" fill="#c9d9f3" />
        <rect x="66" y="38" width="28" height="4.5" rx="2.25" fill="#dbe6f7" />
        <rect x="66" y="47" width="17" height="4.5" rx="2.25" fill="#dbe6f7" />
      </g>

      {/* передняя и боковая грани */}
      <path d="M36 66 L80 78 L80 116 Q80 118 78 117.4 L38.6 106.6 Q36 105.9 36 103.2 Z" fill={`url(#${g('front')})`} />
      <path d="M80 78 L124 66 L124 103.2 Q124 105.9 121.4 106.6 L82 117.4 Q80 118 80 116 Z" fill={`url(#${g('side')})`} />

      {/* синяя искра и пара точек — живость без лишнего цвета */}
      <path
        d="M126 14 C127 21.5 129.5 24.5 137 25.5 C129.5 26.5 127 29.5 126 37 C125 29.5 122.5 26.5 115 25.5 C122.5 24.5 125 21.5 126 14 Z"
        fill={`url(#${g('spark')})`}
      />
      <circle cx="34" cy="38" r="3.2" fill="#bcd3f7" />
      <circle cx="44" cy="24" r="1.8" fill="#d4e2f7" />
      <circle cx="140" cy="48" r="2.2" fill="#d4e2f7" />
    </svg>
  )
}
