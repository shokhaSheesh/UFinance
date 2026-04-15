import { ChevronUp, Check, Search, X } from 'lucide-react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { getZoomAwareRect } from '@/utils/getZoomAwareRect'

const TreeNode = ({ node, level = 0, selectedValue, onSelect, multi }) => {
  const isSelected = multi ? selectedValue?.includes(node.value) : selectedValue === node.value;
  const isSelectable = node.isSelectable !== false;

  return (
    <div className='flex flex-col w-full'>
      <div
        className={cn(
          "w-full  h-[34px]! px-4 py-2 hover:bg-neutral-50 flex items-center justify-between text-xss! transition-colors",
          isSelectable ? "cursor-pointer" : "cursor-default   text-neutral-800 font-normal! text-base!",
          node.bold && "font-medium! ",
          isSelected && "bg-neutral-100/60"
        )}
        style={{ paddingLeft: `${16 + level * 16}px` }}
        onClick={(e) => {
          e.stopPropagation();
          if (isSelectable) onSelect(node);
        }}
      >
        <span>{node.label}</span>
        {isSelected && <Check size={16} className="text-primary" />}
      </div>

      {node.children && node.children.map(child => (
        <TreeNode
          key={child.value}
          node={child}
          level={level + 1}
          selectedValue={selectedValue}
          onSelect={onSelect}
          multi={multi}
        />
      ))}
    </div>
  )
}

const TreeSelect = ({
  data = [],
  value,
  onChange = () => { },
  placeholder = "Выберите",
  multi = false,
  isClearable = true,
  className, dropdownClassName,
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


  const getSelectedLabel = () => {
    if (!value) return placeholder;
    if (multi && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      return `Выбрано: ${value.length}`;
    }

    // Find node label recursively for single selection
    const findLabel = (nodes) => {
      for (const node of nodes) {
        if (node.value === value) return node.label;
        if (node.children) {
          const found = findLabel(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return findLabel(data) || placeholder;
  }

  const isPlaceholder = getSelectedLabel() === placeholder;


  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const matchesSearch = node.label?.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = node.children ? filterNodes(node.children) : [];

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    }
    return filterNodes(data);
  }, [data, searchQuery])


  const handleSelect = (node) => {
    if (multi) {
      const currentValues = Array.isArray(value) ? value : [];

      const getSelectableValues = (n) => {
        let vals = [];
        if (n.isSelectable !== false) vals.push(n.value);
        if (n.children) {
          n.children.forEach(c => {
            vals = [...vals, ...getSelectableValues(c)];
          });
        }
        return vals;
      };

      const nodeValues = getSelectableValues(node);
      const allSelected = nodeValues.every(v => currentValues.includes(v));
      let newValue;

      if (allSelected) {
        newValue = currentValues.filter(v => !nodeValues.includes(v));
      } else {
        newValue = [...new Set([...currentValues, ...nodeValues])];
      }
      onChange(newValue);
    } else {
      onChange(node.value);
      setOpen(false);
    }
  }


  return (
    <div ref={containerRef} className='relative w-full'>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          'flex items-center cursor-pointer h-[36px]! bg-gray-ucode-25 transition-all duration-200 justify-between w-full rounded-md  px-3 py-2 outline-none focus:border-primary/80',
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
        <span className={cn('text-gray-ucode-400 text-start line-clamp-1 font-normal text-xss!', (multi && value?.length > 0) || (!multi && value) && 'text-gray-ucode-800', isPlaceholder && 'text-gray-ucode-400')}>{getSelectedLabel()}</span>
        <div className="flex items-center">
          {isClearable && ((multi && value?.length > 0) || (!multi && value)) && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(multi ? [] : null);
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
              'z-99999 bg-white  border border-neutral-200 rounded-lg shadow-lg max-h-64 flex flex-col',
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

            {/* Tree List */}
            <div className='overflow-y-auto flex-1 py-1 flex flex-col'>
              {filteredData.length === 0 ? (
                <div className='p-3 text-sm text-neutral-400 text-center'>Не найдено</div>
              ) : (
                filteredData.map(node => (
                  <TreeNode
                    key={node.value}
                    node={node}
                    selectedValue={value}
                    onSelect={handleSelect}
                    multi={multi}
                  />
                ))
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

export default TreeSelect;


{/* <TreeSelect
  data={[
    { value: '1', label: 'Активы', bold: true, isSelectable: false, children: [
        { value: '2', label: 'Оборотные активы', bold: true, isSelectable: true },
        { value: '3', label: 'Запасы', isSelectable: true }
    ]}
  ]}
  multi={false}
  value={selectedValue}
  onChange={(val) => console.log('Selected:', val)}
/> */}
