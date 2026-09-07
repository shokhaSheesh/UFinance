'use client'
import { cn } from '@/lib/utils'
import { LuCheck, LuMinus } from 'react-icons/lu'
import styles from './operationCheckbox.module.scss'

const OperationCheckbox = ({
  checked = false,
  indeterminate = false,
  onChange,
  className,
  ...props
}) => {
  // Частично выбранное состояние (часть детей отмечена) рисуем минусом
  const isIndeterminate = !checked && indeterminate

  return (
    <label className={cn(styles.checkboxContainer, className)}>
      <input
        type='checkbox'
        className={styles.hiddenInput}
        checked={!!checked} // Ensure boolean value
        onChange={onChange}
        {...props}
      />
      <div className={cn(styles.customCheckbox, isIndeterminate && styles.indeterminate)}>
        {checked && <LuCheck className={styles.checkmark} strokeWidth={2} />}
        {isIndeterminate && <LuMinus className={styles.checkmark} strokeWidth={2} />}
      </div>
      {props.label && <span className={`line-clamp-1 ${styles.label}`}>{props.label}</span>}
    </label>
  )
}

export default OperationCheckbox
