// components/OperationsHeader.jsx
import Input from '@/components/shared/Input'
import { Loader2, Search } from 'lucide-react'

/**
 * Sticky page header: title, create button, search, import, export.
 */
export default function OperationsHeader({
  t,
  isMounted,
  canAdd,
  isImporting,
  isExporting,
  searchQuery,
  onSearch,
  onCreate,
  onImport,
  onExport,
}) {
  return (
    <div className="h-16 px-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{t('page.title')}</h1>
        {isMounted && canAdd && (
          <button onClick={onCreate} className="primary-btn">
            {t('page.create')}
          </button>
        )}
      </div>

      <div className="flex items-center justify-self-center gap-2">
        <Input
          type="text"
          leftIcon={<Search size={20} />}
          placeholder={t('page.searchPlaceholder')}
          value={searchQuery}
          className="w-[300px]"
          onChange={onSearch}
        />
        <button
          onClick={onImport}
          type="button"
          disabled={isImporting}
          className="primary-btn"
        >
          {t('page.import')}
          {isImporting && <Loader2 size={16} className="animate-spin ml-1" />}
        </button>
        <button onClick={onExport} type="button" className="primary-btn">
          {t('page.export')}
          {isExporting && <Loader2 size={16} className="animate-spin ml-1" />}
        </button>
      </div>
    </div>
  )
}