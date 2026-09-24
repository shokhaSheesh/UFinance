import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { Plus } from 'lucide-react'

/**
 * Шапка справочника юрлиц: заголовок с количеством и создание.
 * Поиск переехал в панель над таблицей, количество — сюда из подвала.
 */
const LegalEntitiesHeader = ({ t, tc, canAdd, count, onCreateClick }) => (
  <PageHeader
    className="px-0"
    title={t('pageTitle')}
    search={count != null && <span className="text-sm tabular-nums text-slate-500">{t('entityCount', { count })}</span>}
    actions={
      canAdd && (
        <button onClick={onCreateClick} className="primary-btn gap-1.5">
          <Plus size={16} />
          {tc('create')}
        </button>
      )
    }
  />
)

export default LegalEntitiesHeader
