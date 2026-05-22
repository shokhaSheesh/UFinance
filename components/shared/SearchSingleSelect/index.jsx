import { Check, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import ReactSelect, { components } from 'react-select'

// Custom MenuList wrapper
const MenuList = (props) => {
  const t = useTranslations('Common.selects')
  const { selectProps, children } = props
  const { searchValue, onSearchChange, onCreateCounterparty, createButtonLabel } = selectProps

  return (
    <components.MenuList {...props}>
      <div className="p-3 sticky top-0 bg-white z-10">
        <div className="relative flex items-center border border-[#13A8AE] rounded-md px-3 py-2 bg-white overflow-hidden">
          <Search className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            className="w-full focus:outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
            placeholder={t('searchInList')}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
      </div>

      {onCreateCounterparty && (
        <div
          className="px-4 py-2 cursor-pointer text-[#13A8AE] font-bold text-[13px] uppercase hover:bg-gray-50 bg-white sticky z-10"
          style={{ top: '65px' }} // Position directly below search area
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCreateCounterparty();
          }}
        >
          {createButtonLabel || 'СОЗДАТЬ НОВОГО КОНТРАГЕНТА'}
        </div>
      )}

      <div className="pb-1 border-t border-gray-100 mt-2">
        {children}
      </div>
    </components.MenuList>
  )
}

// Custom Option to show checkmark
const Option = (props) => {
  return (
    <components.Option {...props}>
      {props.label}
      {props.isSelected && (
        <Check className="h-4 w-4 text-[#13A8AE]" />
      )}
    </components.Option>
  )
}

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      {props.selectProps.menuIsOpen ? (
        <ChevronUp className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      )}
    </components.DropdownIndicator>
  )
}

const ClearIndicator = (props) => {
  return (
    <components.ClearIndicator {...props}>
      <X className="h-3.5 w-3.5 text-gray-400" />
    </components.ClearIndicator>
  )
}

const defaultStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '40px',
    borderRadius: '4px',
    border: `1px solid #13A8AE`,
    padding: 0,
    backgroundColor: 'transparent',
    boxShadow: 'none',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#d0d5dd',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '2px 12px',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#0f172a',
    fontSize: '14px',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    fontSize: '14px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '4px',
    marginTop: '4px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
    zIndex: 50,
  }),
  menuList: (base) => ({
    ...base,
    padding: 0,
    maxHeight: '350px',
  }),
  groupHeading: (base) => ({
    ...base,
    fontSize: '14px',
    color: '#111827',
    fontWeight: '700',
    textTransform: 'none',
    padding: '8px 16px',
    marginBottom: 0,
  }),
  group: (base) => ({
    ...base,
    paddingBottom: 0,
    paddingTop: '8px',
  }),
  option: (base, state) => ({
    ...base,
    padding: '8px 16px',
    paddingLeft: '24px',
    backgroundColor: state.isFocused ? '#f9fafb' : 'transparent',
    color: '#374151',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '&:active': {
      backgroundColor: '#f3f4f6',
    },
  }),
}


const groupStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const groupBadgeStyles = {
  backgroundColor: '#EBECF0',
  borderRadius: '2em',
  color: '#172B4D',
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 'normal',
  lineHeight: '1',
  minWidth: 1,
  padding: '0.16666666666667em 0.5em',
  textAlign: 'center',
};

const SearchSingleSelect = ({
  data = [],
  value,
  onChange,
  onCreateCounterparty,
  createButtonLabel = 'СОЗДАТЬ НОВОГО КОНТРАГЕНТА',
  placeholder = 'Выберите...',
  className = '',
  styles = {},
  isClearable = false,
  isSearchable = false,
  groupedOptions = false,
  options: propOptions,
  ...props
}) => {
  const [searchValue, setSearchValue] = useState('')

  const items = propOptions || data

  // Filter options based on local search input
  const filteredOptions = useMemo(() => {
    if (!searchValue) return items

    const s = searchValue.trim().toLowerCase()

    return items.map(group => {
      if (group.options) {
        const filtered = group.options.filter(opt =>
          opt.label.toLowerCase().includes(s)
        )
        if (filtered.length > 0) {
          return { ...group, options: filtered }
        }
        return null
      }

      if (group.label && group.label.toLowerCase().includes(s)) {
        return group
      }
      return null
    }).filter(Boolean)
  }, [items, searchValue])

  const selectedValue = useMemo(() => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'object') return value;
    
    for (const item of items) {
      if (item.options) {
        const found = item.options.find(opt => opt.value === value)
        if (found) return found;
      } else {
        if (item.value === value) return item;
      }
    }
    return null;
  }, [value, items])

  const formatGroupLabel = (groupData) => (
    <div style={groupStyles}>
      <span>{groupData.label}</span>
      <span style={groupBadgeStyles}>{groupData.options.length}</span>
    </div>
  );


  return (
    <div className={`w-full ${className}`}>
      <ReactSelect
        value={selectedValue}
        onChange={onChange}
        options={filteredOptions}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isClearable={isClearable}
        styles={{
          ...defaultStyles,
          ...styles
        }}
        components={{
          MenuList,
          Option,
          DropdownIndicator,
          ClearIndicator,
          ...props.components
        }}
        formatGroupLabel={groupedOptions ? formatGroupLabel : null}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onCreateCounterparty={onCreateCounterparty}
        createButtonLabel={createButtonLabel}
        onMenuClose={() => setSearchValue('')}
        {...props}
      />
    </div>
  )
}

export default SearchSingleSelect