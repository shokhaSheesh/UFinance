
const PlansLayout = ({ children }) => {
  return (
    <div className="fixed bg-white overflow-y-auto left-[var(--sidebar-w)] top-[60px] w-[calc(100%_-_var(--sidebar-w))] h-[calc(100%-60px)] gap-4">
      {children}
    </div>
  )
}

export default PlansLayout