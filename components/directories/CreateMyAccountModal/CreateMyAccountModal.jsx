"use client"

import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/app/lib/utils'
import { useCreateMyAccount, useUpdateMyAccount, useCurrencies } from '@/hooks/useDashboard'
import Input from '@/components/shared/Input'
import CustomDatePicker from '../../shared/DatePicker'
import SelectLegelEntitties from '../../ReadyComponents/SelectLegelEntitties'
import SingleSelect from '../../shared/Selects/SingleSelect'
import CustomModal from '../../shared/CustomModal'
import Loader from '../../shared/Loader'
import { formatDecimal, formatNumber, returnNumber, StringtoNumber } from '../../../utils/helpers'
import SelectMyAccoutGroup from '../../ReadyComponents/SelectMyAccoutGroup'
import { queryClient } from '../../../lib/queryClient'
import { appStore } from '../../../store/app.store'

export default function CreateMyAccountModal({ isOpen, onClose, account = null }) {
  const createMutation = useCreateMyAccount()
  const updateMutation = useUpdateMyAccount()
  const isEdit = !!account && !!account.guid

  const [formData, setFormData] = useState({
    nazvanie: '',
    tip: ['Наличный'],
    nachalьnyy_ostatok: '',
    data_sozdaniya: new Date().toISOString().split('T')[0],
    currenies_id: '',
    komentariy: '',
    legal_entity_id: "",
    bik: '',
    bank: '',
    rasch_schet: '',
    korr_schet: '',
    nomer: '',
    account_group_id: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)



  // Transform currencies data
  const currencies = useMemo(() => {
    return appStore.currencies.map(item => ({
      value: item.guid,
      label: `${item.kod || ''} (${item.nazvanie || ''})`.trim(),
      kod: item.kod || '',
      nazvanie: item.nazvanie || ''
    }))
  }, [])


  // Account types
  const accountTypes = [
    { value: 'Наличный', label: 'Наличный' },
    { value: 'Безналичный', label: 'Безналичный' },
    { value: 'Карта физлица', label: 'Карта физлица' },
    { value: 'Электронный', label: 'Электронный' }
  ]

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // Small delay to ensure smooth animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })

      // Initialize form data
      if (isEdit && account && account.guid) {
        // Editing existing account
        setFormData({
          nazvanie: account.nazvanie || '',
          tip: Array.isArray(account.tip) ? account.tip : ['Наличный'],
          nachalьnyy_ostatok: account.nachalьnyy_ostatok || '',
          data_sozdaniya: account.data_nachalьnogo_ostatka || account.data_sozdaniya
            ? new Date(account.data_nachalьnogo_ostatka || account.data_sozdaniya).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          currenies_id: account.currenies_id || '',
          komentariy: account.komentariy || '',
          legal_entity_id: account.legal_entity_id || "",
          bik: account.bik || '',
          bank: account.bank_name || account.bank || '',
          rasch_schet: account.nomer_scheta || '',
          korr_schet: account.kor_schet || account.korr_schet || '',
          nomer: account.nomer || '',
          account_group_id: account.account_groups_id || account.account_group_id || account.group_id || ''
        })
        if (account.bik || account.bank || account.rasch_schet || account.korr_schet) {
          setShowDetails(true)
        }
      } else {
        // Creating new account
        setFormData({
          nazvanie: '',
          tip: ['Наличный'],
          nachalьnyy_ostatok: '',
          data_sozdaniya: new Date().toISOString().split('T')[0],
          currenies_id: appStore?.currency?.guid,
          komentariy: '',
          legal_entity_id: "",
          bik: '',
          bank: '',
          rasch_schet: '',
          korr_schet: '',
          nomer: '',
          account_group_id: ''
        })
        setShowDetails(false)
      }
      setErrors({})
    } else {
      setIsVisible(false)
    }
  }, [isOpen, account, isEdit])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 250)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nazvanie.trim()) {
      newErrors.nazvanie = 'Укажите название'
    }

    if (!formData.legal_entity_id) {
      newErrors.legal_entity_id = 'Выберите юрлицо'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const submitData = {
        nazvanie: formData.nazvanie.trim(),
        tip: formData.tip,
        nachalьnyy_ostatok: formData.nachalьnyy_ostatok ? formatDecimal(StringtoNumber(formData.nachalьnyy_ostatok)) : null,
        data_nachalьnogo_ostatka: formData.data_sozdaniya || null,
        currenies_id: formData.currenies_id || null,
        komentariy: formData.komentariy || null,
        legal_entity_id: formData.legal_entity_id || null,
        bik: formData.bik || null,
        bank_name: formData.bank || null,
        nomer: formData.nomer,
        nomer_scheta: formData.rasch_schet,
        kor_schet: formData.korr_schet || null,
        account_groups_id: formData.account_group_id || null,
        ...(!isEdit && { data_sozdaniya: new Date().toISOString() })
      }


      if (isEdit && account && account.guid) {
        submitData.guid = account.guid
        await updateMutation.mutateAsync(submitData)
      } else {
        await createMutation.mutateAsync(submitData)
      }

      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })

      handleClose()
    } catch (error) {
      setErrors({ submit: error.message || `Не удалось ${isEdit ? 'обновить' : 'создать'} счет` })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible && !isOpen) return null

  return (
    <CustomModal className="w-[600px] p-0" isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col h-full text-slate-900">
        <div className="border-b pb-3 mb-3 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEdit ? 'Редактирование счета' : 'Создание счета'}</h2>
        </div>

        <div className="px-4 overflow-y-auto max-h-[70vh] py-4">
          <div className="flex flex-col gap-3">
            {/* Название */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">
                Название <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <Input
                  type="text"
                  value={formData.nazvanie}
                  onChange={(e) => setFormData({ ...formData, nazvanie: e.target.value })}
                  placeholder="Нанапример, ВТБ"
                  className={cn(errors.nazvanie && "border-red-500")}
                />
                {errors.nazvanie && (
                  <div className="text-[12px] text-red-500 mt-1">{errors.nazvanie}</div>
                )}
              </div>
            </div>


            {/* Группа */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm text-[#0f172a] flex items-center gap-1">
                Группа
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <SelectMyAccoutGroup
                  value={formData.account_group_id}
                  onChange={(value) => setFormData({ ...formData, account_group_id: value })}
                  className="bg-white"
                />
              </div>
            </div>

            {/* Юрлицо */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">Юрлицо <span className="text-red-500">*</span></label>
              <div className="flex-1 flex flex-col gap-1">
                <SelectLegelEntitties
                  value={formData.legal_entity_id}
                  multi={false}
                  onChange={(value) => setFormData({ ...formData, legal_entity_id: value })}
                  className="bg-white"
                  placeholder="Выберите юрлицо или создайте новое"
                />

                {errors.legal_entity_id && (
                  <div className="text-xs text-red-500 mt-1">{errors.legal_entity_id}</div>
                )}
              </div>
            </div>

            {/* Тип */}
            <div className="flex flex-row gap-2 ">
              <label className="w-[30%] text-sm mb-5  text-[#0f172a] flex items-center gap-1">
                Выберите тип счета
              </label>
              <div className="flex-1 flex flex-col gap-1 justify-start">
                <SingleSelect
                  data={accountTypes}
                  value={formData.tip && formData.tip.length > 0 ? formData.tip[0] : ''}
                  onChange={(value) => setFormData({ ...formData, tip: value ? [value] : [] })}
                  placeholder="Выберите тип"
                  className="flex-1 bg-white"
                  withSearch={false}
                  isClearable={false}
                />
                <div className="flex justiyf-start">
                  {formData.tip && (formData.tip[0] === 'Безналичный' || formData.tip[0] === 'Карта физлица') && (
                    showDetails ? (
                      <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer"
                      >
                        Скрыть реквизиты
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer"
                      >
                        Реквизиты
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>



            {formData.tip && (formData.tip[0] === 'Безналичный' || formData.tip[0] === 'Карта физлица') && (
              <div className="">
                {showDetails && (
                  <div className="flex flex-col gap-3 rounded-md">
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">Бик</label>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={formData.bik}
                          onChange={(e) => setFormData({ ...formData, bik: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">Банк</label>
                      <div className="flex-1">

                        <Input
                          type="text"
                          value={formData.bank}
                          onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">Расч. счет №</label>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={formData.rasch_schet}
                          onChange={(e) => setFormData({ ...formData, rasch_schet: e.target.value })}
                          className={cn(errors.rasch_schet && "border-red-500")}
                        />
                      </div>
                    </div>
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">Кор. счет №</label>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={formData.korr_schet}
                          onChange={(e) => setFormData({ ...formData, korr_schet: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {formData.tip && formData.tip[0] === 'Электронный' && (
              <div className="flex flex-row gap-2">
                <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">Номер</label>
                <div className="flex-1">
                  <Input
                    type="text"
                    value={formData.nomer}
                    onChange={(e) => setFormData({ ...formData, nomer: e.target.value })}
                    placeholder="Номер счета"
                  />
                </div>
              </div>
            )}

            {/* {isEdit && <div className="flex  gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">Расч. счет №</label>
              <div className="flex-1">

                <Input
                  type="text"
                  value={formData.rasch_schet}
                  onChange={(e) => setFormData({ ...formData, rasch_schet: e.target.value })}
                  className={cn(errors.rasch_schet && "border-red-500")}
                />
              </div>
            </div>} */}

            {/* Начальный остаток - показываем только при создании */}
            {!isEdit && (
              <div className="flex flex-row gap-2">
                <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">Начальный остаток</label>
                <div className="flex items-center flex-1 gap-2">
                  <Input
                    type="text"
                    value={formatNumber(formData.nachalьnyy_ostatok)}
                    onChange={(e) => setFormData({ ...formData, nachalьnyy_ostatok: formatNumber(e.target.value) })}
                    placeholder="0"
                    className="w-44"
                    onWheel={(e) => e.target.blur()}
                  />

                  <CustomDatePicker
                    value={formData.data_sozdaniya}
                    onChange={(value) => setFormData({ ...formData, data_sozdaniya: value })}
                    placeholder="Выберите дату"
                    format='YYYY-MM-DD'
                    className="w-44"
                  />
                </div>
              </div>
            )}

            {/* Валюта */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">
                Выберите валюту счета
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <SingleSelect
                  data={currencies}
                  value={formData.currenies_id}
                  onChange={(value) => setFormData({ ...formData, currenies_id: value })}
                  placeholder="Выберите валюту"
                  isClearable={false}
                  className="flex-1 bg-white"
                />
              </div>
            </div>

            {/* Комментарий */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">Комментарий</label>
              <div className="flex-1 flex flex-col gap-1">
                <textarea
                  value={formData.komentariy}

                  onChange={(e) => setFormData({ ...formData, komentariy: e.target.value })}
                  placeholder="Ваш комментарий или пояснение к этому счету"
                  className="p-2.5 text-sm resize-noneffwe text-[#0f172a] bg-white border border-gray-200 rounded-md transition-all w-full focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-gray-400 min-h-[80px]"
                  rows={4}
                />
              </div>
            </div>

            {errors.submit && (
              <div className="text-[12px] text-red-500 mt-1">{errors.submit}</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-neutral-200 p-4">
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-transparent rounded-md cursor-pointer transition-all hover:text-[#0f172a] hover:bg-gray-100"
            onClick={handleClose}
          >
            Отменить
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-md cursor-pointer transition-all hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader /> : (isEdit ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </div>
    </CustomModal>
  )
}
