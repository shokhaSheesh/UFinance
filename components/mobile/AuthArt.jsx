'use client'

import { useId } from 'react'

/**
 * Иллюстрация экрана входа — в том же стиле, что и пустые экраны (EmptyArt):
 * мягкие серо-голубые грани и фирменный синий. Карточка с растущими
 * столбиками и линией тренда, перед ней — синяя монета со стрелкой вверх.
 */
export default function AuthArt({ size = 260, className }) {
  const id = useId().replace(/:/g, '')
  const g = (name) => `${name}-${id}`

  // столбики графика: последние два — синие, остальные светлые
  const bars = [
    { x: 92, h: 26 },
    { x: 110, h: 38 },
    { x: 128, h: 30 },
    { x: 146, h: 50 },
    { x: 164, h: 62 },
    { x: 182, h: 78 },
  ]

  return (
    <svg
      width={size}
      height={size * (220 / 280)}
      viewBox="0 0 280 220"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id={g('glow')} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(140 110) scale(104)">
          <stop stopColor="#e3eeff" />
          <stop offset="1" stopColor="#e3eeff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('card')} x1="140" y1="36" x2="140" y2="188" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f2f6fd" />
        </linearGradient>
        <linearGradient id={g('back')} x1="150" y1="40" x2="150" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e6eefb" />
          <stop offset="1" stopColor="#d3dff2" />
        </linearGradient>
        <linearGradient id={g('bar')} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#5d9dff" />
          <stop offset="1" stopColor="#0e73f6" />
        </linearGradient>
        <linearGradient id={g('coin')} x1="196" y1="128" x2="236" y2="176" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6aa6ff" />
          <stop offset="1" stopColor="#0e63e0" />
        </linearGradient>
        <radialGradient id={g('shadow')} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(146 204) scale(84 8)">
          <stop stopColor="#0f172a" stopOpacity=".13" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="140" cy="110" r="104" fill={`url(#${g('glow')})`} />
      <ellipse cx="146" cy="204" rx="84" ry="8" fill={`url(#${g('shadow')})`} />

      {/* задняя карточка — стопка документов */}
      <rect x="92" y="40" width="128" height="150" rx="18" fill={`url(#${g('back')})`} transform="rotate(8 156 115)" />

      {/* основная карточка с графиком */}
      <g transform="rotate(-5 140 112)">
        <rect x="76" y="36" width="132" height="152" rx="18" fill={`url(#${g('card')})`} stroke="#dbe6f7" strokeWidth="1.2" />
        <circle cx="96" cy="58" r="8" fill="#dbe6f7" />
        <rect x="110" y="52" width="44" height="5" rx="2.5" fill="#d3e0f5" />
        <rect x="110" y="61" width="28" height="4.5" rx="2.25" fill="#e4ecf8" />
        <rect x="88" y="80" width="70" height="10" rx="5" fill="#c9d9f3" />

        {bars.map((bar, index) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={172 - bar.h}
            width="12"
            height={bar.h}
            rx="4"
            fill={index >= bars.length - 2 ? `url(#${g('bar')})` : '#dbe6f7'}
          />
        ))}
        <path d="M98 136 L116 124 L134 130 L152 110 L170 98 L188 82" stroke="#0e73f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="188" cy="82" r="4.5" fill="#fff" stroke="#0e73f6" strokeWidth="2.4" />
      </g>

      {/* монета со стрелкой вверх */}
      <circle cx="216" cy="152" r="27" fill={`url(#${g('coin')})`} />
      <circle cx="216" cy="152" r="20.5" stroke="#ffffff" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M216 163 V142 M207.5 150 L216 141.5 L224.5 150" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* искры и точки */}
      <path d="M58 46 C59 53 61.5 55.5 69 56.5 C61.5 57.5 59 60 58 67 C57 60 54.5 57.5 47 56.5 C54.5 55.5 57 53 58 46 Z" fill={`url(#${g('bar')})`} />
      <path d="M236 70 C236.6 74 238 75.4 242 76 C238 76.6 236.6 78 236 82 C235.4 78 234 76.6 230 76 C234 75.4 235.4 74 236 70 Z" fill="#8fbaff" />
      <circle cx="52" cy="150" r="3.6" fill="#bcd3f7" />
      <circle cx="66" cy="172" r="2" fill="#d4e2f7" />
      <circle cx="232" cy="40" r="2.4" fill="#d4e2f7" />
    </svg>
  )
}
