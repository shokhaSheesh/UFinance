import { cn } from '@/lib/utils'
import { getZoomAwareRect } from '@/utils/getZoomAwareRect'
import { Check, ChevronUp, Loader2, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MultiSelect = ({
    data = [],
    value, // don't default here — normalize below
    onChange = () => { },
    placeholder,
    withSearch = true,
    isClearable = true,
    className,
    dropdownClassName,
    hasError,
    onSearch = () => { },
    disabled = false,
    isSearching = false
}) => {
    const t = useTranslations('Common.selects')
    const placeholderText = placeholder ?? t('placeholder')
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [openUpwards, setOpenUpwards] = useState(false)
    const buttonRef = useRef(null)
    const containerRef = useRef(null)
    const dropdownRef = useRef(null)
    const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0 })

    const inputRef = useRef(null)

    const safeValue = useMemo(() => {
        if (Array.isArray(value)) return value;
        if (value === null || value === undefined || value === '') return [];
        return [value]; // single primitive → wrap
    }, [value]);

    useEffect(() => {
        if (open && withSearch && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current.focus()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [open, withSearch])

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

    const filteredData = useMemo(() => {
        if (!searchQuery) return data;
        return data.filter(item =>
            item.label?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    const getSelectedLabel = () => {
        if (safeValue.length === 0) return placeholderText;
        const selectedItems = data.filter(item => safeValue.includes(item.value));
        if (selectedItems.length === 1) return selectedItems[0].label;
        if (selectedItems.length > 1) return `${t('selectedPrefix')}: ${selectedItems.length}`;
        return placeholderText;
    }

    const handleSelect = (val) => {
        const newValue = safeValue.includes(val)
            ? safeValue.filter(v => v !== val)
            : [...safeValue, val];
        onChange(newValue);
    };

    return (
        <div ref={containerRef} className='relative w-full'>
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                className={cn(
                    'flex items-center bg-gray-ucode-25 h-[36px]! transition-all duration-200 justify-between w-full rounded-md  px-3 py-2 outline-none',
                    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer focus:border-primary/80',
                    className,
                    hasError ? 'border-red-ucode! border!' : "border border-neutral-200"
                )}
                onClick={() => {
                    if (disabled) return;
                    if (!open && buttonRef.current) {
                        const rect = getZoomAwareRect(buttonRef.current)
                        const spaceBelow = window.innerHeight - rect.bottom
                        const spaceAbove = rect.top
                        setOpenUpwards(spaceBelow < 256 && spaceAbove > spaceBelow)
                    }
                    setOpen(!open)
                }}
            >
                <span className={cn('text-gray-ucode-400 text-start line-clamp-1 font-normal text-xss!', value?.length > 0 && 'text-gray-ucode-800')}>{getSelectedLabel()}</span>
                <div className="flex items-center">
                    {isClearable && value?.length > 0 && !disabled && (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!disabled) onChange([]);
                            }}
                            className=" cursor-pointer"
                        >
                            <X size={16} className="text-neutral-400 hover:text-neutral-600" />
                        </div>
                    )}
                    <ChevronUp size={16} className={cn('text-neutral-400 transition-transform duration-200', open ? 'rotate-0' : 'rotate-180')} />
                </div>
            </button>

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
                        {withSearch && (
                            <div className='p-2 border-b border-gray-100 flex items-center gap-2 relative'>
                                <Search size={16} className='absolute left-4 text-neutral-400' />
                                <input
                                    ref={inputRef}
                                    type='text'
                                    className='w-full h-9 border border-primary/40 rounded-md pl-8 pr-2 py-1.5 text-sm outline-none placeholder:text-neutral-400'
                                    placeholder={t('searchInList')}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        onSearch(e.target.value)
                                    }}
                                />
                                {isSearching && (
                                    <Loader2 size={16} className='absolute right-4 text-primary animate-spin' />
                                )}
                            </div>
                        )}

                        <div className='overflow-y-auto flex-1 py-1 flex flex-col'>
                            {filteredData.length === 0 ? (
                                <div className='p-3 text-sm text-neutral-400 text-center'>{t('notFound')}</div>
                            ) : (
                                    filteredData.map(node => {
                                        const isSelected = value?.includes(node.value);

                                    return (
                                        <div
                                            key={node.value}
                                            className={cn(
                                                "w-full px-4 py-2 hover:bg-neutral-50 flex items-center justify-between text-xss! transition-colors cursor-pointer",
                                                isSelected && "bg-neutral-100/60"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelect(node.value);
                                            }}
                                        >
                                            <span>{node.label}</span>
                                            {isSelected && <Check size={16} className={cn('text-primary transition-transform duration-200')} />}
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

export default MultiSelect;