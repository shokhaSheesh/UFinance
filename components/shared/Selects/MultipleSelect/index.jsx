import { ChevronDown, Check, Search, X } from 'lucide-react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { getZoomAwareRect } from '@/utils/getZoomAwareRect'

const CustomMultipleSelect = ({
    data = [],
    value = [], // Array of values (strings or objects depending on your data)
    onChange = () => { },
    placeholder = "Выберите",
    withSearch = true,
    isClearable = true,
    className,
    dropdownClassName,
    hasError
}) => {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [openUpwards, setOpenUpwards] = useState(false)
    const buttonRef = useRef(null)
    const containerRef = useRef(null)
    const dropdownRef = useRef(null)
    const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0 })

    useEffect(() => {
        if (open && buttonRef.current) {
            const updatePosition = () => {
                const rect = getZoomAwareRect(buttonRef.current)
                const scrollY = window.scrollY
                setPortalPosition({
                    top: openUpwards ? rect.top + scrollY : rect.bottom + scrollY,
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

    const selectedItems = useMemo(() => {
        return data.filter(item => value.some(v => (v?.value || v) === item.value))
    }, [data, value])

    const filteredData = useMemo(() => {
        if (!searchQuery) return data
        return data.filter(item =>
            item.label?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [data, searchQuery])

    const handleSelect = (val) => {
        const isSelected = value.some(v => (v?.value || v) === val)
        const newValue = isSelected
            ? value.filter(v => (v?.value || v) !== val)
            : [...value, data.find(item => item.value === val)]
        onChange(newValue)
    }

    const removeItem = (e, val) => {
        e.stopPropagation()
        const newValue = value.filter(v => (v?.value || v) !== val)
        onChange(newValue)
    }

    const clearAll = (e) => {
        e.stopPropagation()
        onChange([])
    }

    return (
        <div ref={containerRef} className='relative w-full'>
            <div
                ref={buttonRef}
                className={cn(
                    'flex items-center cursor-pointer bg-gray-ucode-25 transition-all duration-200 min-h-[36px]! w-full rounded-md border px-3 py-2 outline-none focus-within:border-primary/80',
                    className,
                    hasError ? 'border-red-500 border!' : "border-neutral-200"
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
                <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                    {selectedItems.length > 0 ? (
                        selectedItems.map(item => (
                            <div
                                key={item.value}
                                className="flex items-center gap-1.5 bg-neutral-100 text-neutral-700 px-2 py-1 rounded-[4px] text-xs font-medium group"
                            >
                                <span>{item.label}</span>
                                <X
                                    size={14}
                                    className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
                                    onClick={(e) => removeItem(e, item.value)}
                                />
                            </div>
                        ))
                    ) : (
                            <span className="text-neutral-400 text-xss! ml-1">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center px-1 shrink-0 gap-1 border-l ml-2 border-neutral-100">
                    {isClearable && value.length > 0 && (
                        <X
                            size={18}
                            className="text-neutral-300 hover:text-neutral-500 cursor-pointer"
                            onClick={clearAll}
                        />
                    )}
                    <ChevronDown
                        size={18}
                        className={cn('text-neutral-300 transition-transform duration-200', open && 'rotate-180')}
                    />
                </div>
            </div>

            {open && (() => {
                const dropdown = (
                    <div
                        ref={dropdownRef}
                        className={cn(
                            'z-9999 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col',
                            dropdownClassName
                        )}
                        style={{
                            top: portalPosition.top,
                            left: portalPosition.left,
                            width: portalPosition.width,
                            zIndex: 10001,
                            position: 'fixed',
                            transform: openUpwards ? 'translateY(-100%)' : 'none',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {withSearch && (
                            <div className='p-2 border-b border-neutral-100 flex items-center gap-2 relative'>
                                <Search size={16} className='absolute left-4 text-neutral-400' />
                                <input
                                    autoFocus
                                    type='text'
                                    className='w-full h-9 border border-neutral-200 rounded-md pl-8 pr-2 py-1.5 text-xss! outline-none focus:border-primary/40'
                                    placeholder='Поиск...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}

                        <div className='overflow-y-auto flex-1 py-1 flex flex-col'>
                            {filteredData.length === 0 ? (
                                <div className='p-3 text-sm text-neutral-400 text-center'>Ничего не найдено</div>
                            ) : (
                                    filteredData.map(item => {
                                        const isSelected = value.some(v => (v?.value || v) === item.value)
                                        return (
                                            <div
                                            key={item.value}
                                            className={cn(
                                                "w-full px-4 py-2.5 hover:bg-neutral-50 flex items-center justify-between text-xss! transition-colors cursor-pointer",
                                                isSelected && "text-primary font-medium"
                                            )}
                                            onClick={() => handleSelect(item.value)}
                                        >
                                            <span>{item.label}</span>
                                            {isSelected && <Check size={16} />}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )

                if (typeof document !== 'undefined') {
                    return createPortal(dropdown, document.body)
                }
                return null
            })()}
        </div>
    )
}

export default CustomMultipleSelect