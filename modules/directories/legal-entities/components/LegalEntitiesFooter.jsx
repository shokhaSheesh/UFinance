import styles from '../list-page/legal-entities.module.scss'

const LegalEntitiesFooter = ({ t, isLoading, count }) => (
  <div className={styles.footer}>
    <div className={styles.footerText}>
      <span className={styles.footerCount}>
        {isLoading ? t('loading') : t('entityCount', { count })}
      </span>
    </div>
  </div>
)

export default LegalEntitiesFooter
