import Input from '@/components/shared/Input'
import { Search } from 'lucide-react'

const WarehouseHeader = ({ t, searchQuery, setSearchQuery }) => {
  return (
    <div className="flex items-center justify-between gap-4 shrink-0 px-6 py-4 bg-white">
      <h1 className="text-xl font-bold text-neutral-800">{t('pageTitle')}</h1>
      <div className="w-72">
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>
    </div>
  )
}

export default WarehouseHeader
