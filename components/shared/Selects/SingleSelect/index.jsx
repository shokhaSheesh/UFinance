import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { getZoomAwareRect } from '@/utils/getZoomAwareRect'
import { Check, ChevronUp, Loader2, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SingleSelect = ({
  data = [],
  value,
  onChange = () => { },
  placeholder,
  withSearch = true,
  isClearable = true,
  className,
  dropdownClassName,
  hasError,
  wrapperClassName,
  disabled = false,
  onSearch = () => { },
  customButton,
  customRenderItem,
  elementAfter,
  isSearching = false,
  dropdownHeaderItem
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

  // На сервере value из персистентного стора недоступно → рендерим плейсхолдер,
  // пока не смонтировались, чтобы первый клиентский рендер совпал с серверным
  // (иначе hydration mismatch: сервер «Выберите» ↔ клиент, напр., «UZS»).
  const mounted = useMounted()
  const hasValue = mounted && !!value

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

  const getSelectedLabel = () => {
    if (!value) return placeholderText;
    const selectedItem = data.find(item => item.value === value);
    return selectedItem ? selectedItem.label : placeholderText;
  }

  const filteredData = useMemo(() => {
    // Пробелы по краям не должны влиять на поиск: строка из одних пробелов
    // равнозначна пустому запросу
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;
    return data.filter(item =>
      item.label?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  return (
    <div ref={containerRef} className={cn('relative w-full', wrapperClassName)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        className={cn(
          'flex items-center bg-gray-ucode-25 h-[36px]! transition-all duration-200 justify-between w-full rounded-md px-3 py-2 outline-none',
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
        {/* x button to delete selected */}

        <span className={cn('text-start line-clamp-1 font-normal text-xss!', hasValue ? 'text-gray-800' : 'text-gray-400')}>{mounted ? getSelectedLabel() : placeholderText}</span>
        <div className="flex items-center">
          {isClearable && hasValue && !disabled && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onChange(null);
              }}
              className=" cursor-pointer"
            >
              <X size={16} className="text-neutral-400 hover:text-neutral-600" />
            </div>
          )}
          <ChevronUp size={16} className={cn('text-neutral-400 transition-transform duration-200', open ? 'rotate-0' : 'rotate-180')} />
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
            {withSearch && <div className='p-2 border-b border-gray-100 flex items-center gap-2 relative'>
              <Search size={16} className='absolute left-4 text-neutral-400' />
              <input
                ref={inputRef}
                type='text'
                className='w-full h-9 border border-primary/40 rounded-md pl-8 pr-8 py-1.5 text-sm outline-none placeholder:text-neutral-400'
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
            </div>}

            {/* Custom Button at Top */}
            {customButton && (
              <div onClick={() => setOpen(false)} className='border-b border-gray-100'>
                {customButton}
              </div>
            )}

            {dropdownHeaderItem && (
              <div onClick={() => setOpen(false)}>
                {dropdownHeaderItem}
              </div>
            )}

            {/* List Items */}
            <div className='overflow-y-auto flex-1 py-1 flex flex-col'>
              {isSearching ? (
                <div className='p-4 flex items-center justify-center'>
                  <Loader2 size={20} className='text-primary animate-spin' />
                </div>
              ) : filteredData.length === 0 ? (
                  <div className='p-3 text-sm text-neutral-400 text-center'>{t('notFound')}</div>
              ) : (
                filteredData.map(node => {
                  const isSelected = value === node.value;

                  if (customRenderItem) {
                    return (
                      <div
                        key={node.value}
                        className={cn(
                          "w-full hover:bg-neutral-50 transition-colors cursor-pointer",
                          isSelected && "bg-neutral-100/60"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(node.value);
                          setOpen(false);
                        }}
                      >
                        {customRenderItem(node, isSelected)}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={node.value}
                      className={cn(
                        "w-full  hover:bg-neutral-50 flex items-center justify-between text-xss! transition-colors cursor-pointer",
                        isSelected && "bg-neutral-100/60"
                      )}

                    >
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(node.value);
                          setOpen(false);
                        }}
                        className="flex-1 px-4 py-2"
                      >
                        {node.label}
                      </span>
                      <div
                        className="flex items-center gap-2 px-2"
                        onClick={() => {
                          setOpen(false);
                        }}
                      >
                        {isSelected && <Check size={16} className="text-primary" />}
                        {elementAfter && <div onClick={(e) => {
                          e.stopPropagation()
                          setOpen(false)
                        }}>{elementAfter(node)}</div>}
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

export default SingleSelect;


//  template how to use
/*
  <SingleSelect
    data={[
      { value: '1', label: 'Опция 1' },
      { value: '2', label: 'Опция 2' }
    ]}
    value={selectedValue}
    onChange={(val) => setSelectedValue(val)}
    placeholder="Выберите статью..."
    className="flex-1"
  />
*/

