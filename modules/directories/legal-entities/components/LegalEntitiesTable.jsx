import LegalEntityMenu from '@/components/directories/LegalEntityMenu/LegalEntityMenu'
import { cn } from '@/lib/utils'
import styles from '../list-page/legal-entities.module.scss'

const LegalEntitiesTable = ({ t, entities, isLoading, searchQuery, onEdit, onDelete }) => (
  <div className="px-5 pt-3 bg-neutral-50">
    <div className={styles.tableOuter}>
      <table className="w-full">
        <thead className="bg-neutral-100 sticky top-16 z-20">
          <tr>
            <th className={cn(styles.th, styles.thIndex)}>{t('tableHeaders.index')}</th>
            <th className={styles.th}>
              <button className={styles.headerButton}>
                {t('tableHeaders.shortName')}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </th>
            <th className={styles.th}>{t('tableHeaders.fullName')}</th>
            <th className={styles.th}>{t('tableHeaders.inn')}</th>
            <th className={styles.th}>{t('tableHeaders.kpp')}</th>
            <th className={cn(styles.th)}></th>
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {isLoading ? (
            <tr>
              <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '2rem' }}>
                {t('loading')}
              </td>
            </tr>
          ) : entities.length === 0 ? (
            <tr>
              <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                {searchQuery ? t('noResults') : t('noData')}
              </td>
            </tr>
          ) : (
            entities.map((entity, index) => (
              <tr key={entity?.id} className={styles.row}>
                <td className={cn(styles.td, styles.tdIndex)}>{index + 1}</td>
                <td className={styles.td}>{entity?.shortName}</td>
                <td className={styles.tdMuted}>{entity?.fullName}</td>
                <td className={styles.tdMuted}>{entity?.inn}</td>
                <td className={styles.tdMuted}>{entity?.kpp}</td>
                <td className={cn(styles.td, styles.tdActions)} onClick={(e) => e.stopPropagation()}>
                  <LegalEntityMenu legalEntity={entity} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)

export default LegalEntitiesTable
