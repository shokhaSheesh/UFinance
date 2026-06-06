import { AlertDialog, AlertDialogContent, AlertDialogOverlay } from "@/components/ui/alert-dialog"
// import { Dialog, DialogContent } from "@/components/ui/dialog"

const CustomDialog = ({ open, onClose, children, contentClass }) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogOverlay className={'bg-slate-950/40'} />
      <AlertDialogContent className={`min-w-fit ${contentClass}`}>
        {children}
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CustomDialog

// const CustomDialog = ({ open, onClose, children, contentClass }) => {
//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogOverlay className={'bg-slate-950/40'} />
//       <DialogContent className={`min-w-fit ${contentClass}`}>
//         {children}
//       </DialogContent>
//     </Dialog>
//   )
// }


// if (!open) return null

// return (
//   <>
//     <div
//       className="fixed inset-0 z-50! h-screen bg-slate-950/40 backdrop-blur-sm transition-opacity"
//       onClick={onClose}
//       style={{ zIndex: '1000 !important' }}
//     />
//     <div style={{ zIndex: 50 }} className="fixed inset-0 z-50! flex items-center justify-center p-4 pointer-events-none">
//       <div
//         className={`relative max-screen overflow-y-auto rounded-xl bg-white shadow-2xl min-w-fit pointer-events-auto ${contentClass}`}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {children}
//       </div>
//     </div>
//   </>
// )