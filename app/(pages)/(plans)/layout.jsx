
const PlansLayout = ({ children }) => {
  return (
    <div className="fixed bg-white overflow-y-auto left-[80px] top-[60px] w-[calc(100%-80px)] h-[calc(100%-60px)] gap-4">
      {children}
    </div>
  )
}

export default PlansLayout