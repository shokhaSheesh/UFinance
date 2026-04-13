import { cn } from '@/app/lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import useMounted from '../../../hooks/useMounted';

const CustomModal = ({ isOpen, onClose, children, className }) => {
  const mounted = useMounted()

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div style={{ zIndex: 10000 }} className="fixed inset-0 blur-out-lg z-10000 flex items-center justify-center bg-black/20 backdrop-blur-xs" onClick={onClose}>
      <div className={cn('bg-white p-5 rounded-lg relative', className)} onClick={(e) => e.stopPropagation()}>
        {children}
        <button className="absolute top-4! right-4! z-10000 cursor-pointer" onClick={onClose}>
          <X size={24} color="#98A2B3" />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default CustomModal;