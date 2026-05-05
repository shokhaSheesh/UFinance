import CustomDialog from '@/components/shared/CustomDialog'
import { useEffect, useState } from 'react'
import { CalendarCellIcon, CalendarIcon, CreditIcon, DebitIcon, MergeArrowsIcon, SortArrow } from '../../../../constants/icons'
import { appStore } from '../../../../store/app.store'
import { isFuture } from '../../../../utils/formatDate'
import { formatAmount, formatDateRu, formatNumber } from '../../../../utils/helpers'
import SingleCounterParty from '../../../ReadyComponents/SingleCounterParty'
import SinglSelectStatiya from '../../../ReadyComponents/SingleSelectStatiya'
import OperationCheckbox from '../../../shared/Checkbox/operationCheckbox'
import FormDatepicker from '../../../shared/DatePicker/form-datepicker'
import CustomMultipleSelect from '../../../shared/Selects/MultipleSelect'
import './style.scss'


const defaultOptions = [
  { value: 'Начисление', label: 'Начисление' },
  { value: 'Контрагент', label: 'Контрагент' },
  { value: 'Статья', label: 'Статья' },
]

const today = new Date().getDate()

const DateCell = ({ row, i, dispatch, disabled }) => {
  return (
    <FormDatepicker
      value={row.calculationDate ? new Date(row.calculationDate) : null}
      onChange={(value) => {
        const date = value instanceof Date ? value : value ? new Date(value) : null
        const formatted = date
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          : ''
        dispatch({ type: 'UPDATE', index: i, field: 'calculationDate', value: formatted })
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
  const [open, setOpen] = useState(initiallyOpen)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

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

  useEffect(() => {
    if (open && amount) {
      dispatch({ type: 'RECALCULATE_VALUES', amount })
    }
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
    if ((isFutureDate && !appStore.isDonoSchool)) {
      return
    }
    console.log('isFutureDate', isFutureDate)
    console.log('index', index)
    console.log('check', check)
    dispatch({ type: 'UPDATE', index, field: 'isCalculationCommitted', value: check })
  }



  return (
    <div className="w-full overflow-x-auto">
      <button
        type="button"
        className="text-primary-dark text-xs cursor-pointer"
        onClick={handleToggleSplit}
      >
        {open ? 'Отменить разбиение' : 'Разбить сумму'}
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
                          <strong>Дата начисления</strong>
                        </th>
                        <th className="split-th col-confirm">
                          <strong>Подтвердить</strong>
                        </th>
                      </>
                    )}
                    {showAgent && (
                      <th className="split-th col-agent">
                        <strong>Контрагент</strong>
                      </th>
                    )}
                    {showStatya && (
                      <th className="split-th col-statya">
                        <strong>Статья</strong>
                      </th>
                    )}
                    <th className="split-th col-value">
                      <span className="th-icon" onClick={() => dispatch({ type: 'DIVIDE_EQUAL', amount })} style={{ cursor: 'pointer' }}><MergeArrowsIcon /></span>
                      <strong>Сумма <span className="sort-arrow"><SortArrow /></span></strong>
                    </th>
                    <th className="split-th col-percent">
                      <span className="th-icon" onClick={() => dispatch({ type: 'DIVIDE_EQUAL', amount })} style={{ cursor: 'pointer' }}><MergeArrowsIcon /></span>
                      <strong>Доля</strong>
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
                                checked={(isFutureDate && !appStore.isDonoSchool) || salesDeal ? false : row.isCalculationCommitted}
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
                                placeholder="Не выбран"
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
                                placeholder='Выберите статью...'
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
                              value={formatNumber(row.value)}
                              onChange={e => {
                                const val = formatNumber(e.target.value)
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
                              value={String(Math.floor(Number(row.percent) || 0))}
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
                              title="Удалить строку"
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
                        Добавить строку
                      </button>
                      {isExceeded && <div className="text-red-500 text-xs font-semibold text-right mt-3">Уменьшите на</div>}
                    </td>
                    <td className="footer-total align-top pt-3 border-none flex flex-col justify-start">
                      <div>
                        <span className="total-label text-xss text-gray-800" style={{ fontWeight: 'bold' }}>Итого:</span>
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

      <CustomDialog open={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} >
        <div className='flex items-center justify-between px-4 py-5'>
          <h3 className='text-base font-medium text-gray-900 '>Подтвердите, что вы хотите отменить разбиение суммы операции. Это приведет к удалению ранее введенных данных.</h3>
        </div>
        <div className='flex items-center justify-end gap-4'>
          <button
            className={'secondary-btn'}
            onClick={() => setIsCancelModalOpen(false)}
          >
            Вернуться
          </button>
          <button
            className={'primary-btn'}
            onClick={handleConfirmCancel}
          >
            Подтвердить
          </button>
        </div>
      </CustomDialog>
    </div>
  )
}

export default SplitAmount