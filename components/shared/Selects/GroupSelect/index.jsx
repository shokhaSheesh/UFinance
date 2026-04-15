import { ChevronUp, Check, Search, X } from 'lucide-react'
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { getZoomAwareRect } from '@/utils/getZoomAwareRect'

const GroupSelect = ({
  data = [],
  value = [],
  onChange = () => { },
  placeholder = "Выберите",
  isClearable = true,
  dropdownClassName,
  className,
  hasError
}) => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openUpwards, setOpenUpwards] = useState(false)
  const buttonRef = useRef(null)
  const containerRef = useRef(null)
  const dropdownRef = useRef(null)
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0 })

  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (open && buttonRef.current) {
      const updatePosition = () => {
        const rect = getZoomAwareRect(buttonRef.current)
        setPortalPosition({
          top: openUpwards ? rect.top : rect.bottom,
          left: rect.left,
          width: rect.width
        })
      }
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [open, openUpwards])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target))
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Group and filter data
  const groupedData = useMemo(() => {
    const groups = {}

    // Filter by search query first
    const filtered = data.filter(item =>
      (item.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.groupName || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    filtered.forEach(item => {
      const gname = item.groupName || 'Без группы'
      if (!groups[gname]) {
        groups[gname] = []
      }
      groups[gname].push(item)
    })
    return groups
  }, [data, searchQuery])

  // Helper to check if a group is fully selected
  const isGroupSelected = (groupItems) => {
    return groupItems.every(item => value.includes(item.value))
  }

  // Handle group header click
  const toggleGroup = (groupItems) => {
    const groupValues = groupItems.map(item => item.value)
    const currentlySelectedAll = isGroupSelected(groupItems)

    let newValue
    if (currentlySelectedAll) {
      // Deselect all items in this group
      newValue = value.filter(val => !groupValues.includes(val))
    } else {
      // Select all items in this group (avoid duplicates)
      newValue = [...new Set([...value, ...groupValues])]
    }
    onChange(newValue)
  }

  // Handle single item click
  const toggleItem = (itemValue) => {
    let newValue
    if (value.includes(itemValue)) {
      newValue = value.filter(val => val !== itemValue)
    } else {
      newValue = [...value, itemValue]
    }
    onChange(newValue)
  }

  return (
    <div ref={containerRef} className='relative w-full'>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          'flex items-center cursor-pointer bg-gray-ucode-25 h-[36px]! transition-all duration-200 justify-between w-full rounded-md  px-3 py-2 outline-none focus:border-teal-500',
          className,
          hasError ? 'border-red-ucode! border!' : "border border-neutral-200"
        )}
        onClick={() => {
          if (!open && buttonRef.current) {
            const rect = getZoomAwareRect(buttonRef.current)
            const spaceBelow = window.innerHeight - rect.bottom
            const spaceAbove = rect.top
            setOpenUpwards(spaceBelow < 256 && spaceAbove > spaceBelow)
          }
          setOpen(!open)
        }}
      >
        {/* x button to delete selected */}

        <span className={cn('text-gray-ucode-400 text-start line-clamp-1 text-xss!', value.length > 0 && 'text-gray-ucode-800')}>
          {value.length > 0 ? `Выбрано: ${value.length}` : placeholder}
        </span>
        <div className="flex items-center">
          {isClearable && value?.length > 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className=" cursor-pointer"
            >
              <X size={16} className="text-neutral-400 hover:text-neutral-600" />
            </div>
          )}
          <ChevronUp size={18} className={cn('text-neutral-400 transition-transform duration-200', open ? 'rotate-0' : 'rotate-180')} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {open && (() => {
        const dropdown = (
          <div
            ref={dropdownRef}
            className={cn(
              'z-99999 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col',
              dropdownClassName
            )}
            style={{
              position: 'fixed',
              top: openUpwards ? portalPosition.top : portalPosition.top + 4,
              left: portalPosition.left,
              minWidth: portalPosition.width,
              transform: openUpwards ? 'translateY(-100%)' : 'none',
              marginTop: openUpwards ? '-4px' : '0'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className='p-2 border-b border-gray-100 flex items-center gap-2 relative'>
              <Search size={16} className='absolute left-4 text-neutral-400' />
              <input
                ref={inputRef}
                type='text'
                className='w-full h-9 border border-primary/40 rounded-md pl-8 pr-2 py-1.5 text-sm outline-none placeholder:text-neutral-400'
                placeholder='Поиск по списку'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List Items */}
            <div className='overflow-y-auto flex-1 py-1'>
              {Object.keys(groupedData).length === 0 ? (
                <div className='p-3 text-sm text-neutral-400 text-center'>Не найдено</div>
              ) : (
                Object.entries(groupedData).map(([groupName, items]) => {
                  const isGroupFullySelected = isGroupSelected(items);
                  return (
                    <div key={groupName} className='flex flex-col'>
                      {/* Group Header */}
                      <div
                        className='px-2 py-2 text-xss! font-medium text-neutral-900 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer flex items-center justify-between group'
                        onClick={() => toggleGroup(items)}
                      >
                        <span>{groupName}</span>
                        {isGroupFullySelected && <Check size={16} className="text-primary" />}
                      </div>

                      {/* Group Items */}
                      <div className='flex flex-col'>
                        {items.map((item) => {
                          const isItemSelected = value.includes(item.value);
                          return (
                            <div
                              key={item.value}
                              className='pl-8 pr-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100 cursor-pointer flex items-center justify-between'
                              onClick={() => toggleItem(item.value)}
                            >
                              <span>{item.label}</span>
                              {isItemSelected && <Check size={16} className="text-primary" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        );

        if (typeof document !== 'undefined') {
          return createPortal(dropdown, document.body);
        }
        return null;
      })()}
    </div>
  )
}

export default GroupSelect