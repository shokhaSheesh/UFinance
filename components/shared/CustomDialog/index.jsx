// import { Dialog, DialogContent } from "@/components/ui/dialog"

// `elevated` поднимает окно над уже открытым диалогом: иначе затемнение вложенного
// окна оказывается под контентом родительского и фон не притемняется.
const CustomDialog = ({
  open,
  onClose,
  children,
  contentClass,
  overlayClass = "",
  elevated = false,
}) => {
  if (!open) return null;

  const overlayZ = elevated ? "z-[1200]!" : "z-60!";
  const contentZ = elevated ? "z-[1300]!" : "z-100!";

  return (
    <>
      <div
        className={`fixed inset-0 ${overlayZ} h-screen bg-slate-950/40 backdrop-blur-sm transition-opacity ${overlayClass}`}
        onClick={onClose}
        style={{ zIndex: "1000 !important" }}
      />
      <div
        style={{ zIndex: 50 }}
        className={`fixed inset-0 ${contentZ} flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className={`relative max-screen overflow-y-auto rounded-xl bg-white shadow-2xl  pointer-events-auto ${contentClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default CustomDialog;

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
