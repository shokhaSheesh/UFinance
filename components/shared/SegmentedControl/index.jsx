import { cn } from '@/lib/utils'
import styles from './style.module.scss'

/**
 * Reusable segmented control component matching the design.
 * @param {Array} options - Array of { value, label } objects
 * @param {string} value - Selected value
 * @param {function} onChange - Callback with selected value
 */
const SegmentedControl = ({ options = [], value, onChange, className }) => {
  return (
    <div className={cn(styles.container, className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            styles.button,
            value === opt.value ? styles.active : styles.inactive
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default SegmentedControl
