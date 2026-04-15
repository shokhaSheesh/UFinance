import { useState, useEffect, useMemo } from 'react'
import { X, TrashIcon } from 'lucide-react'
import styles from './style.module.scss'
import { DatePicker } from '@/components/common/DatePicker/DatePicker'
import { formatDecimal, formatNumber, StringtoNumber } from '../../../../utils/helpers'
import OperationCheckbox from '../../../shared/Checkbox/operationCheckbox'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '../../../../hooks/useDashboard'
import Loader from '../../../shared/Loader'
import { queryClient } from '../../../../lib/queryClient'
import { productServiceDto } from '../../../../lib/dtos/productServiceDto'
import SinglSelectStatiya from '../../../ReadyComponents/SingleSelectStatiya'
import SingleCounterParty from '../../../ReadyComponents/SingleCounterParty'
import SelectProductService from '../../../ReadyComponents/SelectProductService'
import SelectLegelEntitties from '../../../ReadyComponents/SelectLegelEntitties'
import MyAccountCurrensies from '../../../ReadyComponents/MyAccountCurrensies'
import { appStore } from '../../../../store/app.store'
import { observer } from 'mobx-react-lite'
import { cn } from '@/app/lib/utils'
import { toJS } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { GlobalCurrency } from '../../../../constants/globalCurrency'

const CreateShipment = observer(({ open, onClose, dealName, dealGuid, kontragentId, initialData = null, isEditing = false, isCopying = false, onSuccess }) => {
  const today = useMemo(() => new Date(), [])

  const [shipmentDate, setShipmentDate] = useState(today.toISOString().split('T')[0])
  const isFutureDate = new Date(shipmentDate).setHours(0, 0, 0, 0) > today.setHours(0, 0, 0, 0)

  const [isPlanned, setIsPlanned] = useState(true)
  const [legalEntity, setLegalEntity] = useState('')
  const [client, setClient] = useState(kontragentId || '')
  const [chartOfAccounts, setChartOfAccounts] = useState([])
  const [currency, setCurrency] = useState('')
  const [showChartOfAccounts, setShowChartOfAccounts] = useState(true)
  const [rows, setRows] = useState([
    { id: 1, name: '', quantity: '', price: '', discount: '', nds: '', sum: '' }
  ])
  const [code, setCode] = useState('')
  const { data: SingleShipment, isPending: isGettingSingleShipment } = useUcodeRequestQuery({
    method: "get_shipment_transaction",
    data: {
      guid: initialData?.guid
    },
    querySetting: {
      select: response => response?.data,

      placeholder: keepPreviousData
    },
    skip: !initialData?.guid
  })


  useEffect(() => {
    if (open && SingleShipment) {
      setShipmentDate(SingleShipment.data_nachislenie?.split('T')[0] || today.toISOString().split('T')[0])
      setIsPlanned(SingleShipment.planned_shipment || false)
      setLegalEntity(SingleShipment.legal_entity_id || '')
      setClient(SingleShipment.partners_id || kontragentId || '')
      setChartOfAccounts(SingleShipment.chart_of_accounts_id || '')
      setCurrency(SingleShipment.currencies_id || SingleShipment.currencyId || GlobalCurrency.guid)

      const currencies = toJS(appStore.currencies)
      const icon = currencies?.find(item => item.guid === SingleShipment.currencies_id)?.icon
      setCode(icon || '')

      if (SingleShipment.product_and_service_data) {
        setRows(SingleShipment.product_and_service_data.map((row, idx) => ({
          id: idx + 1,
          row_guid: row.guid,
          name: row.product_and_service_id || '',
          naimenovanie: row.Naimenovanie || '',
          artikul: row.Artikul || '',
          quantity: row.Kol_vo ?? 0,
          price: row.TSena_za_ed ?? 0,
          discount: String(row.Skidka ?? ''),
          nds: String(row.NDS ?? ''),
          sum: row.Summa ?? 0
        })))
      }
    }
  }, [open, SingleShipment, kontragentId, today])

  const [selectedProducts, setSelectedProducts] = useState(new Set())

  const [errors, setErrors] = useState({})

  // Fetch legal entities data

  const { mutateAsync: createShipment, isPending: isCreating } = useUcodeRequestMutation()

  const { data: productServices } = useUcodeRequestQuery({
    method: "list_products_and_services",
    querySetting: {
      select: data => data?.data?.data
    }
  })

  const productServicesList = useMemo(() => {
    return productServiceDto(productServices)
  }, [productServices])



  // Block body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])


  const addRow = () => {
    setRows(prev => [...prev, {
      id: Date.now(),
      name: '',
      quantity: '',
      price: '',
      discount: '',
      nds: '',
      sum: ''
    }])
  }

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row
      const updated = { ...row, [field]: value }

      if (['quantity', 'price', 'discount', 'nds'].includes(field)) {
        // sum = qty * price * (1 - discount/100) * (1 + nds/100)
        const q = Number(updated.quantity?.toString().replace(/\s/g, '')) || 0
        const p = Number(updated.price?.toString().replace(/\s/g, '')) || 0
        const d = Number(updated.discount?.toString().replace(/\s/g, '')) || 0
        const n = Number(updated.nds?.toString().replace(/\s/g, '')) || 0
        const subtotal = q * p
        const afterDiscount = subtotal * (1 - d / 100)
        updated.sum = afterDiscount * (1 + n / 100)
      }

      if (field === 'sum') {
        // Back-calculate price from sum: price = sum / qty / (1 - d/100) / (1 + n/100)
        const rawSum = Number(value?.toString().replace(/\s/g, '')) || 0
        const q = Number(updated.quantity?.toString().replace(/\s/g, '')) || 0
        const d = Number(updated.discount?.toString().replace(/\s/g, '')) || 0
        const n = Number(updated.nds?.toString().replace(/\s/g, '')) || 0
        if (q > 0) {
          const discountFactor = 1 - d / 100
          const ndsFactor = 1 + n / 100
          const divisor = q * (discountFactor > 0 ? discountFactor : 1) * (ndsFactor || 1)
          updated.price = divisor ? rawSum / divisor : 0
        }
      }

      return updated
    }))
  }

  const totalSum = useMemo(() => {
    return rows.reduce((acc, row) => {
      const sumVal = Number(row.sum?.toString().replace(/\s/g, '')) || 0;
      return formatDecimal(acc + sumVal);
    }, 0)
  }, [rows])

  const handleCreate = async () => {
    const newErrors = {}
    if (!shipmentDate) newErrors.shipmentDate = 'Выберите дату'
    if (!legalEntity) newErrors.legalEntity = 'Выберите юрлицо'
    if (!client) newErrors.client = 'Выберите клиента'

    const productData = rows.filter(row => row.name)
    if (productData.length === 0) newErrors.products = 'Добавьте хотя бы одну позицию'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const payload = {
        legal_entity_id: legalEntity,
        sales_id: dealGuid,
        partners_id: client,
        planned_shipment: isFutureDate ? true : isPlanned,
        status_nachislenie: ["confirmed"],
        type: ["Отгрузка"],
        summa: totalSum,
        data_nachislenie: shipmentDate,
        data_oplaty: shipmentDate,
        currencies_id: currency,
        description: "Shipment",
        chart_of_accounts_id: chartOfAccounts,
        product_and_service_data: productData.map(row => {
          const product = productServicesList.find(p => p.guid === row.name)
          const result = {
            product_and_service_id: product?.guid || row.name || undefined,
            Naimenovanie: product ? product.name : row.naimenovanie || "",
            Artikul: product?.article || row.artikul || "",
            Kol_vo: formatDecimal(StringtoNumber(row.quantity)) || 0,
            TSena_za_ed: formatDecimal(StringtoNumber(row.price)) || 0,
            Summa: formatDecimal(StringtoNumber(row.sum)) || 0,
            Skidka: Number(row.discount?.toString().replace(/\s/g, '')) || 0,
            NDS: Number(row.nds?.toString().replace(/\s/g, '')) || 0,
            unit_of_measurement_id: product?.raw?.units_of_measurement_id || undefined
          }
          if (row.row_guid) {
            result.guid = row.row_guid
          }
          return result
        })
      }

      if (isEditing && initialData?.guid) {
        payload.transaction_guid = initialData.guid
      }

      console.log('payload', payload)

      await createShipment({
        method: isEditing ? "update_shipment_transaction" : "create_shipment_transaction",
        data: payload
      })

      // Clear fields on success
      setShipmentDate(today.toISOString().split('T')[0])
      setIsPlanned(false)
      setLegalEntity('')
      setClient(kontragentId || '')
      setChartOfAccounts([])
      setRows([{ id: 1, name: '', quantity: 0, price: 0, discount: '', nds: '', sum: 0 }])
      setSelectedProducts(new Set())
      setErrors({})

      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid', { guid: dealGuid }] })
      queryClient.invalidateQueries({ queryKey: ['list_sales_operations'] })
      queryClient.invalidateQueries({ queryKey: ['find_operations'] })
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      onClose()
    }
  }

  const handleRemoveRow = () => {
    const newRow = rows.filter(item => !selectedProducts.has(item.id))
    setRows(newRow)
    setSelectedProducts(new Set())
  }

  const handleSelectProductSerice = (rowId, value) => {

    const product = productServicesList?.find(p => p.guid === value)
    if (!product) return;


    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const q = Number(product.kolvo) || 0;
      const p = Number(product.tsena_za_ed) || 0;
      return {
        ...row,
        name: value,
        price: p,
        quantity: q,
        discount: String(product.discount || 0),
        nds: String(product.nds || 0),
        sum: q * p
      }
    }))
  }

  const handleSelect = (value) => {
    setLegalEntity(value)
    if (!value) {
      setCode('')
    }
  }

  const handleChangeCurrency = (value) => {
    const selectedGuid = value || toJS(appStore.currency)?.guid
    setCurrency(selectedGuid)

    const currencies = toJS(appStore.currencies)
    const icon = currencies.find(item => item.guid === selectedGuid)?.icon
    if (legalEntity) {
      setCode(icon)
    }
  }

  if (!open) return null

  if (isGettingSingleShipment && initialData?.guid) {
    return (
      <>
        {/* Overlay */}
        <div className={cn("fixed top-[60px] left-[80px] w-[calc(100%-80px)] h-full right-0 bottom-0 flex bg-black/50 z-1000 transition-opacity duration-300")} onClick={onClose} />

        {/* Panel */}
        <div className={cn(styles.panel, "flex justify-center items-center")}>
          <Loader />
        </div>
      </>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div className={cn("fixed top-[60px] left-[80px] w-[calc(100%-80px)] h-full right-0 bottom-0 flex bg-black/50 z-1000 transition-opacity duration-300")} onClick={onClose} />

      {/* Panel */}
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {isEditing ? 'Редактирование отгрузки' : isCopying ? 'Копирование отгрузки' : 'Создание отгрузки'}
            </h2>
            <div className={styles.subtitle}>
              Сделка: <span className={styles.dealLink}>{dealName}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className={styles.body}>
          {/* Date + Planned */}
          <div className={styles.formRow}>
            <label className={styles.label}>
              Дата отгрузки <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldGroup} style={{ flex: 1, maxWidth: '600px' }}>
              <div className="flex w-full items-center gap-4">
                <div className='flex items-center gap-2'>
                  <DatePicker
                    value={shipmentDate}
                    onChange={value => {
                      setShipmentDate(value)
                      if (errors.shipmentDate) {
                        setErrors({ ...errors, shipmentDate: null })
                      }
                    }}
                    dateFormat='YYYY-MM-DD'
                    className={styles.datePicker}
                    placeholder='Выберите дату'
                  />
                  <div className='flex items-center' style={{ opacity: isFutureDate ? 0.5 : 1, pointerEvents: isFutureDate ? 'none' : 'auto' }}>
                    <OperationCheckbox
                      checked={isFutureDate ? true : isPlanned}
                      onChange={e => {
                        if (!isFutureDate) {
                          setIsPlanned(e.target.checked)
                        }
                      }}
                      className={'w-44'}
                      label='Плановая отгрузка'
                    />
                  </div>
                </div>
              </div>
              {errors.shipmentDate && (
                <span className={styles.errorText}>{errors.shipmentDate}</span>
              )}
            </div>
          </div>

          {/* Legal Entity */}
          <div className="w-full flex items-center gap-2 pb-2">
            <label className="w-40 text-xss!">
              Юрлицо <span className={styles.required}>*</span>
            </label>
            <div className="w-80!">
              <SelectLegelEntitties
                multi={false}
                value={legalEntity}
                onChange={handleSelect}
                placeholder="Выберите юрлицо"
                childFieldName={'currenies_id'}
                returnFieldValue={handleChangeCurrency}
                className="w-80! bg-white"
              />
              {errors.legalEntity && (
                <div className={styles.errorMessage}>{errors.legalEntity}</div>
              )}
            </div>
            <MyAccountCurrensies guid={legalEntity} value={currency} onChange={handleChangeCurrency} className=" bg-white " wrapperClassName={'w-48'} />
          </div>

          {/* Client */}
          <div className="w-full flex items-center gap-2 pb-2">
            <label className="w-40! text-xss!">
              Клиент <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <SingleCounterParty
                value={client}
                onChange={value => setClient(value)}
                placeholder='Выберите клиента...'
                name='chart_of_accounts_id'
                returnChartOfAccount={value => setChartOfAccounts(value)}
                className="w-80! bg-white"
              />
            </div>
            {errors.client && (
              <div className={styles.errorMessage}>{errors.client}</div>
            )}
          </div>

          {/* Chart of accounts */}
          {showChartOfAccounts && (
            <div className="w-full flex items-center gap-2 pb-2">
              <label className="w-40! text-xss!">
                Статья доходов
              </label>
              <div className="flex-1">
                <SinglSelectStatiya
                  selectedValue={chartOfAccounts}
                  setSelectedValue={value => setChartOfAccounts(value)}
                  placeholder='Нераспределенный доход'
                  className='w-80! bg-white'
                />
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className={styles.productsSection}>
            <div className={styles.productsSectionHeader}>
              <div className='flex flex-col gap-1'>
                <span className={styles.productsTitle}>Товары/услуги для отгрузки</span>
                {errors.products && <span className='text-[10px] text-red-500 font-medium'>{errors.products}</span>}
              </div>
              {/* <button
                className={styles.fillFromDeal}
                onClick={() => setShowChartOfAccounts(!showChartOfAccounts)}
              >
                Заполнить позициями из сделки
              </button> */}
            </div>

            <div className={styles.tableContainer}>
              <table className="w-full">
                <thead className='sticky top-0 z-10 bg-neutral-50'>
                  <tr className='bg-neutral-50  text-neutral-600 font-light h-8 text-mini w-full border-b border-gray-200'>
                    <th className="w-10">
                      <div className='flex items-center justify-center'>
                        <OperationCheckbox type="checkbox" checked={selectedProducts?.size > 0 && selectedProducts?.size === rows?.length} onChange={(e) => {
                          if (e.target.checked) {
                            const allrows = rows.map((row) => row.id)
                            setSelectedProducts(new Set(allrows))
                          } else {
                            setSelectedProducts(new Set())
                          }
                        }} className={styles.checkbox} />
                      </div>
                    </th>
                    {selectedProducts?.size > 0 && <th colSpan={6}>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <span className="text-sm font-bold text-neutral-900">Выбрано: {selectedProducts?.size}</span>
                          <button
                            className="outline-none border-none bg-transparent text-sm font-medium text-red-600 cursor-pointer flex items-center gap-2"
                            onClick={handleRemoveRow}
                          >
                            <TrashIcon size={16} className='text-red-500' />
                            Убрать из отгрузки
                          </button>
                        </div>
                        <button
                          className='outline-none border-none bg-transparent cursor-pointer mr-2'
                          onClick={() => setSelectedProducts(new Set())}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </th>}
                    {selectedProducts?.size === 0 && <>
                      <th className='w-[150px]  text-left'>Наименование</th>
                      <th className="w-[80px] border-l text-right px-1">Кол-во</th>
                      <th className="w-[120px] border-l text-right px-1">Цена за ед. {code}</th>
                      <th className="w-[80px] border-l text-right px-2">Скидка</th>
                      <th className="w-[80px] border-l text-right px-2">НДС</th>
                      <th className=" border-l text-right px-2">Сумма {code}</th>
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className='border-b last:border-none'>
                      <td className={styles.checkCol}>
                        <div className='flex items-center justify-center'>
                          <OperationCheckbox type="checkbox" checked={selectedProducts.has(row.id)} className={styles.checkbox} onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => {
                                const next = new Set(prev)
                                next.add(row.id)
                                return next
                              })
                            } else {
                              setSelectedProducts(prev => {
                                const next = new Set(prev)
                                next.delete(row.id)
                                return next
                              })
                            }
                          }} />
                        </div>
                      </td>
                      <td className='w-[200px]'>
                        <div className="pr-2 pt-2 pb-2">
                          <SelectProductService
                            value={row.name}
                            onChange={(value) => handleSelectProductSerice(row?.id, value)}
                            placeholder="Выберите позицию"
                            className="bg-white border-none"
                          />
                        </div>
                      </td>
                      <td className="w-[80px] border-l">
                        <input
                          type="text"
                          min={0}
                          value={formatNumber(row.quantity)}
                          onChange={(e) => updateRow(row.id, 'quantity', formatNumber(e.target.value))}
                          className={'w-full border-none border border-gray-400 h-10 text-end text-xs outline-none pr-2'}
                        />
                      </td>
                      <td className="w-[120px] border-l">
                        <input
                          type="text"
                          min={0}
                          value={formatNumber(row.price)}
                          onChange={(e) => updateRow(row.id, 'price', formatNumber(e.target.value))}
                          className={'w-full border-none border border-gray-400 h-10 text-end text-xs outline-none pr-2'}
                        />
                      </td>
                      <td className="w-[80px] border-l relative">
                        <input
                          type="text"
                          value={row.discount.replace(/\D/g, '')}
                          maxLength={2}
                          onChange={(e) => updateRow(row.id, 'discount', e.target.value)}
                          className={`w-[80px] outline-none text-xs h-10 text-right pr-2 mr-2`}
                        />
                        <span className='absolute top-1/2 text-xs  -translate-y-1/2 right-1'>%</span>
                      </td>
                      <td className="w-[80px] border-l relative">
                        <input
                          type="text"
                          maxLength={2}
                          value={row.nds}
                          onChange={(e) => updateRow(row.id, 'nds', e.target.value)}
                          className={`w-[80px] outline-none text-xs h-10 text-right pr-2 mr-2`}
                        />
                        <span className='absolute top-1/2 text-xs  -translate-y-1/2 right-1'>%</span>
                      </td>
                      <td className="w-[120px] border-l relative">
                        <input
                          type="text"
                          min={0}
                          value={formatNumber(row.sum)}
                          onChange={(e) => updateRow(row.id, 'sum', formatNumber(e.target.value))}
                          className={'w-full h-full text-xs text-end h-10 border-none outline-none pr-2'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <button className={styles.addRowBtn} onClick={addRow}>Добавить...</button>
              <p className={styles.totalSum}>Сумма отгрузки: <strong>{totalSum.toLocaleString('ru-RU')}</strong>
                <span className='text-neutral-600 ml-1'>{code}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.requiredNote}>
            <span className={styles.required}>*</span> Обязательные поля
          </span>
          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={onClose}>Отменить</button>
            <button className="primary-btn" onClick={handleCreate}>{
              isCreating ? <Loader /> : 'Создать'
            }</button>
          </div>
        </div>
      </div>
    </>
  )
})

export default CreateShipment