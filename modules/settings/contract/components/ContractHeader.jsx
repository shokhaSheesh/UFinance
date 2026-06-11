'use client'

const ContractHeader = ({ title, subtitle }) => {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}

export default ContractHeader
