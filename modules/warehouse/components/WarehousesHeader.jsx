import Input from '@/components/shared/Input'
import { ArrowLeftRight, Plus, Search } from 'lucide-react'

const WarehousesHeader = ({
  t,
  canAdd = true,
  onCreateClick,
  onOpenTransfers,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 shrink-0 px-6 py-4 bg-white">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-neutral-800">{t('pageTitle')}</h1>
        {canAdd && (
          <button onClick={onCreateClick} className="primary-btn flex items-center gap-1.5">
            <Plus size={16} />
            {t('createButton')}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenTransfers}
          className="primary-btn flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeftRight size={16} />
          {t('transfer.button')}
        </button>
        <div className="w-72">
          <Input
            type="text"
            placeholder={t('searchWarehousesPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </div>
    </div>
  )
}

export default WarehousesHeader
