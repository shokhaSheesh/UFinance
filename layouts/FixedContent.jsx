
import { cn } from '@/lib/utils'

const FixedContent = ({ children, className }) => {
  return (
    <div className={cn('fixed left-[var(--sidebar-w)] top-[60px] w-[calc(100%_-_var(--sidebar-w))] flex h-[calc(100%-60px)]', className)}>{children}</div>
  )
}

export default FixedContent