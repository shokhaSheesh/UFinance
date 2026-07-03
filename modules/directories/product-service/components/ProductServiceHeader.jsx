import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const ProductServiceHeader = ({
  t, tc, canAdd,
  isMenuOpen, setIsMenuOpen,
  onCreateSingle, onCreateGroup,
  filters, setFilters,
  searchQuery, setSearchQuery
}) => {
  const menuRef = useRef(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="flex items-center sticky top-0 bg-white z-10 p-3 justify-between">
      <div className="flex items-center gap-3">
        <h1 className="h1 text-xl text-neutral-700 font-semibold">{t('pageTitle')}</h1>
        {isMounted && canAdd && (
          <div ref={menuRef} className="flex items-center z-20 gap-2 relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="primary-btn flex items-center gap-2">
              {tc('create')}
              {isMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isMenuOpen && (
              <div style={{ zIndex: 999999 }} className="absolute top-full w-32 p-2 flex flex-col justify-start items-start left-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                <button className="text-neutral-700 font-normal hover:bg-neutral-100 w-full text-start text-sm p-1 cursor-pointer" onClick={onCreateSingle}>
                  {tc('create')}
                </button>
                <button className="text-neutral-700 font-normal hover:bg-neutral-100 w-full text-start text-sm p-1 cursor-pointer" onClick={onCreateGroup}>
                  {t('createGroupTitle')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-32 h-10">
          <SingleSelect
            data={[
              { value: 'all', label: t('types.all') },
              { value: 'product', label: t('types.products') },
              { value: 'service', label: t('types.services') }
            ]}
            value={filters.type}
            withSearch={false}
            isClearable={false}
            onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            className={'bg-white'}
          />
        </div>
        <div className="w-44 h-10">
          <SingleSelect
            data={[
              { value: 'none', label: t('grouping.none') },
              { value: 'group', label: t('grouping.group') }
            ]}
            value={filters.group}
            withSearch={false}
            isClearable={false}
            onChange={(value) => setFilters(prev => ({ ...prev, group: value }))}
            className={'bg-white'}
          />
        </div>
        <div className="w-64 h-10">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
            className={'bg-white h-[34px]'}
          />
        </div>
      </div>
    </div>
  )
}

export default ProductServiceHeader
