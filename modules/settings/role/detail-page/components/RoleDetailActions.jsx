'use client'

import { Loader } from 'lucide-react'

const RoleDetailActions = ({ onCancel, isUpdating, tc }) => {
  return (
    <div className="flex justify-end gap-[12px] mt-auto pt-[20px]">
      <button type="button" className="secondary-btn" onClick={onCancel}>
        {tc('cancel')}
      </button>
      <button type="submit" className="primary-btn" disabled={isUpdating}>
        {isUpdating ? (
          <div className="flex items-center gap-2">
            <Loader size={14} className="animate-spin" />
            {tc('saving')}...
          </div>
        ) : (
          tc('save')
        )}
      </button>
    </div>
  )
}

export default RoleDetailActions
