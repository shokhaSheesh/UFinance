import { cn } from '@/app/lib/utils';
import { X } from 'lucide-react';
import useMounted from '../../../hooks/useMounted';

const CustomModal = ({ isOpen, onClose, children, className }) => {
  const mounted = useMounted()

  if (!mounted || !isOpen) return null;

  return (
    <div style={{ zIndex: 10000 }} className="fixed left-0 top-0 w-full h-full blur-out-lg z-100! flex items-center justify-center bg-black/20 backdrop-blur-xs" onClick={onClose}>
      <div className={cn('bg-white p-5 rounded-lg z-50! relative', className)} onClick={(e) => e.stopPropagation()}>
        {children}
        <button className="absolute top-4! right-4! z-10000 cursor-pointer" onClick={onClose}>
          <X size={24} color="#98A2B3" />
        </button>
      </div>
    </div>
  );
};

export default CustomModal;