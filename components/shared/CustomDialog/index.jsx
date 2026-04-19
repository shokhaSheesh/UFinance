import { Dialog, DialogContent } from '../../ui/dialog'
const CustomDialog = ({ open, onClose, children, contentClass }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`min-w-fit ${contentClass}`}>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default CustomDialog