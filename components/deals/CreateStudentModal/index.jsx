'use client'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { Edit2, Loader2, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useUcodeDefaultApiMutation, useUcodeDefaultApiQuery, useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { apiClient } from '../../../lib/api/ucode/base'
import { queryClient } from '../../../lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '../../../lib/utils/notifications'
import { authStore } from '../../../store/auth.store'
import { formatNumber, formatPhoneNumber, getMonthPeriods } from '../../../utils/helpers'
import SelectLegelEntitties from '../../ReadyComponents/SelectLegelEntitties'
import SelectProductService from '../../ReadyComponents/SelectProductService'
import SingleCounterParty from '../../ReadyComponents/SingleCounterParty'
import SinglSelectStatiya from '../../ReadyComponents/SingleSelectStatiya'
import CustomDialog from '../../shared/CustomDialog'
import FormDatepicker from '../../shared/DatePicker/form-datepicker'
import Input from '../../shared/Input'
import Loader from '../../shared/Loader'
import SingleSelect from '../../shared/Selects/SingleSelect'

const academicYears = Array.from({ length: 20 }, (_, i) => {
  const start = 2020 + i
  return { value: `${start}-${start + 1}`, label: `${start}-${start + 1}` }
})

const today = moment(new Date()).format('YYYY-MM-DD')
const sostayaniya = [
  { value: 'active', label: 'Faol' },
  { value: 'passive', label: 'Faol emas' },
]

const clientType = [
  { value: 'new', label: 'Yangi' },
  { value: 'old', label: 'Eski' },
]

const CreateStudentModal = observer(({ isOpen, onClose, onSubmit, dealGuid, canUpdateForms }) => {
  const [step, setStep] = useState('form') // 'form' | 'preview'
  const [isSaving, setIsSaving] = useState(false)
  const [contractTemplate, setContractTemplate] = useState('')
  const [openClassModal, setOpenClassModal] = useState(false)
  const [classModalMode, setClassModalMode] = useState('create') // 'create' | 'edit' | 'delete'
  const [editingClass, setEditingClass] = useState(null)
  const [classNameInput, setClassNameInput] = useState('')
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null)
  const [openGuardianModal, setOpenGuardianModal] = useState(false)
  const [guardianModalMode, setGuardianModalMode] = useState('create')
  const [editingGuardian, setEditingGuardian] = useState(null)
  const [guardianTypeInput, setGuardianTypeInput] = useState('')
  const [deleteGuardianItem, setDeleteGuardianItem] = useState(null)
  const branch = authStore.selectBranch
  const isEditing = dealGuid && !canUpdateForms

  const {
    data: initialData,
    isLoading,
  } = useUcodeRequestQuery({
    method: 'get_contract_with_counterparty',
    data: {
      guid: dealGuid,
    },
    querySetting: {
      enabled: !!dealGuid,
      staleTime: 0,
      cacheTime: 0,
      select: (res) => res?.data?.data
    },
  })

  const defaultValues = useMemo(() => {
    if (initialData && dealGuid) {
      return {
        contractNumber: initialData?.number_contract || '',
        contractDate: moment(initialData?.date_contract || today).format('YYYY-MM-DD'),
        guardianName: initialData?.full_name_guardian || '',
        branchName: branch?.name || '',
        guardianType: initialData?.type_guardian?.[0] || null,
        academicYear: initialData?.school_year,
        phone1: initialData?.first_phone_number || '',
        studentName: initialData?.counterparties_id_data?.nazvanie || '',
        phone2: initialData?.second_phone_number || '',
        passport: initialData?.number_passport || '',
        pinf: initialData?.jshshr_guardian || null,
        issuedBy: initialData?.place_of_issue || '',
        tariffName: initialData?.product_and_service_id?.name || '',
        birthDate: initialData?.birthday_pupil ? new Date(initialData.birthday_pupil) : today,
        validFrom: initialData?.the_contract_period_is_from ? new Date(initialData.the_contract_period_is_from) : today,
        gender: initialData?.select_gender?.[0] || '',
        validTo: initialData?.the_contract_period_is_to ? new Date(initialData.the_contract_period_is_to) : today,
        className: initialData?.classes_id_data?.name || '',
        clientType: initialData?.pupil_type?.[0] || '',
        language: initialData?.language_classes_id_data?.name || '',
        status: 'passive',
        address: initialData?.address || '',
        passiveDate: initialData?.passive_date ? new Date(initialData.passive_date) : today,
        counterparties_id: initialData?.counterparties_id || null,
        product_and_service_id: initialData?.product_and_service_id || null,
        chart_of_accounts_id: initialData?.chart_of_accounts_id || null,
        classes_id: initialData?.classes_id || null,
        language_classes_id: initialData?.language_classes_id || null,
        legal_entity_id: initialData?.legal_entity_id || null,
        monthlyPayment: ""
      }
    }
    return {
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
      status: 'active',
      address: '',
      passiveDate: today,
      counterparties_id: '',
      product_and_service_id: '',
      chart_of_accounts_id: '',
      classes_id: '',
      language_classes_id: '',
      legal_entity_id: '',
      monthlyPayment: ""
    }
  }, [initialData, dealGuid, branch?.name])

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: defaultValues,
    values: defaultValues
  })



  const { data: contract } = useQuery({
    queryKey: ['get_contract', authStore.branch_id],
    queryFn: () =>
      apiClient.defaultUcodeFunction({ urlMethod: 'GET', urlParams: `/items/templates?from-ofs=true` }),
    enabled: !!authStore.branch_id,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0,
    select: (data) => data?.data?.data?.response?.[0],
  })


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
    mutationFn: (data) => apiClient.invokeFunction({ method: isEditing ? 'update_contract_with_counterparty_passive' : 'create_contract_with_counterparty', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
      handleClose()
      reset()
    }
  })
  const { mutate: updateStudent, isPending: updateingStudent } = useMutation({
    mutationKey: ['update-student'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'update_contract_with_counterparty_file', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
      handleClose()
      reset()
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

  const { mutate: createClass, isPending: createClassPending } = useUcodeDefaultApiMutation()
  const { mutate: createGuardian, isPending: createGuardianPending } = useUcodeDefaultApiMutation()

  // Fetch guardian types
  const { data: guardianTypes } = useUcodeDefaultApiQuery({
    queryKey: 'guardian_types',
    urlMethod: 'GET',
    urlParams: '/items/guardian_type?from-ofs=true',
    querySetting: {
      select: (response) => response?.data?.data?.response,
      staleTime: 1000 * 60 * 60,
      placeholder: keepPreviousData
    }
  })

  const guardianTypeList = useMemo(() => {
    return guardianTypes?.map((item) => ({
      value: item.name,
      label: item.name,
      guid: item.guid
    })) || []
  }, [guardianTypes])

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
      label: item.name,
      guid: item.guid
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
    // Calculate contract duration and total payment
    const endDate = moment(values.validTo)

    // Get years and months difference
    const totalMonths = getMonthPeriods(values.validFrom, values.validTo)

    const monthlyAmount = formatNumber(values.monthlyPayment)

    // totalContractPayment = total months * monthly amount
    const totalContractPayment = (totalMonths.length * monthlyAmount).toLocaleString('ru-RU')

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
      yearlyPayment: totalContractPayment,
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
    if (initialData && !canUpdateForms) return initialData?.contract_file
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

    let contractFileLink = ''
    setIsSaving(true)


    let requestData = {}

    if (!isEditing) {
      const htmlContent = getContractHtml().replace(/\s*highlight\s*/g, ' ').replace(/\s+/g, ' ')
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
      } finally {
        setIsSaving(false)
      }

      requestData = {
        name: data.contractNumber || '',
        number_contract: data.contractNumber || '',
        school_year: data.academicYear,
        date_contract: moment(data.contractDate).format('YYYY-MM-DD'),
        deal_date: moment(data.contractDate).format('YYYY-MM-DD'),
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
    } else {
      requestData = {
        guid: initialData.guid,
        passive_date: moment(data.passiveDate).format('YYYY-MM-DD')
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

  const handleFormUpdateSubmit = async () => {
    let contractFileLink = ''

    try {
      // Generate new contract HTML with updated values
      const htmlContent = getContractHtml().replace(/\s*highlight\s*/g, ' ').replace(/\s+/g, ' ')

      // Step 1: Convert HTML to PDF
      const convertResponse = await fetch('https://api.admin.u-code.io/v2/html/convert?project-id=3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.authToken}`,
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
          'Authorization': `Bearer ${authStore.authToken}`,
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
      setIsSaving(false)
      return
    }

    const requestData = {
      guid: initialData?.guid,
      sales_transactions_id: initialData?.sales_transactions_id,
      file: contractFileLink,
    }

    updateStudent(requestData, {
      onSuccess: () => {
        showSuccessNotification('Договор успешно обновлен')
        setStep('form')
        onClose()
        handleClose()
      },
      onError: (error) => {
        showErrorNotification(error?.message || 'Ошибка при обновлении договора')
      }
    })

    setIsSaving(false)
  }

  const html = getContractHtml()

  const handleSaveClass = () => {
    if (!classNameInput.trim()) return

    if (classModalMode === 'create') {
      // POST - Create new
      createClass({
        urlMethod: 'POST',
        urlParams: '/items/classes',
        data: {
          name: classNameInput,
          branch_id: authStore.branch_id
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['classes'] })
          setOpenClassModal(false)
          setClassNameInput('')
          showSuccessNotification('Класс успешно создан')
        },
        onError: (error) => {
          showErrorNotification(error?.message || 'Ошибка при создании класса')
        }
      })
    } else if (classModalMode === 'edit' && editingClass) {
      // PUT - Update existing
      createClass({
        urlMethod: 'PUT',
        urlParams: `/items/classes/${editingClass.value}`,
        data: {
          name: classNameInput,
          branch_id: authStore.branch_id,
          guid: editingClass.guid
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['classes'] })
          setOpenClassModal(false)
          setEditingClass(null)
          setClassNameInput('')
          showSuccessNotification('Класс успешно обновлен')
        },
        onError: (error) => {
          showErrorNotification(error?.message || 'Ошибка при обновлении класса')
        }
      })
    }
  }

  const handleDeleteClass = () => {
    if (!deleteConfirmItem) return

    createClass({
      urlMethod: 'DELETE',
      urlParams: `/items/classes/${deleteConfirmItem.value}`,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] })
        setDeleteConfirmItem(null)
        showSuccessNotification('Класс успешно удален')
      },
      onError: (error) => {
        showErrorNotification(error?.message || 'Ошибка при удалении класса')
      }
    })
  }

  const openCreateModal = () => {
    setClassModalMode('create')
    setEditingClass(null)
    setClassNameInput('')
    setOpenClassModal(true)
  }

  const openEditModal = (item) => {
    setClassModalMode('edit')
    setEditingClass(item)
    setClassNameInput(item.label)
    setOpenClassModal(true)
  }

  const openDeleteModal = (item) => {
    setDeleteConfirmItem(item)
  }

  // Guardian type CRUD handlers
  const handleSaveGuardianType = () => {
    if (!guardianTypeInput.trim()) return

    if (guardianModalMode === 'create') {
      // POST - Create new
      createGuardian({
        urlMethod: 'POST',
        urlParams: '/items/guardian_type',
        data: {
          name: guardianTypeInput,
          branch_id: authStore.branch_id
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['guardian_types'] })
          setOpenGuardianModal(false)
          setGuardianTypeInput('')
          showSuccessNotification('Тип опекуна успешно создан')
        },
        onError: (error) => {
          showErrorNotification(error?.message || 'Ошибка при создании типа опекуна')
        }
      })
    } else if (guardianModalMode === 'edit' && editingGuardian) {
      // PUT - Update existing
      createGuardian({
        urlMethod: 'PUT',
        urlParams: `/items/guardian_type/${editingGuardian.value}`,
        data: {
          name: guardianTypeInput,
          branch_id: authStore.branch_id,
          guid: editingGuardian.guid
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['guardian_types'] })
          setOpenGuardianModal(false)
          setEditingGuardian(null)
          setGuardianTypeInput('')
          showSuccessNotification('Тип опекуна успешно обновлен')
        },
        onError: (error) => {
          showErrorNotification(error?.message || 'Ошибка при обновлении типа опекуна')
        }
      })
    }
  }

  const handleDeleteGuardianType = () => {
    if (!deleteGuardianItem) return

    createGuardian({
      urlMethod: 'DELETE',
      urlParams: `/items/guardian_type/${deleteGuardianItem.value}`,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['guardian_types'] })
        setDeleteGuardianItem(null)
        showSuccessNotification('Тип опекуна успешно удален')
      },
      onError: (error) => {
        showErrorNotification(error?.message || 'Ошибка при удалении типа опекуна')
      }
    })
  }

  const openCreateGuardianModal = () => {
    setGuardianModalMode('create')
    setEditingGuardian(null)
    setGuardianTypeInput('')
    setOpenGuardianModal(true)
  }

  const openEditGuardianModal = (item) => {
    setGuardianModalMode('edit')
    setEditingGuardian(item)
    setGuardianTypeInput(item.label)
    setOpenGuardianModal(true)
  }

  const openDeleteGuardianModal = (item) => {
    setDeleteGuardianItem(item)
  }


  return (
    <>
      <CustomDialog
        contentClass={`h-[80vh] ${step === 'preview' ? 'min-w-[900px]!' : 'min-w-[1000px]!'} p-0 overflow-hidden flex flex-col`}
        open={isOpen}
        onClose={handleClose}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-4">
          <h2 className="text-lg font-bold text-gray-900 font-sans">
            {step === 'form' ? (initialData ? 'Редактирование продажи' : 'Новая продажа') : 'Предварительный просмотр договора'}
          </h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader />
          </div>
        ) :
          <>
            {step === 'form' ? (
              <>
                {/* Scrollable Form */}
                <div className="flex-1 overflow-auto p-4">
                  <form id="student-form" onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-3 gap-3">
                    <fieldset className="contents">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Номер договора *</label>
                        <Input
                          placeholder="Введите номер договора"
                          error={!!errors.contractNumber}
                          {...register('contractNumber', { required: 'Введите номер договора' })}
                          disabled={isEditing}
                        />
                        {/* {errors.contractNumber && <span className="text-xs text-red-500">{errors.contractNumber.message}</span>} */}
                      </div>
                      {/* Row 1 */}
                      <div className="flex flex-col gap-1.5 focus-within:text-blue-600">
                        <label className="text-xs font-medium text-gray-700">Дата договора *</label>
                        <Controller
                          name="contractDate"
                          control={control}
                          rules={{ required: isEditing ? false : 'Выберите дату договора' }}
                          render={({ field }) => {
                            return <FormDatepicker
                              value={field.value}
                              onChange={field.onChange}
                              format='YYYY-MM-DD'
                              placeholder="Выберите дату"
                              className={'w-full!'}
                              inputClass={'bg-white!'}
                              disabled={isEditing}
                            />
                          }}
                        />
                        {/* {errors.contractDate && <span className="text-xs text-red-500">{errors.contractDate.message}</span>} */}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Ф.И.О. опекуна *</label>
                        <Input
                          placeholder="Введите Ф.И.О. опекуна"
                          error={!!errors.guardianName}
                          {...register('guardianName', { required: !isEditing ? 'Введите Ф.И.О. опекуна' : false })}
                          disabled={isEditing}
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
                              disabled
                            />
                          )}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Выберите тип опекуна *</label>
                        <Controller
                          name="guardianType"
                          control={control}
                          rules={{ required: !isEditing ? 'Выберите тип опекуна' : false }}
                          render={({ field }) => (
                            <SingleSelect
                              placeholder="Выберите тип опекуна"
                              value={field.value}
                              customButton={<div onClick={openCreateGuardianModal} className='flex cursor-pointer items-center gap-2 px-3 py-2'>
                                <span className='text-sm text-primary'>Добавить тип опекуна</span>
                              </div>}
                              onChange={field.onChange}
                              elementAfter={(item) => (
                                <div className='flex items-center gap-2'>
                                  <Edit2 size={18} className='cursor-pointer hover:text-blue-600' onClick={() => openEditGuardianModal(item)} />
                                  <Trash2 size={18} className='text-red-500 cursor-pointer hover:text-red-700' onClick={() => openDeleteGuardianModal(item)} />
                                </div>
                              )}

                              data={guardianTypeList}
                              className='bg-white'
                              isClearable={false}
                              disabled={isEditing}
                            />
                          )}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Выберите учебный год *</label>
                        <Controller
                          name="academicYear"
                          control={control}
                          rules={{ required: !isEditing ? 'Выберите учебный год' : false }}
                          render={({ field }) => (
                            <SingleSelect
                              placeholder="Выберите учебный год"
                              value={field.value}
                              onChange={field.onChange}
                              data={academicYears}
                              className='bg-white'
                              isClearable={false}
                              disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Введите номер телефона' : false }}
                          render={({ field }) => (
                            <div className="flex">
                              <input
                                type="text"
                                placeholder="XX XXX XX XX"
                                value={field.value}
                                disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Выберите ученика' : false }}
                          render={({ field }) => (
                            <SingleCounterParty
                              placeholder="Введите Ф.И.О. ученика"
                              value={field.value}
                              name='nazvanie'
                              returnChartOfAccount={(value) => setValue('studentName', value)}
                              onChange={field.onChange}
                              className={'bg-white'}
                              isClearable={false}
                              disabled={isEditing}
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
                                disabled={isEditing}
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
                          {...register('passport', { required: !isEditing ? 'Введите серию и номер паспорта' : false })}
                          disabled={isEditing}
                        />
                        {/* {errors.passport && <span className="text-xs text-red-500">{errors.passport.message}</span>} */}
                      </div>

                      {/* Row 4 */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">ПИНФЛ опекуна *</label>
                        <Input
                          placeholder="Введите ПИНФЛ опекуна"
                          maxLength={14}
                          disabled={isEditing}
                          error={!!errors.pinf}
                          {...register('pinf', {
                            required: !isEditing ? 'Введите ПИНФЛ опекуна' : false,
                            pattern: { value: /^\d{14}$/, message: 'ПИНФЛ должен содержать 14 цифр' }
                          })}
                        />
                        {/* {errors.pinf && <span className="text-xs text-red-500">{errors.pinf.message}</span>} */}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Место выдачи *</label>
                        <Input
                          placeholder="Введите место выдачи"
                          disabled={isEditing}
                          error={!!errors.issuedBy}
                          {...register('issuedBy', { required: !isEditing ? 'Введите место выдачи' : false })}
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
                              disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Выберите дату рождения' : false }}
                          render={({ field }) => (
                            <FormDatepicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Выберите дату"
                              format='YYYY-MM-DD'
                              className={'w-full!'}
                              inputClass={'bg-white!'}
                              disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Выберите дату начала' : false }}
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
                              inputClass={'bg-white!'}
                              disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Выберите пол' : false }}
                          render={({ field }) => (
                            <SingleSelect
                              placeholder="Выберите пол"
                              value={field.value}
                              onChange={field.onChange}
                              data={[{ value: 'male', label: 'Мужской' }, { value: 'female', label: 'Женский' }]}
                              className='bg-white'
                              isClearable={false}
                              disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Выберите дату окончания' : false }}
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
                              inputClass={'bg-white!'}
                              disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Выберите класс' : false }}
                          render={({ field }) => (
                            <SingleSelect
                              placeholder="Введите класс"
                              value={field.value}
                              customButton={<div onClick={openCreateModal} className='flex cursor-pointer items-center gap-2 px-3 py-2'>
                                <span className='text-sm text-primary'>Добавить класс</span>
                              </div>}
                              onChange={(value) => {
                                field.onChange(value)
                                const name = clasess.find(l => l.guid === value)?.name
                                setValue('className', name)
                              }}
                              elementAfter={(item) => (
                                <div className='flex items-center gap-2'>
                                  <Edit2 size={18} className='cursor-pointer hover:text-blue-600' onClick={() => openEditModal(item)} />
                                  <Trash2 size={18} className='text-red-500 cursor-pointer hover:text-red-700' onClick={() => openDeleteModal(item)} />
                                </div>
                              )}
                              data={classeList}
                              isClearable={false}
                              className='bg-white'
                              disabled={isEditing}
                            />
                          )}
                        />
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
                              disabled={isEditing}
                            />
                          )}
                        />
                      </div>

                    </fieldset>

                    {/* Row 7 */}
                    {isEditing && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Пассивная дата *</label>
                        <Controller
                          name="passiveDate"
                          control={control}
                          rules={{ required: 'Выберите пассивную дату' }}
                          render={({ field }) => (
                            <FormDatepicker
                              value={field.value}
                              onChange={field.onChange}
                              minDate={new Date(defaultValues.validFrom)}
                              maxDate={new Date(defaultValues.validTo)}
                              placeholder="Выберите дату"
                              format='YYYY-MM-DD'
                              className={'w-full! bg-white px-2  py-1 border border-gray-ucode-200!'}
                              inputClass={`bg-white! ${errors?.passiveDate?.message && ' border border-red-ucode!'}`}
                            />
                          )}
                        />
                      </div>
                    )}

                    <fieldset disabled className="contents pointer-events-none opacity-70">
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
                              disabled={isEditing}
                            />
                          )}
                        />
                      </div>
                    </fieldset>

                    <fieldset disabled={isEditing} className={`contents ${isEditing ? 'pointer-events-none opacity-70' : ''}`}>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Адрес *</label>
                        <Input
                          placeholder="Адрес"
                          error={!!errors.address}
                          disabled={isEditing}
                          {...register('address', { required: !isEditing ? 'Введите адрес' : false })}
                        />
                        {/* {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>} */}
                      </div>

                      {/* Row 8 */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Выберите язык *</label>
                        <Controller
                          name="language_classes_id"
                          control={control}
                          rules={{ required: !isEditing ? 'Выберите язык' : false }}
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
                              disabled={isEditing}
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
                              disabled={isEditing}
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
                          rules={{ required: !isEditing ? 'Выберите юрлицо' : false }}
                          render={({ field }) => (
                            <SelectLegelEntitties
                              value={field.value}
                              onChange={field.onChange}
                              placeholder='Выберите юрлицо'
                              className=' bg-white'
                              isClearable={false}
                              disabled={isEditing}
                            />
                          )}
                        />
                        {/* {errors.legal_entity_id && <span className="text-xs text-red-500">{errors.legal_entity_id.message}</span>} */}
                      </div>
                    </fieldset>
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
                    {isSubmitting || isPending ? 'Сохранение...' : isEditing ? 'Обновить' : 'Добавить'}
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
                  <div className="flex items-center justify-between gap-3 p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button
                      type="button"
                      onClick={handleFormUpdateSubmit}
                      className="px-5 py-2 hover:border hover:border-gray-400 cursor-pointer rounded-md text-sm font-medium text-gray-700  hover:bg-gray-50 transition-colors"
                    >
                      &nbsp; {updateingStudent && <Loader2 className="animate-spin" />}
                    </button>
                    <div className="flex items-center gap-2">
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
                        className="px-5 py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                      {isSubmitting || isPending ? 'Сохранение...' : isEditing ? 'Обновить' : 'Добавить'}
                      </button>
                    </div>
                </div>
              </>
            )}
          </>}
      </CustomDialog>

      {/* Class Create/Edit Modal */}
      <CustomDialog
        open={openClassModal}
        onClose={() => setOpenClassModal(false)}
        contentClass="min-w-[400px] p-6"
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {classModalMode === 'create' ? 'Создать класс' : 'Редактировать класс'}
          </h3>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Название класса</label>
            <Input
              value={classNameInput}
              onChange={(e) => setClassNameInput(e.target.value)}
              placeholder="Введите название класса"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpenClassModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveClass}
              disabled={!classNameInput.trim()}
              className="px-4 py-2 bg-blue-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {classModalMode === 'create' ? 'Создать' : 'Сохранить'}
              {createClassPending && <Loader />}
            </button>
          </div>
        </div>
      </CustomDialog>

      {/* Delete Confirmation Modal */}
      <CustomDialog
        open={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        contentClass="min-w-[400px] p-6"
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Подтверждение удаления</h3>
          <p className="text-sm text-gray-600">
            Вы уверены, что хотите удалить класс &quot;{deleteConfirmItem?.label}&quot;?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmItem(null)}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDeleteClass}
              className="px-4 py-2 bg-red-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-red-700"
            >
              Удалить
              {createClassPending && <Loader />}
            </button>
          </div>
        </div>
      </CustomDialog>

      {/* Guardian Type Create/Edit Modal */}
      <CustomDialog
        open={openGuardianModal}
        onClose={() => setOpenGuardianModal(false)}
        contentClass="min-w-[400px] p-6"
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {guardianModalMode === 'create' ? 'Создать тип опекуна' : 'Редактировать тип опекуна'}
          </h3>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Название типа опекуна</label>
            <Input
              value={guardianTypeInput}
              onChange={(e) => setGuardianTypeInput(e.target.value)}
              placeholder="Введите название типа опекуна"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpenGuardianModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveGuardianType}
              disabled={!guardianTypeInput.trim()}
              className="px-4 py-2 bg-blue-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {guardianModalMode === 'create' ? 'Создать' : 'Сохранить'}
              {createGuardianPending && <Loader />}
            </button>
          </div>
        </div>
      </CustomDialog>

      {/* Guardian Type Delete Confirmation Modal */}
      <CustomDialog
        open={!!deleteGuardianItem}
        onClose={() => setDeleteGuardianItem(null)}
        contentClass="min-w-[400px] p-6"
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Подтверждение удаления</h3>
          <p className="text-sm text-gray-600">
            Вы уверены, что хотите удалить тип опекуна &quot;{deleteGuardianItem?.label}&quot;?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteGuardianItem(null)}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDeleteGuardianType}
              className="px-4 py-2 bg-red-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-red-700"
            >
              Удалить
              {createGuardianPending && <Loader />}
            </button>
          </div>
        </div>
      </CustomDialog>
    </>
  )
})

export default CreateStudentModal




