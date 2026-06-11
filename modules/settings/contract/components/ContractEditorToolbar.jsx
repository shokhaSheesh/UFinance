'use client'

export const ToolBtn = ({ onClick, title, children, active }) => {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e?.preventDefault()
        onClick?.()
      }}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${active ? 'bg-gray-200 text-[#0E73F6]' : 'text-slate-600'}`}
    >
      {children}
    </button>
  )
}

export const Separator = () => {
  return <span className="mx-0.5 h-5 w-px bg-gray-300 self-center" />
}
