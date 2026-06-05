const CustomDialog = ({ open, onClose, children, contentClass }) => {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-1000! bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-1000! flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`relative max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl min-w-fit pointer-events-auto ${contentClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  )
}

export default CustomDialog