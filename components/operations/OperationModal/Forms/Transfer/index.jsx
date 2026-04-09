'use client'
import React, { useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { cn } from '@/app/lib/utils'

// Hooks
import { useBankAccountsPlanFact, useUcodeRequestMutation } from '../../../../../hooks/useDashboard'

// Helpers
import { formatDate, isFuture } from '@/utils/formatDate'
import { StringtoNumber } from '@/utils/helpers'

// Components
import CustomDatePicker from '../../../../shared/DatePicker'
import Input from '../../../../shared/Input'
import TextArea from '../../../../shared/TextArea'
import OperationCheckbox from '../../../../shared/Checkbox/operationCheckbox'
import SelectMyAccounts from '../../../../ReadyComponents/SelectMyAccounts'

import { observer } from 'mobx-react-lite'
import { authStore } from '../../../../../store/auth.store'
import { queryClient } from '../../../../../lib/queryClient'
import { Loader2 } from 'lucide-react'
import { appStore } from '../../../../../store/app.store'
import { toJS } from 'mobx'
import { formatDecimal, formatNumber } from '../../../../../utils/helpers'

const TransferForm = observer(({ initialData, onClose }) => {
	const [title, setTitle] = useState({
		currency_1: '',
		currency_2: '',
	})
	const { data: bankAccountsData } = useBankAccountsPlanFact({ limit: 1000 })
	const bankAccounts = useMemo(() => bankAccountsData?.data?.data?.data || [], [bankAccountsData])

	// Form State
	const isNew = initialData?.isNew
	const defaultValues = useMemo(() => {
		if (initialData && (!isNew || initialData.isCopy)) {
			const raw = initialData
			const fromDate = raw.data_operatsii ? formatDate(raw.data_operatsii) : formatDate(new Date())
			const toDate = raw.data_nachisleniya ? formatDate(raw.data_nachisleniya) : fromDate

			return {
				fromDate,
				confirmPayment:
					raw.payment_confirmed !== undefined ? raw.payment_confirmed : !!raw.oplata_podtverzhdena,
				fromAccount: raw.my_accounts_id || null,
				fromAmount: raw.summa ? Math.abs(raw.summa) : 0,
				toDate,
				toAccount: raw.my_accounts_id_2 || raw.bank_accounts_id_2 || null,
				toAmount: raw.to_amount || (raw.summa ? Math.abs(raw.summa) : 0),
				purpose: raw.opisanie || raw.comment || '',
				currency_1: raw.currenies_id || null,
				currency_2: raw.to_currenies_id || null,
			}
		}

		return {
			fromDate: formatDate(new Date()),
			confirmPayment: true,
			fromAccount: null,
			fromAmount: '',
			toDate: formatDate(new Date()),
			toAccount: null,
			toAmount: '',
			purpose: '',
			currency_1: null,
			currency_2: null,
		}
	}, [initialData, isNew])

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		defaultValues,
	})

	const { mutateAsync: createOperation, isPending } = useUcodeRequestMutation()

	const watchFromAccount = watch('fromAccount')
	const watchToAccount = watch('toAccount')
	const watchFromDate = watch('fromDate')
	const watchCurrency1 = watch('currency_1')
	const watchCurrency2 = watch('currency_2')
	const isSameCurrency = useMemo(() => {
		if (!watchFromAccount || !watchToAccount) return false
		return watchCurrency1 && watchCurrency2 && watchCurrency1 === watchCurrency2
	}, [watchFromAccount, watchToAccount, bankAccounts])

	const onSubmit = async data => {
		const payload = {
			tip: ['Перемещение'],
			summa: formatDecimal(StringtoNumber(data.fromAmount)),
			data_operatsii: data.fromDate,
			data_nachisleniya: data.toDate,
			payment_confirmed: data.confirmPayment,
			payment_accrual: false,
			my_accounts_id: data.fromAccount,
			my_accounts_id_2: data.toAccount,
			opisanie: data.purpose,
			comment: data.purpose,
			legal_entity_id: authStore.userData?.legal_entity_id || null,
			to_amount: formatDecimal(StringtoNumber(data.toAmount || data.fromAmount)),
			currenies_id: watchCurrency1,
			to_currenies_id: watchCurrency2,
		}

		// console.log('payload', payload)

		if (!isSameCurrency) {
			payload.to_amount = StringtoNumber(data.toAmount)
		} else {
			payload.to_amount = StringtoNumber(data.fromAmount)
		}

		if (!isNew) {
			payload.guid = initialData.guid
		}

		try {
			await createOperation({
				method: isNew ? 'create_operation' : 'update_operation',
				data: payload,
			})
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
			queryClient.invalidateQueries({ queryKey: ['operationsList'] })
			queryClient.invalidateQueries({ queryKey: ['operations'] })
			queryClient.invalidateQueries({ queryKey: ['find_operations'] })
			queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
			queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
			queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })
			queryClient.invalidateQueries({ queryKey: ['legal_entities'] })
			queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
			onClose?.()
		} catch (error) {
			console.error('TransferForm onSubmit error', error)
		}
	}

	const handleSelectMyAccount = (type, value) => {
		setValue(type, value)
		const selected = toJS(appStore.currencies).find(c => c.guid === value)
		setTitle(prev => ({
			...prev,
			[type]: `${selected.kod} ${selected.nazvanie}`,
		}))
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='flex flex-1 flex-col h-full overflow-hidden text-slate-900'
		>
			<div className='flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-5'>
				{/* SECTION: ОТКУДА */}
				<div className='flex flex-col gap-5'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='flex-1 h-px bg-gray-200'></div>
						<h3 className='text-[11px] font-semibold text-gray-400 uppercase whitespace-nowrap tracking-wider'>
							ОТКУДА
						</h3>
						<div className='flex-1 h-px bg-gray-200'></div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss!'>Дата оплаты</label>
						<div className='flex-1 flex gap-2 max-w-[600px]'>
							<Controller
								name='fromDate'
								control={control}
								render={({ field }) => (
									<CustomDatePicker
										value={field.value}
										onChange={val => {
											field.onChange(val)
											setValue('confirmPayment', !isFuture(val))
										}}
										placeholder='Выберите дату'
										format='YYYY-MM-DD'
										className={cn('w-[180px]!', errors.fromDate && 'border-red-500')}
									/>
								)}
							/>
							<Controller
								name='confirmPayment'
								control={control}
								render={({ field }) => (
									<OperationCheckbox
										checked={field.value}
										label='Подтвердить оплату'
										onChange={e => {
											if (isFuture(watchFromDate)) return
											field.onChange(e.target.checked)
										}}
									/>
								)}
							/>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss'>
							Счет и юрлицо <span className='text-red-500 ml-0.5'>*</span>
						</label>
						<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
							<Controller
								name='fromAccount'
								control={control}
								rules={{ required: 'Выберите счет списания' }}
								render={({ field }) => (
									<SelectMyAccounts
										value={field.value}
										selected={watchToAccount}
										onChange={value => {
											field.onChange(value)
											setTitle(prev => ({ ...prev, currency_1: '' }))
										}}
										multi={false}
										type='show'
										extraValue='currenies_id'
										returnValue={value => handleSelectMyAccount('currency_1', value)}
										placeholder='Юрлица и счета'
										className='bg-white border rounded-md h-[36px]!'
										hasError={errors.fromAccount}
									/>
								)}
							/>
							{errors.fromAccount && (
								<span className='text-xs text-red-500'>{errors.fromAccount.message}</span>
							)}
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss'>Сумма списания</label>
						<div className='flex-1 max-w-[600px]'>
							<div className='flex items-center'>
								<Controller
									name='fromAmount'
									control={control}
									render={({ field }) => (
										<Input
											type='text'
											value={formatNumber(field.value)}
											onChange={e => field.onChange(formatNumber(e.target.value))}
											placeholder='0'
											className={cn('w-56', errors.fromAmount && 'border - red - 500')}
										/>
									)}
								/>
								{title.currency_1 && (
									<span className='text-sm font-medium whitespace-nowrap flex-1 text-gray-800 line-clamp-1'>
										{title.currency_1}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* SECTION: КУДА */}
				<div className='flex flex-col gap-5 mt-4'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='flex-1 h-px bg-gray-200'></div>
						<h3 className='text-[11px] font-semibold text-gray-400 uppercase whitespace-nowrap tracking-wider'>
							КУДА
						</h3>
						<div className='flex-1 h-px bg-gray-200'></div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss!'>Дата</label>
						<div className='flex-1 max-w-[600px]'>
							<Controller
								name='toDate'
								control={control}
								render={({ field }) => (
									<CustomDatePicker
										value={field.value}
										onChange={field.onChange}
										placeholder='Выберите дату'
										format='YYYY-MM-DD'
										className={cn('w-[180px]!', errors.toDate && 'border-red-500')}
									/>
								)}
							/>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss'>
							Счет и юрлицо <span className='text-red-500 ml-0.5'>*</span>
						</label>
						<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
							<Controller
								name='toAccount'
								control={control}
								rules={{ required: 'Выберите счет зачисления' }}
								render={({ field }) => (
									<SelectMyAccounts
										value={field.value}
										selected={watchFromAccount}
										onChange={value => {
											field.onChange(value)
											setTitle(prev => ({ ...prev, currency_2: '' }))
										}}
										multi={false}
										type='show'
										extraValue='currenies_id'
										returnValue={value => handleSelectMyAccount('currency_2', value)}
										placeholder='Юрлица и счета'
										className='bg-white border rounded-md h-[36px]!'
										hasError={errors.toAccount}
									/>
								)}
							/>
							{errors.toAccount && (
								<span className='text-xs text-red-500'>{errors.toAccount.message}</span>
							)}
						</div>
					</div>

					{!isSameCurrency && (
						<div className='flex items-center gap-4'>
							<label className='w-[150px] text-xss'>
								Сумма зачисления <span className='text-red-500 ml-0.5'>*</span>
							</label>
							<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
								<div className='flex items-center'>
									<Controller
										name='toAmount'
										control={control}
										rules={{ required: 'Укажите сумму зачисления' }}
										render={({ field }) => (
											<Input
												type='text'
												value={formatNumber(field.value)}
												onChange={e => field.onChange(formatNumber(e.target.value))}
												placeholder='0'
												className={cn('w-56', errors.toAmount && 'border-red-500')}
											/>
										)}
									/>
									<span className='text-sm font-medium whitespace-nowrap flex-1 text-gray-800 line-clamp-1'>
										{title.currency_2}
									</span>
								</div>
								{errors.toAmount && (
									<span className='text-xs text-red-500'>{errors.toAmount.message}</span>
								)}
							</div>
						</div>
					)}

					<div className='flex items-start gap-4'>
						<label className='w-[150px] text-xss pt-2'>
							Назначение платежа <span className='text-red-500 ml-0.5'>*</span>
						</label>
						<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
							<Controller
								name='purpose'
								control={control}
								rules={{ required: 'Введите назначение платежа' }}
								render={({ field }) => (
									<TextArea
										value={field.value}
										onChange={field.onChange}
										placeholder='Назначение платежа'
										rows={3}
										className={cn(
											'border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F51B9] focus:border-[#0F51B9]',
										)}
										hasError={!!errors.purpose}
									/>
								)}
							/>
							{errors.purpose && (
								<span className='text-xs text-red-500'>{errors.purpose.message}</span>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className='flex border-t justify-end gap-2 px-3 pt-3 mt-auto bg-white'>
				<button type='button' onClick={() => onClose?.()} className='secondary-btn py-2!'>
					Отмена
				</button>
				<button type='submit' className='primary-btn py-2!'>
					{isPending ? <Loader2 className='animate-spin' /> : 'Сохранить'}
				</button>
			</div>
		</form>
	)
})

export default TransferForm