import SingleCounterParty from '@/components/ReadyComponents/SingleCounterParty'
import SinglSelectStatiya from '@/components/ReadyComponents/SingleSelectStatiya'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import CustomDialog from '@/components/shared/CustomDialog'
import FormDatepicker from '@/components/shared/DatePicker/form-datepicker'
import CustomMultipleSelect from '@/components/shared/Selects/MultipleSelect'
import { CalendarCellIcon, CalendarIcon, CreditIcon, DebitIcon, MergeArrowsIcon, SortArrow } from '@/constants/icons'
import { appStore } from '@/store/app.store'
import { isFuture } from '@/utils/formatDate'
import { formatAmount, formatAmountInput, formatDateRu, formatNumber } from '@/utils/helpers'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import './style.scss'


const DateCell = ({ row, i, dispatch, disabled }) => {
  return (
    <FormDatepicker
      value={row.calculationDate ? new Date(row.calculationDate) : null}
      onChange={(value) => {
        const date = moment.parseZone(value).format('YYYY-MM-DD')
        dispatch({ type: 'UPDATE', index: i, field: 'calculationDate', value: date })
        dispatch({ type: 'UPDATE', index: i, field: 'isCalculationCommitted', value: !isFuture(date) })
      }}
      format="YYYY-MM-DD"
      disabled={disabled}
      render={(_value, openCalendar) => (
        <div className="date-cell-wrapper">
          <div
            className="date-cell"
            onClick={() => {
              if (disabled) return
              openCalendar()
            }}
          >
            <CalendarCellIcon />
            <span className={`date-value ${disabled ? ' cursor-not-allowed' : ''}`}>
              {formatDateRu(row.calculationDate)}
            </span>
          </div>
        </div>
      )}
    />
  )
}

// ── Main component ──────────────────────────────────────────
const SplitAmount = ({ amount, onChange, rows,
  dispatch, selectedSplits, setSelectedSplits, confirmPayment, initiallyOpen = false, modalType, salesDeal }) => {
  const t = useTranslations('Operations.splitAmount')
  const [open, setOpen] = useState(initiallyOpen)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const defaultOptions = useMemo(() => [
    { value: 'Начисление', label: t('splitAccrual') },
    { value: 'Контрагент', label: t('splitCounterparty') },
    { value: 'Статья', label: t('splitStatya') },
  ], [t])

  const [prevInitiallyOpen, setPrevInitiallyOpen] = useState(initiallyOpen)

  if (initiallyOpen !== prevInitiallyOpen) {
    setPrevInitiallyOpen(initiallyOpen)
    if (initiallyOpen) setOpen(true)
  }

  const has = (label) => selectedSplits.some(s => s.value === label)
  const showDate = has('Начисление')
  const showAgent = has('Контрагент')
  const showStatya = has('Статья')

  const rawPercentSum = rows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0)
  const totalPercent = Number(rawPercentSum.toFixed(2))

  const rawValueSum = rows.reduce((s, r) => s + (Number(String(r.value).replace(/\s/g, '')) || 0), 0)
  const rawAmount = Number(String(amount).replace(/\s/g, '')) || 0
  const difference = rawValueSum - rawAmount
  const isExceeded = difference > 0
  const differencePercent = Number((totalPercent - 100).toFixed(2))

  // Track the last amount that was applied to the rows and whether the
  // panel was open on the previous run, so we can tell an actual amount
  // edit apart from simply opening the panel (which must not wipe data).
  const prevAmountRef = useRef(amount)
  const wasOpenRef = useRef(open)
  const rowsRef = useRef(rows)

  // Keep the latest rows in a ref (synced after commit) so the amount/open
  // effect can read them for the "has existing distribution" check without
  // re-running whenever a single row is edited.
  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  useEffect(() => {
    if (!open) {
      // Keep prevAmountRef untouched so a change made while closed is still
      // detected as a change when the panel is reopened.
      wasOpenRef.current = false
      return
    }

    const justOpened = !wasOpenRef.current
    const amountChanged = amount !== prevAmountRef.current
    wasOpenRef.current = true

    if (!amount) {
      prevAmountRef.current = amount
      return
    }

    if (amountChanged) {
      // User edited the total amount → split everything equally.
      dispatch({ type: 'DIVIDE_EQUAL', amount })
    } else if (justOpened) {
      // Opening the panel: keep an existing distribution (e.g. when editing
      // an operation), otherwise start from an equal split.
      const num = (v) => parseFloat(String(v ?? '').replace(/\s/g, '')) || 0
      const hasDistribution = rowsRef.current.some(
        (r) => num(r.percent) > 0 || num(r.value) > 0
      )
      dispatch({ type: hasDistribution ? 'RECALCULATE_VALUES' : 'DIVIDE_EQUAL', amount })
    }

    prevAmountRef.current = amount
  }, [amount, open, dispatch])

  useEffect(() => {
    if (onChange) {
      onChange(open ? rows.filter((r) => r.value) : [])
    }
  }, [rows, open, onChange])


  const handleToggleSplit = () => {
    if (open) {
      setIsCancelModalOpen(true)
    } else {
      setOpen(true)
    }
  }

  const handleConfirmCancel = () => {
    dispatch({ type: 'RESET' })
    setOpen(false)
    setIsCancelModalOpen(false)
  }


  const handleCheckRow = (isFutureDate, index, check) => {
    if ((isFutureDate)) return
    dispatch({ type: 'UPDATE', index, field: 'isCalculationCommitted', value: check })
  }



  return (
    <div className="w-full overflow-x-auto">
      <button
        type="button"
        className="text-primary-dark text-xs cursor-pointer"
        onClick={handleToggleSplit}
      >
        {open ? t('cancelSplit') : t('splitAmount')}
      </button>

      {open && (
        <div className='w-full overflow-x-auto space-y-2'>
          <div className="relative z-50">
            <CustomMultipleSelect
              data={defaultOptions}
              value={selectedSplits}
              withSearch={false}
              onChange={setSelectedSplits}
              className={'bg-white'}
            />
          </div>

          {selectedSplits?.length > 0 && <div className="split-table-wrap">
            <div>
              <table className="split-table">
                <thead className='split-thead'>
                  <tr>
                    {showDate && (
                      <>
                        <th className="split-th col-date">
                          <span className="th-icon"><CalendarIcon /></span>
                          <strong>{t('accrualDate')}</strong>
                        </th>
                        <th className="split-th col-confirm">
                          <strong>{t('confirm')}</strong>
                        </th>
                      </>
                    )}
                    {showAgent && (
                      <th className="split-th col-agent">
                        <strong>{t('counterparty')}</strong>
                      </th>
                    )}
                    {showStatya && (
                      <th className="split-th col-statya">
                        <strong>{t('statya')}</strong>
                      </th>
                    )}
                    <th className="split-th col-value">
                      <span className="th-icon" onClick={() => dispatch({ type: 'DIVIDE_EQUAL', amount })} style={{ cursor: 'pointer' }}><MergeArrowsIcon /></span>
                      <strong>{t('amount')} <span className="sort-arrow"><SortArrow /></span></strong>
                    </th>
                    <th className="split-th col-percent">
                      <span className="th-icon" onClick={() => dispatch({ type: 'DIVIDE_EQUAL', amount })} style={{ cursor: 'pointer' }}><MergeArrowsIcon /></span>
                      <strong>{t('share')}</strong>
                    </th>
                    <th className="split-th col-remove" />
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, i) => {
                    const isFutureDate = isFuture(row.calculationDate)

                    const isDebit = ((modalType === 'income' && !confirmPayment && row.isCalculationCommitted) || (modalType === 'payment' && confirmPayment && !row.isCalculationCommitted)) && (showDate && !isFutureDate && !salesDeal)

                    const isCredit = ((modalType === 'income' && confirmPayment && !row.isCalculationCommitted) || (modalType === 'payment' && !confirmPayment && row.isCalculationCommitted)) && (showDate && !isFutureDate && !salesDeal)


                    return (
                      <tr key={i} className="split-tr">
                        {showDate && (
                          <>
                            {/* Date cell */}
                            <td className={`split-td col-date ${salesDeal ? ' cursor-not-allowed opacity-30' : ''}`}>
                              <DateCell
                                row={row}
                                i={i}
                                dispatch={dispatch}
                                disabled={salesDeal}
                              />
                            </td>
                            {/* Confirm checkbox */}
                            <td className={`split-td col-confirm ${salesDeal ? ' cursor-not-allowed opacity-30' : ''}`}>
                              <OperationCheckbox
                                checked={salesDeal && !appStore.isAccrualDate ? false : row.isCalculationCommitted}
                                onChange={e => handleCheckRow(isFutureDate, i, e.target.checked)}
                                disabled={salesDeal}
                              />
                            </td>
                          </>
                        )}

                        {showAgent && (
                          <td className="split-td col-agent">
                            <div className="borderless-select" style={{ maxWidth: '180px' }}>
                              <SingleCounterParty
                                value={row.contrAgentId}
                                onChange={(value) => dispatch({ type: 'UPDATE', index: i, field: 'contrAgentId', value: value || '' })}
                                placeholder={t('counterpartyPlaceholder')}
                                className="bg-transparent border-none p-0 py-2"
                                dropdownClassName="w-64"
                              />
                            </div>
                          </td>
                        )}

                        {/* Статья */}
                        {showStatya && (
                          <td className="split-td col-statya">
                            <div className="borderless-select" >
                              <SinglSelectStatiya
                                selectedValue={row.operationCategoryId}
                                setSelectedValue={value => dispatch({ type: 'UPDATE', index: i, field: 'operationCategoryId', value })}
                                placeholder={t('statyaPlaceholder')}
                                className="bg-transparent border-none p-0 py-2"
                                dropdownClassName="w-64"
                                type={modalType === 'income' ? 'Расходы' : modalType === 'payment' ? 'Доходы' : "Расходы"}
                              />
                            </div>
                          </td>
                        )}

                        {/* Сумма */}
                        <td className="split-td col-value">
                          <div className="value-cell-wrapper relative">
                            <span className="absolute top-1/2 -translate-y-1/2">
                              {isDebit && <DebitIcon />}
                              {isCredit && <CreditIcon />}
                            </span>

                            <input
                              type="text"
                              className="value-input"
                              placeholder="0"
                              value={formatAmountInput(row.value)}
                              onChange={e => {
                                const val = formatAmountInput(e.target.value)
                                dispatch({ type: 'UPDATE', index: i, field: 'value', value: val, amount });
                              }}
                            />
                          </div>
                        </td>

                        {/* Доля */}
                        <td className="split-td col-percent">
                          <div className="percent-cell">
                            <input
                              type="text"
                              className="percent-input"
                              placeholder="0"
                              maxLength={5}
                              value={String(row.percent)}
                              onChange={e => {
                                const perc = (e.target.value)
                                dispatch({ type: 'UPDATE', index: i, field: 'percent', value: perc, amount });
                              }}
                            />
                            <span className="percent-symbol">%</span>
                          </div>
                        </td>

                        <td className="split-td col-remove">
                          {rows.length > 1 && (
                            <button
                              type="button"
                              className="remove-row-btn"
                              onClick={() => dispatch({ type: 'REMOVE', index: i, amount })}
                              title={t('removeRow')}
                            >×</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Footer row */}
                  <tr className="split-footer-row border-none">
                    <td
                      colSpan={(showDate ? 2 : 0) + (showAgent ? 1 : 0) + (showStatya ? 1 : 0)}
                      className="align-top pt-3 border-none"
                    >
                      <button
                        type="button"
                        className="add-row-btn block"
                        onClick={() => dispatch({ type: 'ADD', amount })}
                      >
                        {t('addRow')}
                      </button>
                      {isExceeded && <div className="text-red-500 text-xs font-semibold text-right mt-3">{t('decreaseBy')}</div>}
                    </td>
                    <td className="footer-total align-top pt-3 border-none flex flex-col justify-start">
                      <div>
                        <span className="total-label text-xss text-gray-800" style={{ fontWeight: 'bold' }}>{t('total')}</span>
                        <span className="total-value text-xss pl-1 text-gray-800" style={{ fontWeight: 'bold' }}>{formatAmount(String(rawValueSum))}</span>
                      </div>
                      {isExceeded && <div className="text-red-500 text-xs font-semibold mt-3 text-right pr-2">{formatAmount(String(difference))}</div>}
                    </td>
                    <td className="footer-percent align-top pt-3 border-none text-xss" style={{ fontWeight: 'bold' }}>
                      {formatNumber(totalPercent)} %
                      {isExceeded && <div className="text-red-500 text-xs font-semibold mt-3 text-left">{formatNumber(differencePercent)} %</div>}
                    </td>
                    <td className="border-none" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>}
        </div>
      )}

      <CustomDialog open={isCancelModalOpen} contentClass={'w-[200px]!'} onClose={() => setIsCancelModalOpen(false)} >
        <div className="p-2">
          <div className='flex items-center justify-between px-4 py-5'>
            <h3 className='text-base font-medium text-gray-900 '>{t('cancelDialogText')}</h3>
          </div>
          <div className='flex items-center justify-end gap-4'>
            <button
              className={'secondary-btn'}
              onClick={() => setIsCancelModalOpen(false)}
            >
              {t('back')}
            </button>
            <button
              className={'primary-btn'}
              onClick={handleConfirmCancel}
            >
              {t('confirmAction')}
            </button>
          </div>
        </div>
      </CustomDialog>
    </div>
  )
}

export default SplitAmount