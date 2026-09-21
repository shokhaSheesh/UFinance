'use client'

import BackLink from '@/components/shared/BackLink/BackLink'

const RoleDetailHeader = ({ title, roleName, backLabel }) => {
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-2 bg-white p-4">
      <BackLink href="/settings/role" label={backLabel} />
      <h1 className="m-0 text-[18px] font-semibold text-[#1a1a1a]">
        {title} {roleName}
      </h1>
    </div>
  )
}

export default RoleDetailHeader
