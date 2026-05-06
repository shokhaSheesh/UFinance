import { Package } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function EmptyState({ title, subtitle, onAdd, buttonLabel }) {
  const t = useTranslations('Deals.detail')

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl h-full min-h-[350px]">
      {/* Icon Wrapper */}
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-neutral-50/50">
        <Package size={32} className="text-gray-400 stroke-[1.5]" />
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-gray-800 mb-1.5">{title}</h2>

      {/* Subtitle */}
      <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">{subtitle}</p>

      {/* Action Button */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="primary-btn"
        >
          {buttonLabel || t('addButton')}
        </button>
      )}
    </div>
  )
}
