import { Dialog, DialogContent, DialogOverlay } from '../../ui/dialog'
const CustomDialog = ({ open, onClose, children, contentClass }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay className={'bg-slate-950/40'} />
      <DialogContent className={`min-w-fit ${contentClass}`}>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default CustomDialog