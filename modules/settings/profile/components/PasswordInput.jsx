'use client'
import Input from '@/components/shared/Input'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const PasswordInput = ({ label, value, onChange, placeholder, error }) => {
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          hasError={error}
          className="h-10! pr-10!"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

export default PasswordInput
