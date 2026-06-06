
import { cn } from '@/lib/utils'

const FixedContent = ({ children, className }) => {
  return (
    <div className={cn('fixed left-[80px] top-[60px] w-[calc(100%-80px)] flex h-[calc(100%-60px)]', className)}>{children}</div>
  )
}

export default FixedContent