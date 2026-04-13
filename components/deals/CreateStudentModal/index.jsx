'use client'

import { getSergeliContractHtml } from '@/constants/sergeli-contract'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import CustomModal from '../../shared/CustomModal'
import CustomDatePicker from '../../shared/DatePicker'
import Input from '../../shared/Input'
import SingleSelect from '../../shared/Selects/SingleSelect'

const academicYears = Array.from({ length: 16 }, (_, i) => {
  const start = 2025 + i
  return { value: `${start}-${start + 1}`, label: `${start}-${start + 1}` }
})

const classOptions = Array.from({ length: 11 }, (_, i) => {
  const num = i + 1
  return { value: String(num), label: `${num}-sinf` }
}).flatMap((cls) => ['A', 'B', 'C', 'D'].map((letter) => ({
  value: `${cls.value} ${letter}`,
  label: `${cls.value.replace('-sinf', '')} ${letter}`,
})))

const languageOptions = [
  { value: 'uz', label: "O'zbek tili" },
  { value: 'eng', label: 'Engliz tili' },
  { value: 'ru', label: 'Rus tili' },
]

const languageLabelMap = {
  uz: "O'zbek tili",
  eng: 'Engliz tili',
  ru: 'Rus tili',
}

const sostayaniya = [
  { value: 'active', label: 'Faol' },
  { value: 'passive', label: 'Passiv' },
]

const clientType = [
  { value: 'new', label: 'Yangi' },
  { value: 'old', label: 'Eski' },
]

const CreateStudentModal = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState('form') // 'form' | 'preview'
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      contractDate: '',
      guardianName: '',
      branchName: '',
      guardianType: '',
      academicYear: '',
      phone1: '',
      studentName: '',
      phone2: '',
      passport: '',
      pinf: '',
      issuedBy: '',
      tariffName: '',
      birthDate: '',
      validFrom: '',
      gender: '',
      validTo: '',
      className: '',
      clientType: '',
      language: '',
      status: '',
      address: '',
      passiveDate: '',
      thirdPartyName: '',
      thirdPartyPinfl: ''
    }
  })

  const handleFormSubmit = (data) => {
    onSubmit?.(data)
  }

  const handlePreview = () => {
    setStep('preview')
  }

  const handleBackToForm = () => {
    setStep('form')
  }

  const getContractData = () => {
    const values = getValues()
    return {
      contractNumber: '___',
      contractDate: values.contractDate || '____-__-__',
      academicYear: values.academicYear || '2025-2026',
      guardianName: values.guardianName || '________________________',
      studentName: values.studentName || '________________________',
      className: values.className || '___',
      language: languageLabelMap[values.language] || "O'zbek tili",
      validFrom: values.validFrom || '____-__-__',
      validTo: values.validTo || '____-__-__',
      monthlyPayment: '3,600,000',
      guardianPassport: values.passport || '________________________',
      guardianPassportIssuedBy: values.issuedBy || '________________________',
      guardianPhone1: values.phone1 ? `+998${values.phone1}` : '________________________',
      guardianPhone2: values.phone2 ? `+998${values.phone2}` : '________________________',
      guardianAddress: values.address || '________________________',
      guardianPinfl: values.pinf || '________________________',
      thirdPartyName: values.guardianName || '________________________',
      thirdPartyPinfl: values.pinf || '________________________',
    }
  }

  const handleClose = () => {
    setStep('form')
    onClose()
  }

  return (
    <CustomModal
      className={`h-[80vh] ${step === 'preview' ? 'w-[900px]' : 'w-[1200px]'} p-0 overflow-hidden flex flex-col`}
      isOpen={isOpen}
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
              {/* Row 1 */}
              <div className="flex flex-col gap-1.5 focus-within:text-blue-600">
                <label className="text-xs font-medium text-gray-700">Дата договора</label>
                <Controller
                  name="contractDate"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите дату"
                      className={'w-full!'}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Ф.И.О. опекуна</label>
                <Input
                  placeholder="Введите Ф.И.О. опекуна"
                  {...register('guardianName')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Название филиала</label>
                <Controller
                  name="branchName"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Введите название филиала"
                      value={field.value}
                      onChange={field.onChange}
                      data={[]}
                      className='bg-white'
                      withSearch={false}
                    />
                  )}
                />
              </div>

              {/* Row 2 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите тип опекуна</label>
                <Controller
                  name="guardianType"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите тип опекуна"
                      value={field.value}
                      onChange={field.onChange}
                      data={[]}
                      className='bg-white'
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите учебный год</label>
                <Controller
                  name="academicYear"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите учебный год"
                      value={field.value}
                      onChange={field.onChange}
                      data={academicYears}
                      className='bg-white'
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Телефон 1</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm rounded-l-md font-sans">+998</span>
                  <input
                    type="text"
                    placeholder="Введите номер"
                    {...register('phone1')}
                    className="w-full h-[36px] px-3 border border-gray-200 rounded-r-md outline-none text-sm focus:border-cyan-500 font-sans"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Ф.И.О. ученика</label>
                <Input
                  placeholder="Введите Ф.И.О. ученика"
                  {...register('studentName')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Телефон 2</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm rounded-l-md font-sans">+998</span>
                  <input
                    type="text"
                    placeholder="Введите номер"
                    {...register('phone2')}
                    className="w-full h-[36px] px-3 border border-gray-200 rounded-r-md outline-none text-sm focus:border-cyan-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Серия и номер паспорта</label>
                <Input
                  placeholder="Введите серию и номер паспорта"
                  {...register('passport')}
                />
              </div>

              {/* Row 4 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">ПИНФЛ опекуна</label>
                <Input
                  placeholder="Введите ПИНФЛ опекуна"
                  {...register('pinf')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Место выдачи</label>
                <Input
                  placeholder="Введите место выдачи"
                  {...register('issuedBy')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Название тарифа</label>
                <Input
                  placeholder="Введите название тарифа"
                  {...register('tariffName')}
                />
              </div>

              {/* Row 5 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Дата рождения ученика</label>
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите дату"
                      className={'w-full!'}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Срок действия договора от</label>
                <Controller
                  name="validFrom"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите дату"
                      className={'w-full!'}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите пол</label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите пол"
                      value={field.value}
                      onChange={field.onChange}
                      data={[{ value: 'm', label: 'Мужской' }, { value: 'f', label: 'Женский' }]}
                      className='bg-white'
                    />
                  )}
                />
              </div>

              {/* Row 6 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Срок действия договора до</label>
                <Controller
                  name="validTo"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите дату"
                      className={'w-full!'}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Введите класс</label>
                <Controller
                  name="className"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Введите класс"
                      value={field.value}
                      onChange={field.onChange}
                      data={classOptions}
                      className='bg-white'
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
                    />
                  )}
                />
              </div>

              {/* Row 7 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Выберите язык</label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder="Выберите язык"
                      value={field.value}
                      onChange={field.onChange}
                      data={languageOptions}
                      className='bg-white'
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
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Адрес</label>
                <Input
                  placeholder="Адрес"
                  {...register('address')}
                />
              </div>

              {/* Row 8 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Пассивная дата</label>
                <Controller
                  name="passiveDate"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите дату"
                      className={'w-full!'}
                    />
                  )}
                />
              </div>

              {/* Uchinchi shaxs section */}
              {/* <div className="col-span-3 mt-4 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Uchinchi shaxs</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-700">Fuqaro (Ф.И.О.)</label>
                    <Input
                      placeholder="Введите Ф.И.О."
                      {...register('thirdPartyName')}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-700">ПИНФЛ</label>
                    <Input
                      placeholder="Введите ПИНФЛ"
                      {...register('thirdPartyPinfl')}
                    />
                  </div>
                </div>
              </div> */}
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
            <button type="button" className="px-5 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors" onClick={handleClose}>
              Отменить
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Предпросмотр
            </button>
            <button
              type="submit"
              form="student-form"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Contract Preview */}
          <div className="flex-1 overflow-hidden">
            <iframe
              srcDoc={getSergeliContractHtml(getContractData())}
              className="w-full h-full border-0"
              title="Предпросмотр договора"
            />
            </div>

            {/* Preview Footer */}
            <div className="flex items-center justify-end gap-3 p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                type="button"
                onClick={handleBackToForm}
                className="px-5 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Назад к форме
              </button>
              <button
                type="button"
                onClick={() => {
                  const iframe = document.querySelector('iframe[title="Предпросмотр договора"]')
                  if (iframe) iframe.contentWindow.print()
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Печать
              </button>
              <button
                type="submit"
                form="student-form"
                disabled={isSubmitting}
                onClick={handleSubmit(handleFormSubmit)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
        </>
      )}
    </CustomModal>
  )
}

export default CreateStudentModal
