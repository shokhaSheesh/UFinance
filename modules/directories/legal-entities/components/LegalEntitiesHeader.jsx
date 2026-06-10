import Input from '@/components/shared/Input'
import { Search } from 'lucide-react'
import styles from '../list-page/legal-entities.module.scss'

const LegalEntitiesHeader = ({ t, tc, canAdd, onCreateClick, searchQuery, setSearchQuery }) => (
  <div className="px-5 h-16 flex items-center bg-neutral-50 sticky top-0 z-10">
    <div className={styles.headerInner}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{t('pageTitle')}</h1>
        {canAdd && (
          <button onClick={onCreateClick} className={styles.createButton}>
            {tc('create')}
          </button>
        )}
      </div>
      <div className={styles.searchContainer}>
        <Input
          leftIcon={<Search size={20} />}
          placeholder={t('searchPlaceholder')}
          className={""}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  </div>
)

export default LegalEntitiesHeader
