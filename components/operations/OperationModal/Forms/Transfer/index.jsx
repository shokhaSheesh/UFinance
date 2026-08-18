'use client'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

// Hooks
import { useBankAccountsPlanFact, useUcodeRequestMutation } from '../../../../../hooks/useDashboard'

// Helpers
import { isFuture } from '@/utils/formatDate'
import { refreshOperationsListAfterSave } from '@/utils/operationsCache'
import { formatDateParseZone, StringtoNumber } from '@/utils/helpers'

// Components
import SelectMyAccounts from '../../../../ReadyComponents/SelectMyAccounts'
import OperationCheckbox from '../../../../shared/Checkbox/operationCheckbox'
import Input from '../../../../shared/Input'
import TextArea from '../../../../shared/TextArea'

import { Loader2 } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { WarnIcon } from '../../../../../constants/icons'
import { queryClient } from '../../../../../lib/queryClient'
import { appStore } from '../../../../../store/app.store'
import { authStore } from '../../../../../store/auth.store'
import { isPastDate } from '../../../../../utils/formatDate'
import { formatDecimal, formatAmountInput } from '../../../../../utils/helpers'
import FormDatepicker from '../../../../shared/DatePicker/form-datepicker'

// Helper to update find_operations infinite query cache
const updateOperationsCache = (updatedOperation) => {
	queryClient.setQueriesData({ queryKey: ['find_operations'] }, (oldData) => {
		if (!oldData) return oldData

		const operationGuid = updatedOperation.guid || updatedOperation.id
		if (!operationGuid) return oldData

		return {
			...oldData,
			pages: oldData.pages.map(page => ({
				...page,
				data: {
					...page.data,
					data: page.data.data.map(op =>
						(op.guid === operationGuid || op.id === operationGuid)
							? { ...op, ...updatedOperation }
							: op
					)
				}
			}))
		}
	})
}

const TransferForm = observer(({ initialData, onClose, onSuccess }) => {
	const t = useTranslations('Operations.forms')
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
			const fromDate = raw.data_operatsii ? formatDateParseZone(raw.data_operatsii) : moment(new Date()).format('YYYY-MM-DD')
			const toDate = raw.data_nachisleniya ? formatDateParseZone(raw.data_nachisleniya) : fromDate

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
				currency_1: raw.currenies_id || raw.currencyId || null,
				currency_2: raw.to_currenies_id || null,
			}
		}

		return {
			fromDate: moment(new Date()).format('YYYY-MM-DD'),
			confirmPayment: true,
			fromAccount: null,
			fromAmount: '',
			toDate: moment(new Date()).format('YYYY-MM-DD'),
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
	const watchConfirmPayment = watch('confirmPayment')
	const watchToAccount = watch('toAccount')
	const watchFromDate = watch('fromDate')
	const watchCurrency1 = watch('currency_1')
	const watchCurrency2 = watch('currency_2')

	const currencyTitle1 = useMemo(() => {
		const guid = watchCurrency1 || (initialData && (!isNew || initialData.isCopy) ? (initialData.currenies_id || initialData.currencyId) : null)
		if (!guid) return ''
		const selected = toJS(appStore.currencies)?.find(c => c.guid === guid)
		return selected ? `${selected?.kod} ${selected.nazvanie}` : ''
	}, [watchCurrency1, initialData, isNew, appStore.currencies])

	const currencyTitle2 = useMemo(() => {
		const guid = watchCurrency2 || (initialData && (!isNew || initialData.isCopy) ? initialData.to_currenies_id : null)
		if (!guid) return ''
		const selected = toJS(appStore.currencies)?.find(c => c.guid === guid)
		return selected ? `${selected?.kod} ${selected.nazvanie}` : ''
	}, [watchCurrency2, initialData, isNew, appStore.currencies])

	const isSameCurrency = useMemo(() => {
		if (!watchFromAccount || !watchToAccount) return false
		return watchCurrency1 && watchCurrency2 && watchCurrency1 === watchCurrency2
	}, [watchFromAccount, watchToAccount, watchCurrency1, watchCurrency2])

	const onSubmit = async data => {
		const payload = {
			tip: ['Перемещение'],
			summa: formatDecimal(StringtoNumber(data.fromAmount)),
			data_operatsii: formatDateParseZone(data?.fromDate),
			data_nachisleniya: formatDateParseZone(data?.toDate),
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
			const res = await createOperation({
				method: isNew ? 'create_operation' : 'update_operation',
				data: payload,
			}, {
				onSuccess: () => {
					onClose()
				}
			})
			const operationId = isNew
				? (res?.data?.data?.guid || res?.data?.data?.[0]?.guid)
				: initialData.guid

			// Update cache with new operation data for immediate UI update
			if (res?.data?.data && !isNew) {
				updateOperationsCache(res.data.data)
			}

			await refreshOperationsListAfterSave({ guid: operationId, newDate: payload.data_operatsii, isNew })
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
			queryClient.invalidateQueries({ queryKey: ['operationsList'] })
			queryClient.invalidateQueries({ queryKey: ['operations'] })
			queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
			queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
			queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })
			queryClient.invalidateQueries({ queryKey: ['legal_entities'] })
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
			queryClient.invalidateQueries({ queryKey: ['balance_report'] })
			await onSuccess?.(operationId)
		} catch (error) {
			console.error('TransferForm onSubmit error', error)
		}
	}

	const handleSelectMyAccount = (type, value) => {
		setValue(type, value)
		const selected = toJS(appStore.currencies)?.find(c => c.guid === value)
		if (selected) {
			setTitle(prev => ({
				...prev,
				[type]: `${selected?.kod} ${selected.nazvanie}`,
			}))
		}
	}

	useEffect(() => {
		if (initialData && (!isNew || initialData.isCopy)) {
			const currencies = toJS(appStore.currencies)
			if (!currencies?.length) return
			const c1 = initialData.currenies_id || initialData.currencyId
			const c2 = initialData.to_currenies_id
			const cur1 = currencies.find(c => c.guid === c1)
			const cur2 = currencies.find(c => c.guid === c2)
			setTitle(prev => ({
				...prev,
				currency_1: cur1 ? `${cur1?.kod} ${cur1.nazvanie}` : prev.currency_1,
				currency_2: cur2 ? `${cur2?.kod} ${cur2.nazvanie}` : prev.currency_2,
			}))
		}
	}, [initialData, isNew, appStore.currencies])

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
							{t('fromSection')}
						</h3>
						<div className='flex-1 h-px bg-gray-200'></div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss!'>{t('paymentDate')}</label>
						<div className='flex-1 flex gap-2 items-center max-w-[600px]'>
							<Controller
								name='fromDate'
								control={control}
								render={({ field }) => (
									<FormDatepicker
										value={field.value}
										onChange={val => {
											field.onChange(val)
											setValue('confirmPayment', !isFuture(val))
										}}
										placeholder={t('selectDate')}
										format='YYYY-MM-DD'
										inputClass={cn('bg-white border', errors.fromDate && 'border-red-500')}
									/>
								)}
							/>
							<span className="flex items-center w-5">{isPastDate(watchFromDate) && !watchConfirmPayment && <WarnIcon />}</span>
							<Controller
								name='confirmPayment'
								control={control}
								render={({ field }) => (
									<OperationCheckbox
										checked={field.value}
										label={t('confirmPayment')}
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
							{t('accountAndLegalEntity')} <span className='text-red-500 ml-0.5'>*</span>
						</label>
						<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
							<Controller
								name='fromAccount'
								control={control}
								rules={{ required: t('fromAccountRequired') }}
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
										placeholder={t('legalEntityPlaceholder')}
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
						<label className='w-[150px] text-xss'>{t('writeOffAmount')}</label>
						<div className='flex-1 max-w-[600px]'>
							<div className='flex items-center'>
								<Controller
									name='fromAmount'
									control={control}
									render={({ field }) => (
										<Input
											type='text'
											value={formatAmountInput(field.value)}
											onChange={e => field.onChange(formatAmountInput(e.target.value))}
											placeholder='0'
											className={cn('w-56', errors.fromAmount && 'border - red - 500')}
										/>
									)}
								/>
								{(currencyTitle1 || title.currency_1) && (
									<span className='text-sm font-medium whitespace-nowrap flex-1 text-gray-800 line-clamp-1'>
										{currencyTitle1 || title.currency_1}
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
							{t('toSection')}
						</h3>
						<div className='flex-1 h-px bg-gray-200'></div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss!'>{t('transferDate')}</label>
						<div className='flex-1 max-w-[600px]'>
							<Controller
								name='toDate'
								control={control}
								render={({ field }) => (
									<FormDatepicker
										value={field.value}
										onChange={field.onChange}
										placeholder={t('selectDate')}
										format='YYYY-MM-DD'
										inputClass={cn('bg-white w-52! border', errors.toDate && 'border-red-500')}
									/>
								)}
							/>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<label className='w-[150px] text-xss'>
							{t('accountAndLegalEntity')} <span className='text-red-500 ml-0.5'>*</span>
						</label>
						<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
							<Controller
								name='toAccount'
								control={control}
								rules={{ required: t('toAccountRequired') }}
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
										placeholder={t('legalEntityPlaceholder')}
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
								{t('enrollAmount')} <span className='text-red-500 ml-0.5'>*</span>
							</label>
							<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
								<div className='flex items-center'>
									<Controller
										name='toAmount'
										control={control}
										rules={{ required: t('enrollAmountRequired') }}
										render={({ field }) => (
											<Input
												type='text'
												value={formatAmountInput(field.value)}
												onChange={e => field.onChange(formatAmountInput(e.target.value))}
												placeholder={t('amountZero')}
												className={cn('w-56', errors.toAmount && 'border-red-500')}
											/>
										)}
									/>
									<span className='text-sm font-medium whitespace-nowrap flex-1 text-gray-800 line-clamp-1'>
										{currencyTitle2 || title.currency_2}
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
							{t('purpose')} <span className='text-red-500 ml-0.5'>*</span>
						</label>
						<div className='flex-1 flex flex-col gap-1 max-w-[600px]'>
							<Controller
								name='purpose'
								control={control}
								rules={{ required: t('purposeRequired') }}
								render={({ field }) => (
									<TextArea
										value={field.value}
										onChange={field.onChange}
										placeholder={t('purposePlaceholder')}
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
					{t('cancel')}
				</button>
				<button type='submit' className='primary-btn py-2!'>
					{isPending ? <Loader2 className='animate-spin' /> : isNew ? t('create') : t('save')}
				</button>
			</div>
		</form>
	)
})

export default TransferForm