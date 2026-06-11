'use client'

const RoleDetailHeader = ({ title, roleName }) => {
  return (
    <h1 className="text-[18px] p-4 font-semibold text-[#1a1a1a] m-0 sticky top-0 z-10 bg-white">
      {title} {roleName}
    </h1>
  )
}

export default RoleDetailHeader
