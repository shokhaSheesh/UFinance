'use client'

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useUcodeDefaultApiQuery } from '../../../hooks/useDashboard'
import { apiClient } from '../../../lib/api/ucode/base'
import { queryClient } from '../../../lib/queryClient'
import { showErrorNotification } from '../../../lib/utils/notifications'
import { authStore } from '../../../store/auth.store'
import { formatPhoneNumber } from '../../../utils/helpers'
import SelectLegelEntitties from '../../ReadyComponents/SelectLegelEntitties'
import SelectProductService from '../../ReadyComponents/SelectProductService'
import SingleCounterParty from '../../ReadyComponents/SingleCounterParty'
import SinglSelectStatiya from '../../ReadyComponents/SingleSelectStatiya'
import CustomDialog from '../../shared/CustomDialog'
import FormDatepicker from '../../shared/DatePicker/form-datepicker'
import Input from '../../shared/Input'
import SingleSelect from '../../shared/Selects/SingleSelect'

const academicYears = Array.from({ length: 16 }, (_, i) => {
  const start = 2025 + i
  return { value: `${start}-${start + 1}`, label: `${start}-${start + 1}` }
})

const today = moment(new Date()).format('YYYY-MM-DD')


const sostayaniya = [
  { value: 'active', label: 'Faol' },
  { value: 'passive', label: 'Passiv' },
]

const clientType = [
  { value: 'new', label: 'Yangi' },
  { value: 'old', label: 'Eski' },
]

const CreateStudentModal = observer(({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState('form') // 'form' | 'preview'
  const [contractTemplate, setContractTemplate] = useState('')
  const branch = authStore.selectBranch
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      contractNumber: '',
      contractDate: today,
      guardianName: '',
      branchName: branch?.name || '',
      guardianType: '',
      academicYear: '',
      phone1: '',
      studentName: '',
      phone2: '',
      passport: '',
      pinf: '',
      issuedBy: '',
      tariffName: '',
      birthDate: today,
      validFrom: today,
      gender: '',
      validTo: today,
      className: '',
      clientType: '',
      language: '',
      status: '',
      address: '',
      passiveDate: today,
      thirdPartyName: '',
      thirdPartyPinfl: '',
      counterparties_id: '',
      product_and_service_id: '',
      chart_of_accounts_id: '',
      classes_id: '',
      language_classes_id: '',
      legal_entity_id: '',
      monthlyPayment: ""
    }
  })

  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ['get_contract', authStore.branch_id],
    queryFn: () =>
      apiClient.defaultUcodeFunction({ urlMethod: 'GET', urlParams: `/items/templates?from-ofs=true&data=${encodeURIComponent(JSON.stringify({ branch_id: authStore.branch_id }))}` }),
    enabled: !!authStore.branch_id,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0,
    select: (data) => data?.data?.data?.response?.[0],
  })

  console.log('contractdata', contract)

  const contractData = useMemo(() => ({
    branch_id: contract?.branch_id,
    guid: contract?.guid,
    file: contract?.file,
    company_id: contract?.company_id,
    branchName: contract?.branch_id_data?.name
  }), [contract])

  useEffect(() => {
    if (!contractData.file) return
    fetch(contractData.file)
      .then((r) => r.text())
      .then(setContractTemplate)
      .catch(() => { })
  }, [contractData.file])

  const { mutate: createStudent, isPending } = useMutation({
    mutationKey: ['create-student'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'create_contract_with_counterparty', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
      handleClose()
    }
  })

  // Fetch statuses
  const { data: clasess } = useUcodeDefaultApiQuery({
    queryKey: 'classes',
    urlMethod: 'GET',
    urlParams: '/items/classes?from-ofs=true',
    querySetting: {
      select: (response) => response?.data?.data?.response,
      placeholder: keepPreviousData,
      staleTime: 1000 * 60 * 60
    }
  })
  // Fetch statuses
  const { data: language_classes } = useUcodeDefaultApiQuery({
    queryKey: 'language_classes',
    urlMethod: 'GET',
    urlParams: '/items/language_classes?from-ofs=true',
    querySetting: {
      select: (response) => response?.data?.data?.response,
      staleTime: 1000 * 60 * 60,
      placeholder: keepPreviousData
    }
  })

  const classeList = useMemo(() => {
    return clasess?.map((item) => ({
      value: item.guid,
      label: item.name
    })) || []
  }, [clasess])



  const languageClassList = useMemo(() => {
    return language_classes?.map((item) => ({
      value: item.guid,
      label: item.name
    })) || []
  }, [language_classes])



  const handlePreview = () => {
    setStep('preview')
  }

  const handleBackToForm = () => {
    setStep('form')
  }

  // Contract data mapper for different contract types
  const getContractDataForType = () => {
    const values = getValues()
    // Calculate yearly payment: months between dates * monthly payment
    const startDate = moment(values.contractDate)
    const endDate = moment(values.validTo)
    const monthsDiff = endDate.diff(startDate, 'months') + 1
    const monthlyAmount = parseInt(String(values.monthlyPayment ?? '').replace(/\s/g, '') || 0)
    const yearlyPayment = (monthsDiff * monthlyAmount).toLocaleString('ru-RU')
    const baseData = {
      contractNumber: values.contractNumber || '___',
      contractDate: moment(values.contractDate).format('DD.MM.YYYY') || '____-__-__',
      contractEndDate: values.validTo ? moment(values.validTo).format('DD.MM.YYYY') : '____-__-__',
      guardianPassport: values.passport || '________________________',
      guardianPassportIssuedBy: values.issuedBy || '________________________',
      guardianPhone1: values.phone1 || '________________________',
      guardianPhone2: values.phone2 || '________________________',
      guardianAddress: values.address || '________________________',
      guardianPinfl: values.pinf || '________________________',
      studentName: values.studentName || '________________________',
      guardianType: values.guardianType || '________________________',
      monthlyPayment: values.monthlyPayment,
      yearlyPayment,
      guardianName: values.guardianName,
      academicYear: values.academicYear || '2025-2026',
      className: values.className || '___',
      language: values.language || "O'zbek tili",
      studentBirthday: values.birthDate ? moment(values.birthDate).format('DD.MM.YYYY') : '____-__-__',
      validFrom: values.validFrom ? moment(values.validFrom).format('MMM, DD YYYY') : '____-__-__',
      validTo: values.validTo ? moment(values.validTo).format('MMM, DD YYYY') : '____-__-__',
    }

    return baseData
  }

  const getContractHtml = () => {
    if (!contractTemplate) return '<p style="padding:20px;font-family:sans-serif">Загрузка шаблона договора...</p>'
    const data = getContractDataForType()
    return Object.entries(data).reduce(
      (html, [key, value]) => html.replaceAll(`\${${key}}`, String(value ?? '')),
      contractTemplate,
    )
  }

  const handleClose = () => {
    setStep('form')
    onClose()
  }

  const handleFormSubmit = async (data) => {
    // Helper to wrap value in array or return empty array
    const toArray = (val) => val ? [val] : []

    // Generate contract HTML with filled data based on active contract type
    const htmlContent = getContractHtml().replace(/\s*highlight\s*/g, ' ').replace(/\s+/g, ' ')

    let contractFileLink = ''

    try {
      // Step 1: Convert HTML to PDF
      const convertResponse = await fetch('https://api.admin.u-code.io/v2/html/convert?project-id=3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${authStore.authToken}`,
        },
        body: JSON.stringify({
          html_content: htmlContent,
          output_format: 'pdf'
        })
      })

      if (!convertResponse.ok) {
        throw new Error('Failed to convert HTML to PDF')
      }

      const pdfBlob = await convertResponse.blob()

      // Step 2: Upload PDF file
      const formData = new FormData()
      formData.append('file', pdfBlob, 'contract.pdf')

      const uploadResponse = await fetch('https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${authStore.authToken}`,
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF file')
      }

      const uploadData = await uploadResponse.json()
      const fileLink = uploadData?.data?.link

      if (fileLink) {
        contractFileLink = `https://cdn.u-code.io/${fileLink}`
      }
    } catch (error) {
      console.error('Error processing contract file:', error)
      showErrorNotification('Ошибка при обработке договора: ' + error.message)
      return
    }

    const requestData = {
      object_data: {
        name: data.contractNumber || '',
        number_contract: data.contractNumber || '',
        date_contract: (data.contractDate),
        deal_date: (data.contractDate),
        the_contract_period_is_from: moment(data.validFrom).format('YYYY-MM-DD'),
        the_contract_period_is_to: moment(data.validTo).format('YYYY-MM-DD'),
        counterparties_id: data.counterparties_id || '',
        product_and_service_id: data.product_and_service_id, // TODO: get from tariff lookup
        chart_of_accounts_id: data.chart_of_accounts_id, // TODO: get from settings
        legal_entity_id: data?.legal_entity_id || null,
        full_name_guardian: data.guardianName || '',
        type_guardian: toArray(data.guardianType),
        address: data.address || '',
        first_phone_number: String(data.phone1).replace(/\s/, '') || '',
        second_phone_number: String(data.phone2).replace(/\s/, '') || '',
        number_passport: data.passport || '',
        jshshr_guardian: data.pinf || '',
        place_of_issue: data.issuedBy || '',
        html: htmlContent,
        contract_file: contractFileLink,
        birthday_pupil: (data.birthDate),
        select_gender: toArray(data.gender),
        classes_id: data.classes_id, // TODO: get from class lookup
        pupil_type: toArray(data.clientType),
        language_classes_id: data.language_classes_id, // TODO: get from language lookup
        status: toArray(data.status),
        passive_date: (data.passiveDate)
      }
    }

    createStudent(requestData, {
      onSuccess: () => {
        showSuccessNotification('Ученик успешно создан')
        setStep('form')
        onClose()
        handleClose()
      },
      onError: (error) => {
        showErrorNotification(error?.message || 'Ошибка при создании ученика')
      }
    })
  }

  const html = getContractHtml()
  console.log('html', html)

  return (
    <CustomDialog
      contentClass={`h-[80vh] ${step === 'preview' ? 'min-w-[900px]!' : 'min-w-[1000px]!'} p-0 overflow-hidden flex flex-col`}
      open={isOpen}
      onClose={handleClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-4">
        <h2 className="text-lg font-bold text-gray-900 font-sans">
          {step === 'form' ? 'Новая продажа' : 'Предварительный просмотр договора'}
        </h2>
      </div>

      {step === 'form' ? (
        <>
          {/* Scrollable Form */}
          <div className="flex-1 overflow-auto p-4">
            <form id="student-form" onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Номер договора *</label>
                <Input
                  placeholder="Введите номер договора"
                  error={!!errors.contractNumber}
                  {...register('contractNumber', { required: 'Введите номер договора' })}
                />
                {/* {errors.contractNumber && <span className="text-xs text-red-500">{errors.contractNumber.message}</span>} */}
              </div>
              {/* Row 1 */}
              <div className="flex flex-col gap-1.5 focus-within:text-blue-600">
                <label className="text-xs font-medium text-gray-700">Дата договора *</label>
                <Controller
                  name="contractDate"
                  control={control}
                  rules={{ required: 'Выберите дату договора' }}
                  render={({ field }) => (
                    <FormDatepicker
                      value={field.value}
                      onChange={field.onChange}
                      format='YYYY-MM-DD'
                      placeholder="Выберите дату"
                      className={'w-full!'}
                    />
                  )}
                />
                {/* {errors.contractDate && <span className="text-xs text-red-500">{errors.contractDate.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Ф.И.О. опекуна *</label>
                <Input
                  placeholder="Введите Ф.И.О. опекуна"
                  error={!!errors.guardianName}
                  {...register('guardianName', { required: 'Введите Ф.И.О. опекуна' })}
                />
                {/* {errors.guardianName && <span className="text-xs text-red-500">{errors.guardianName.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Название филиала</label>
                <Controller
                  name="branchName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="Название филиала"
                      value={field.value}
                      readOnly
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите тип опекуна *</label>
                <Controller
                  name="guardianType"
                  control={control}
                  rules={{ required: 'Выберите тип опекуна' }}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите тип опекуна"
                      value={field.value}
                      onChange={field.onChange}
                      data={[
                        { value: 'ota', label: 'Ota' },
                        { value: 'ona', label: 'Ona' },
                        { value: 'aka-uka', label: 'Akasi-Ukasi' },
                      ]}
                      className='bg-white'
                      isClearable={false}
                    />
                  )}
                />
                {/* {errors.guardianType && <span className="text-xs text-red-500">{errors.guardianType.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите учебный год *</label>
                <Controller
                  name="academicYear"
                  control={control}
                  rules={{ required: 'Выберите учебный год' }}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите учебный год"
                      value={field.value}
                      onChange={field.onChange}
                      data={academicYears}
                      className='bg-white'
                      isClearable={false}
                    />
                  )}
                />
                {/* {errors.academicYear && <span className="text-xs text-red-500">{errors.academicYear.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Телефон 1 *</label>
                <Controller
                  name="phone1"
                  control={control}
                  rules={{ required: 'Введите номер телефона' }}
                  render={({ field }) => (
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="XX XXX XX XX"
                        value={field.value}
                        onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                        className={`w-full h-[36px] px-3 border rounded-md outline-none text-sm focus:border-cyan-500 font-sans ${errors.phone1 ? 'border-red-500 border-2' : 'border-gray-200'}`}
                      />
                    </div>
                  )}
                />
              </div>

              {/* Row 3 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Ф.И.О. ученика *</label>
                <Controller
                  name="counterparties_id"
                  control={control}
                  rules={{ required: 'Выберите ученика' }}
                  render={({ field }) => (
                    <SingleCounterParty
                      placeholder="Введите Ф.И.О. ученика"
                      value={field.value}
                      name='nazvanie'
                      returnChartOfAccount={(value) => setValue('studentName', value)}
                      onChange={field.onChange}
                      className={'bg-white'}
                      isClearable={false}
                    />
                  )}
                />
                {/* {errors.counterparties_id && <span className="text-xs text-red-500">{errors.counterparties_id.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Телефон 2</label>
                <Controller
                  name="phone2"
                  control={control}
                  render={({ field }) => (
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="XX XXX XX XX"
                        value={field.value}
                        onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                        className="w-full h-[36px] px-3 border border-gray-200 rounded-md outline-none text-sm focus:border-cyan-500 font-sans"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Серия и номер паспорта *</label>
                <Input
                  placeholder="Введите серию и номер паспорта"
                  error={!!errors.passport}
                  {...register('passport', { required: 'Введите серию и номер паспорта' })}
                />
                {/* {errors.passport && <span className="text-xs text-red-500">{errors.passport.message}</span>} */}
              </div>

              {/* Row 4 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">ПИНФЛ опекуна *</label>
                <Input
                  placeholder="Введите ПИНФЛ опекуна"
                  maxLength={14}
                  error={!!errors.pinf}
                  {...register('pinf', {
                    required: 'Введите ПИНФЛ опекуна',
                    pattern: { value: /^\d{14}$/, message: 'ПИНФЛ должен содержать 14 цифр' }
                  })}
                />
                {/* {errors.pinf && <span className="text-xs text-red-500">{errors.pinf.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Место выдачи *</label>
                <Input
                  placeholder="Введите место выдачи"
                  error={!!errors.issuedBy}
                  {...register('issuedBy', { required: 'Введите место выдачи' })}
                />
                {/* {errors.issuedBy && <span className="text-xs text-red-500">{errors.issuedBy.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Название тарифа</label>
                <Controller
                  name="product_and_service_id"
                  control={control}
                  render={({ field }) => (
                    <SelectProductService
                      value={field.value}
                      onChange={field.onChange}
                      name='tsena_za_ed'
                      returnFieldValue={(value) => {
                        setValue('monthlyPayment', value)
                      }}
                      placeholder="Выберите тариф"
                      className={'w-full! bg-white'}
                    />
                  )}
                />
              </div>

              {/* Row 5 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Дата рождения ученика *</label>
                <Controller
                  name="birthDate"
                  control={control}
                  rules={{ required: 'Выберите дату рождения' }}
                  render={({ field }) => (
                    <FormDatepicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите дату"
                      format='YYYY-MM-DD'
                      className={'w-full!'}
                    />
                  )}
                />
                {/* {errors.birthDate && <span className="text-xs text-red-500">{errors.birthDate.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Срок действия договора от *</label>
                <Controller
                  name="validFrom"
                  control={control}
                  rules={{ required: 'Выберите дату начала' }}
                  render={({ field }) => (
                    <FormDatepicker
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        setValue('the_contract_period_is_from', value)
                      }}
                      placeholder="Выберите дату"
                      format='YYYY-MM-DD'
                      className={'w-full!'}
                    />
                  )}
                />
                {/* {errors.validFrom && <span className="text-xs text-red-500">{errors.validFrom.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите пол *</label>
                <Controller
                  name="gender"
                  control={control}
                  rules={{ required: 'Выберите пол' }}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите пол"
                      value={field.value}
                      onChange={field.onChange}
                      data={[{ value: 'male', label: 'Мужской' }, { value: 'female', label: 'Женский' }]}
                      className='bg-white'
                      isClearable={false}
                    />
                  )}
                />
                {/* {errors.gender && <span className="text-xs text-red-500">{errors.gender.message}</span>} */}
              </div>
              {/* Row 6 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Срок действия договора до *</label>
                <Controller
                  name="validTo"
                  control={control}
                  rules={{ required: 'Выберите дату окончания' }}
                  render={({ field }) => (
                    <FormDatepicker
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        setValue('the_contract_period_is_to', value)
                      }}
                      placeholder="Выберите дату"
                      format='YYYY-MM-DD'
                      className={'w-full!'}
                    />
                  )}
                />
                {/* {errors.validTo && <span className="text-xs text-red-500">{errors.validTo.message}</span>} */}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Введите класс *</label>
                <Controller
                  name="classes_id"
                  control={control}
                  rules={{ required: 'Выберите класс' }}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Введите класс"
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        const name = clasess.find(l => l.guid === value)?.name
                        setValue('className', name)
                      }}
                      data={classeList}
                      isClearable={false}
                      className='bg-white'
                    />
                  )}
                />
                {/* {errors.classes_id && <span className="text-xs text-red-500">{errors.classes_id.message}</span>} */}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Тип клиента</label>
                <Controller
                  name="clientType"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Тип клиента"
                      value={field.value}
                      onChange={field.onChange}
                      data={clientType}
                      className='bg-white'
                      isClearable={false}
                    />
                  )}
                />
              </div>

              {/* Row 7 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Пассивная дата</label>
                <Controller
                  name="passiveDate"
                  control={control}
                  render={({ field }) => (
                    <FormDatepicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите дату"
                      format='YYYY-MM-DD'
                      className={'w-full! bg-white px-2 py-1 border border-gray-ucode-200!'}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Состояние</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Состояние"
                      value={field.value}
                      onChange={field.onChange}
                      data={sostayaniya}
                      className='bg-white'
                      isClearable={false}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Адрес *</label>
                <Input
                  placeholder="Адрес"
                  error={!!errors.address}
                  {...register('address', { required: 'Введите адрес' })}
                />
                {/* {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>} */}
              </div>

              {/* Row 8 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите язык *</label>
                <Controller
                  name="language_classes_id"
                  control={control}
                  rules={{ required: 'Выберите язык' }}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите язык"
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        const name = language_classes.find(l => l.guid === value)?.name
                        setValue('language', String(name).toUpperCase())
                      }}
                      data={languageClassList}
                      className='bg-white'
                      isClearable={false}
                    />
                  )}
                />
                {/* {errors.language_classes_id && <span className="text-xs text-red-500">{errors.language_classes_id.message}</span>} */}
              </div>
              {/* Row 9 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Статья</label>
                <Controller
                  name="chart_of_accounts_id"
                  control={control}
                  render={({ field }) => (
                    <SinglSelectStatiya
                      selectedValue={field.value}
                      setSelectedValue={field.onChange}
                      placeholder='Нераспределенный доход'
                      className=' bg-white'
                      isClearable={false}
                    />
                  )}
                />
              </div>
              {/* Row 10 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Юрлица *</label>
                <Controller
                  name="legal_entity_id"
                  control={control}
                  rules={{ required: 'Выберите юрлицо' }}
                  render={({ field }) => (
                    <SelectLegelEntitties
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Выберите юрлицо'
                      className=' bg-white'
                      isClearable={false}
                    />
                  )}
                />
                {/* {errors.legal_entity_id && <span className="text-xs text-red-500">{errors.legal_entity_id.message}</span>} */}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
            <button type="button" className="px-5 py-2 border cursor-pointer border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors" onClick={handleClose}>
              Отменить
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="px-5 py-2 bg-emerald-600 cursor-pointer hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Предпросмотр
            </button>
            <button
              type="submit"
              form="student-form"
              disabled={isSubmitting}
              className="px-5 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isPending ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Contract Preview */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <iframe
                  srcDoc={getContractHtml()}
                  className="w-full h-full border-0 px-2"
                  title="Предпросмотр договора"
                />
              </div>
            </div>

            {/* Preview Footer */}
            <div className="flex items-center justify-end gap-3 p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                type="button"
                onClick={handleBackToForm}
                className="px-5 py-2 border border-gray-200 cursor-pointer rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Назад к форме
              </button>
              <button
                type="button"
                onClick={() => {
                  const iframe = document.querySelector('iframe[title="Предпросмотр договора"]')
                  if (iframe) iframe.contentWindow.print()
                }}
                className="px-5 py-2 bg-emerald-600 cursor-pointer hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Печать
              </button>
              <button
                type="submit"
                form="student-form"
                disabled={isSubmitting}
                onClick={handleSubmit(handleFormSubmit)}
                className="px-5 py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isPending ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
        </>
      )}
    </CustomDialog>
  )
})

export default CreateStudentModal
