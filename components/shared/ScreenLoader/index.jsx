import { Loader2 } from 'lucide-react'

const ScreenLoader = ({ className, open }) => {
  return (
    <div style={{ zIndex: 1000000 }} className={`fixed bottom-0 z-1000 left-0 top-0 right-0 h-full bg-white/70   flex items-center justify-center pointer-events-none ${className}`} >
      <Loader2 className='animate-spin text-blue-500' size={60} />
    </div>
  )
}

export default ScreenLoader