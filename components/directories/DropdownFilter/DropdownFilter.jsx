"use client"

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { FiCheck } from 'react-icons/fi'
import styles from './DropdownFilter.module.scss'

export function DropdownFilter({ label, options, selectedValues = [], onChange, placeholder = "Выберите...", grouped = false, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const dropdownRef = useRef(null)

  console.log(options, 'options')

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    // Use true to use capture phase
    document.addEventListener("mousedown", handleClickOutside, true)
    return () => document.removeEventListener("mousedown", handleClickOutside, true)
  }, [])

  const handleToggle = (e) => {
    if (disabled) return
    if (e) e.stopPropagation()

    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      const dropdownHeight = Math.min(options.length * 40 + 16, 300)
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow)
    }

    setIsOpen(!isOpen)
  }

  // Group options logic
  const groupedOptions = grouped
    ? options.reduce((acc, option) => {
      const group = option.group || 'Без группы'
      if (!acc[group]) acc[group] = []
      acc[group].push(option)
      return acc
    }, {})
    : { 'all': options }

  const handleOptionClick = (option, groupName, groupItems) => {
    if (grouped && option.value === "") {
      // Parent clicked: Toggle all children
      const childItems = groupItems.filter(item => item.value !== "")
      const childValues = childItems.map(item => item.value)
      const allSelected = childValues.every(val => selectedValues.includes(val))

      if (allSelected) {
        // Deselect all children of this group
        onChange(selectedValues.filter(val => !childValues.includes(val)))
      } else {
        // Select all children (union)
        const newValues = [...new Set([...selectedValues, ...childValues])]
        onChange(newValues)
      }
    } else {
      // Normal option clicked
      if (selectedValues.includes(option.value)) {
        onChange(selectedValues.filter(v => v !== option.value))
      } else {
        onChange([...selectedValues, option.value])
      }
    }
  }

  const removeChip = (e, valueToUnselect) => {
    e.stopPropagation()
    // Check if it's a group removal (we might need a different identifiers for chips)
    // For now, let's assume we pass the value(s) to remove
    if (Array.isArray(valueToUnselect)) {
      // Removing a group
      onChange(selectedValues.filter(v => !valueToUnselect.includes(v)))
    } else {
      onChange(selectedValues.filter(v => v !== valueToUnselect))
    }
  }

  // Calculate display items (Chips)
  const renderChips = () => {
    if (!grouped) {
      return options
        .filter(opt => selectedValues.includes(opt.value))
        .map(opt => ({ label: opt.label, value: opt.value }))
    }

    const chips = []

    Object.entries(groupedOptions).forEach(([groupName, groupItems]) => {
      const childItems = groupItems.filter(i => i.value !== "")
      const childValues = childItems.map(i => i.value)
      const selectedChildren = childItems.filter(i => selectedValues.includes(i.value))

      if (selectedChildren.length === childItems.length && childItems.length > 0) {
        // All selected -> Show Group Chip
        // Find parent label if exists, else use groupName
        const parentOpt = groupItems.find(i => i.value === "")
        const label = parentOpt ? `${parentOpt.label} (${selectedChildren.length})` : `${groupName} (${selectedChildren.length})`

        chips.push({
          label,
          value: childValues, // Pass array for removal
          isGroup: true
        })
      } else {
        // Partially selected -> Show individual chips
        selectedChildren.forEach(child => {
          chips.push({
            label: child.label,
            value: child.value,
            isGroup: false
          })
        })
      }
    })

    return chips
  }

  const displayChips = renderChips()

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(styles.button, disabled && styles.disabled)}
        disabled={disabled}
      >
        <div className={styles.buttonContent}>
          {displayChips.length > 0 ? (
            <div className={styles.chipsContainer}>
              {displayChips.map((chip, idx) => (
                <span key={idx} className={styles.chip}>
                  {chip.label}
                  <span
                    onClick={(e) => removeChip(e, chip.value)}
                    className={styles.chipRemove}
                    role="button"
                    tabIndex={0}
                  >
                    <svg className={styles.chipRemoveIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className={cn(styles.buttonText, styles.empty)}>{placeholder}</span>
          )}
        </div>
        <svg
          className={cn(styles.buttonIcon, isOpen && styles.open)}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={cn(
            styles.dropdown,
            openUpward ? styles.openUpward : styles.openDownward
          )}
        >
          <div className={styles.dropdownContent}>
            {Object.entries(groupedOptions).map(([groupName, groupItems]) => (
              <div key={groupName} className={styles.group}>
                <div className='flex flex-col items-start'>
                  {groupItems.map((option) => (
                    <div
                      key={option.value || option.label}
                      onClick={() => handleOptionClick(option, groupName, groupItems)}
                      className={cn(
                        styles.option,
                        option.value !== "" && selectedValues.includes(option.value) && styles.selected,
                        option.value === "" && grouped ? styles.parent : grouped ? styles.child : ""
                      )}
                    >
                      <p className={`${styles.optionText}  capitalize`}>{option.label}</p>
                      {option.value !== "" && selectedValues.includes(option.value) && (
                        <FiCheck color='#0E73F6' />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
