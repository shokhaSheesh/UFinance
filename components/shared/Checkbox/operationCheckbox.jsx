'use client'
import { cn } from '@/lib/utils'
import { LuCheck } from 'react-icons/lu'
import styles from './operationCheckbox.module.scss'

const OperationCheckbox = ({ checked = false, onChange, className, ...props }) => {
  return (
    <label className={cn(styles.checkboxContainer, className)}>
      <input
        type='checkbox'
        className={styles.hiddenInput}
        checked={!!checked} // Ensure boolean value
        onChange={onChange}
        {...props}
      />
      <div className={styles.customCheckbox}>
        {checked && <LuCheck className={styles.checkmark} strokeWidth={2} />}
      </div>
      {props.label && <span className={`line-clamp-1 ${styles.label}`}>{props.label}</span>}
    </label>
  )
}

export default OperationCheckbox
