"use client"

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import CustomDatePicker from '../../shared/DatePicker'
import styles from './DateRangePicker.module.scss'

export function DateRangePicker({ selectedRange, onChange, placeholder = "Выберите период" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0))
  const [activeInput, setActiveInput] = useState(null)
  const [tempStartDate, setTempStartDate] = useState(null)
  const [tempEndDate, setTempEndDate] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, openUpward: false })
  const pickerRef = useRef(null)
  const modalRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      // Проверяем, что клик был вне pickerRef И вне modalRef
      const isOutsidePicker = pickerRef.current && !pickerRef.current.contains(event.target)
      const isOutsideModal = modalRef.current && !modalRef.current.contains(event.target)

      if (isOutsidePicker && isOutsideModal) {
        closeModal()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect()
      const modalWidth = activeInput ? 600 : 440
      const modalHeight = 400

      // Позиционируем справа от кнопки
      let left = rect.right + 8
      let top = rect.top

      // Проверяем, не выходит ли модалка за правый край экрана
      if (left + modalWidth > window.innerWidth) {
        // Если не помещается справа, открываем слева
        left = rect.left - modalWidth - 8
      }

      // Проверяем, не выходит ли модалка за нижний край экрана
      const spaceBelow = window.innerHeight - rect.top
      const openUpward = spaceBelow < modalHeight && rect.top > spaceBelow

      if (openUpward) {
        top = rect.bottom - modalHeight
      }

      setDropdownPosition({
        top,
        left,
        openUpward
      })
    }
  }, [isOpen, activeInput])

  const closeModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      setActiveInput(null)
    }, 200)
  }

  const quickDateRanges = [
    { label: 'Просроченные', getValue: () => ({ start: new Date(2025, 0, 1), end: new Date() }) },
    {
      label: 'Вчера', getValue: () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return { start: yesterday, end: yesterday }
      }
    },
    { label: 'Прошлая неделя', getValue: () => ({ start: new Date(2026, 0, 5), end: new Date(2026, 0, 11) }) },
    { label: 'Прошлый месяц', getValue: () => ({ start: new Date(2025, 11, 1), end: new Date(2025, 11, 31) }) },
    { label: 'Прошлый квартал', getValue: () => ({ start: new Date(2025, 9, 1), end: new Date(2025, 11, 31) }) },
    { label: 'Прошлый год', getValue: () => ({ start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) }) },
    { label: 'Будущие', getValue: () => ({ start: new Date(), end: new Date(2026, 11, 31) }) },
    {
      label: 'Сегодня', getValue: () => {
        const today = new Date()
        return { start: today, end: today }
      }
    },
    { label: 'Эта неделя', getValue: () => ({ start: new Date(2026, 0, 12), end: new Date(2026, 0, 18) }) },
    { label: 'Этот месяц', getValue: () => ({ start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) }) },
    { label: 'Этот квартал', getValue: () => ({ start: new Date(2026, 0, 1), end: new Date(2026, 2, 31) }) },
    { label: 'Этот год', getValue: () => ({ start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) }) }
  ]

  const formatDateRange = (range) => {
    if (!range) return null
    return `${range.start?.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}–${range.end?.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
  }

  return (
    <div className={styles.container} ref={pickerRef}>
      {selectedRange ? (
        <div className={styles.selectedRange}>
          <svg className={styles.selectedRangeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span className={styles.selectedRangeText}>{formatDateRange(selectedRange)}</span>
          <button
            onClick={() => onChange(null)}
            className={styles.selectedRangeClear}
          >
            ✕
          </button>
        </div>
      ) : (
          <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.button}
        >
          <svg className={styles.buttonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {placeholder}
        </button>
      )}

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={modalRef}
          className={styles.modal}
          style={{
            top: dropdownPosition.top + 'px',
            left: dropdownPosition.left + 'px',
            width: activeInput ? '600px' : '440px',
            animation: isClosing
              ? 'fadeSlideOut 0.2s ease-in'
              : dropdownPosition.openUpward
                ? 'fadeSlideUp 0.25s ease-out'
                : 'fadeSlideIn 0.25s ease-out'
          }}
        >
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Укажите период</h3>

            <div className={styles.modalBody}>
              <div className={styles.quickRanges}>
                {quickDateRanges.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const dateRange = range.getValue()
                      onChange(dateRange)
                      closeModal()
                    }}
                    className={styles.quickRangeButton}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {activeInput && (
                <div className={styles.calendar}>
                  <div className={styles.calendarHeader}>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className={styles.calendarNavButton}
                    >
                      «
                    </button>
                    <span className={styles.calendarMonth}>
                      {currentMonth?.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase())}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className={styles.calendarNavButton}
                    >
                      »
                    </button>
                  </div>

                  <div className={styles.calendarWeekdays}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className={styles.calendarWeekday}>
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className={styles.calendarDays}>
                    {Array.from({ length: 35 }, (_, i) => {
                      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
                      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
                      const dayNum = i - startDay + 1
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum)
                      const isCurrentMonth = dayNum > 0 && dayNum <= new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
                      const isToday = date.toDateString() === new Date(2026, 0, 14).toDateString()
                      const isSelected = (tempStartDate && date.toDateString() === tempStartDate.toDateString()) ||
                        (tempEndDate && date.toDateString() === tempEndDate.toDateString())

                      return (
                        <button
                          key={i}
                          disabled={!isCurrentMonth}
                          onClick={() => {
                            if (isCurrentMonth) {
                              if (activeInput === 'start') {
                                setTempStartDate(date)
                              } else if (activeInput === 'end') {
                                setTempEndDate(date)
                              }
                            }
                          }}
                          className={cn(
                            styles.calendarDay,
                            !isCurrentMonth && styles.disabled,
                            isCurrentMonth && !isToday && !isSelected && styles.enabled,
                            isToday && !isSelected && styles.today,
                            isSelected && styles.selected
                          )}
                        >
                          {isCurrentMonth ? dayNum : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.dateInputs}>
              {/* <button
                onClick={() => setActiveInput('start')}
                className={cn(
                  styles.dateInput,
                  activeInput === 'start' ? styles.active : styles.inactive
                )}
              >
                <CalendarIcon className={styles.dateInputIcon} />
                <span className={styles.dateInputText}>
                  {tempStartDate ? tempStartDate?.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Начало периода'}
                </span>
              </button>
              <span className={styles.dateInputSeparator}>—</span>
              <button
                onClick={() => setActiveInput('end')}
                className={cn(
                  styles.dateInput,
                  activeInput === 'end' ? styles.active : styles.inactive
                )}
              >
                <CalendarIcon className={styles.dateInputIcon} />
                <span className={styles.dateInputText}>
                  {tempEndDate ? tempEndDate?.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Конец периода'}
                </span>
              </button> */}
              <CustomDatePicker value={tempStartDate} onChange={(value) => {
                setTempStartDate(value)

                console.log(tempStartDate);
              }} />
              <CustomDatePicker value={tempEndDate} onChange={(value) => {
                setTempEndDate(value)

                console.log(tempEndDate);
              }} />

            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setTempStartDate(null)
                  setTempEndDate(null)
                  closeModal()
                }}
                className={cn(styles.modalActionButton, styles.reset)}
              >
                Сбросить
              </button>
              <button
                onClick={() => {
                  if (tempStartDate && tempEndDate) {
                    onChange({ start: tempStartDate, end: tempEndDate })
                  }
                  closeModal()
                }}
                className={cn(styles.modalActionButton, styles.apply)}
              >
                Применить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
