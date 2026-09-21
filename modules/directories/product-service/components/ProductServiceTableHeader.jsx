import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { cn } from '@/lib/utils'

const ProductServiceTableHeader = ({
  t, filters,
  isAllExpanded, toggleExpandAll
}) => (
  <thead className="sticky top-16">
    <tr className={cn('bg-neutral-100 text-neutral-500 font-normal py-4 text-xs w-full border-b border-gray-300')}>
      <th className='p-2 text-start'>
        <div className="flex items-center gap-2">
          {filters?.group === 'group' && (
            <button onClick={toggleExpandAll} className="p-1 hover:bg-neutral-200 rounded cursor-pointer">
              {isAllExpanded ? <ExpendClose /> : <ExpendOpen />}
            </button>
          )}
          <span>{t('tableHeaders.name')}</span>
        </div>
      </th>
      <th className='p-2 text-start'>{t('tableHeaders.type')}</th>
      <th className='p-2 text-start'>{t('tableHeaders.article')}</th>
      <th className='p-2 text-end'>{t('tableHeaders.price')}</th>
      <th className='p-2 text-center'>{t('tableHeaders.unit')}</th>
      <th className='p-2 text-center'>{t('tableHeaders.vat')}</th>
      <th className='p-2 text-end'>{t('tableHeaders.priceWithVat')}</th>
      <th className='p-2 text-start'>{t('tableHeaders.comment')}</th>
      <th className='p-2 w-px'>&nbsp;</th>
    </tr>
  </thead>
)

export default ProductServiceTableHeader
