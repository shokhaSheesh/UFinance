import { cn } from '@/lib/utils'
import { ChevronDown, LogOut } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { authStore } from '../../../store/auth.store'
import styles from './Profile.module.scss'

export const Profile = observer(() => {
  const t = useTranslations('Header.profile')
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    authStore.logout()
    window.location.href = '/auth'
  }

  return (
    <div className={styles.profileContainer} ref={menuRef}>
      <button 
        className={cn(styles.profileButton, isOpen && styles.active)} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.profileInfo}>
          <div className={styles.profileTop}>
            <span className={styles.email}>
              {mounted ? (authStore.userEmail || t('fallbackName')) : t('fallbackName')}
            </span>
            <ChevronDown size={14} className={cn(styles.chevron, isOpen && styles.open)} />
          </div>
          <span className={styles.accessText}>&nbsp;</span>
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.menuGroup}> 
            <button className={cn(styles.menuItem, styles.logoutItem)} onClick={handleLogout}>
              <LogOut size={18} className={styles.menuIcon} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
