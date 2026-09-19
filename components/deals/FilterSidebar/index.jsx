import { FilterSidebar as FilterSidebarComponent } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { keepPreviousData } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { academicYears } from '../../../constants/academicYears'
import { useUcodeDefaultApiQuery } from '../../../hooks/useDashboard'
import { appStore } from '../../../store/app.store'
import { sealDeal } from '../../../store/saleDeal.store'
import { formatAmountInput } from '../../../utils/helpers'
import SelectCounterParties from '../../ReadyComponents/SelectCounterParties'
import SelectProjects from '../../ReadyComponents/SelectProjects'
import Input from '../../shared/Input'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'

const FilterSidebar = observer(({ isOpen = false, onClose, isPurchase = false }) => {
	const t = useTranslations('Deals.filters')
	const tc = useTranslations('Common')
	const tp = useTranslations('Purchases.filters')
	const {
		selectedCounterparties,
		selectedProjects,
		dateRange,
		amountFrom,
		amountTo,
		profitFrom,
		profitTo,
		status,
		schoolYear,
		setState,
		dateRangeType
	} = sealDeal

	// Fetch statuses
	const { data: fetchedData } = useUcodeDefaultApiQuery({
		queryKey: 'sales_status',
		urlMethod: 'GET',
		urlParams: '/items/sales_status?from-ofs=true',
		data: {},
		querySetting: {
			select: response => response?.data?.data?.response,
			staleTime: 1000 * 60 * 60,
			placeholder: keepPreviousData,
			refetchOnMount: true,
			refetchOnWindowFocus: false,
		},
	})

	const statuses = useMemo(() => {
		return fetchedData?.map(status => ({
			value: status.guid,
			label: status.name,
		}))
	}, [fetchedData])


	// Учебный год — только для школ и только на сделках по продажам
	const showSchoolYear = appStore.isDonoSchool && !isPurchase

	const activeFilterCount = useMemo(() => {
		let count = 0
		if (selectedCounterparties?.length > 0) count++
		if (selectedProjects?.length > 0) count++
		if (status?.length > 0) count++
		if (dateRange?.end || dateRange?.start) count++
		if (amountFrom || amountTo) count++
		if (!isPurchase && (profitFrom || profitTo)) count++
		if (showSchoolYear && schoolYear) count++
		return count
	}, [
		selectedCounterparties,
		selectedProjects,
		dateRange,
		amountFrom,
		amountTo,
		profitFrom,
		profitTo,
		status,
		isPurchase,
		schoolYear,
		showSchoolYear
	])

	// Суммы вводятся как в остальных формах: «.», «,» и «/» дают одну
	// десятичную точку, разряды разделяются пробелами
	const handlePriceDebouce = (field, value) => {
		setState(field, formatAmountInput(value))
	}


	const handleFilterChange = (field, value) => {
		setState(field, value)
	}

	return (
		<FilterSidebarComponent
			isOpen={isOpen}
			onClose={onClose}
			clearCount={activeFilterCount}
			onClear={() => sealDeal.resetFilters()}
		>
			<div className='flex flex-col gap-4'>
				{isPurchase && (
					<p className='text-neutral-500 text-xs font-medium'>{tp('sectionTitle')}</p>
				)}

				{/* Учебный год — только для школ */}
				{showSchoolYear && (
					<div className='flex flex-col gap-1.5 mt-2'>
						<SingleSelect
							data={academicYears}
							value={schoolYear || ''}
							onChange={val => handleFilterChange('schoolYear', val)}
							placeholder={t('academicYear')}
						/>
					</div>
				)}

				{/* status filter with singleSelect component */}
				<div className='flex flex-col gap-1.5 mt-2'>
					<MultiSelect
						data={statuses}
						value={status || []}
						onChange={val => handleFilterChange('status', val)}
						placeholder={t('dealStatus')}
					/>
				</div>

				{/* Counterparty Selection */}
				<div className='flex flex-col gap-1.5'>
					<SelectCounterParties
						onChange={values => handleFilterChange('selectedCounterparties', values)}
						placeholder={isPurchase ? tp('selectSuppliers') : t('selectCounterparties')}
						value={selectedCounterparties}
					/>
				</div>

				{/* Проекты — только если включён модуль проектов */}
				{appStore.projectActive && (
					<div className='flex flex-col gap-1.5'>
						<SelectProjects
							multi
							value={selectedProjects}
							onChange={values => handleFilterChange('selectedProjects', values)}
							placeholder={t('selectProjects')}
						/>
					</div>
				)}

				{/* Date Range Selector */}
				<div className='flex flex-col gap-1.5'>
					<NewDateRangeComponent
						value={dateRange}
						onChange={range =>
							handleFilterChange('dateRange', { start: range.start, end: range.end })
						}
						present={dateRangeType}
						onSetPresent={(present) => setState('dateRangeType', present)}
						onClear={() => setState('dateRangeType', '')}
					/>
				</div>

				{/* Amount Borders Selectors */}
				<div className='flex flex-col gap-1.5'>
					<p className='text-neutral-600 text-xs font-medium'>{t('dealAmount')}</p>
					<div className='flex items-center gap-1.5'>
						<Input
							type='text'
							placeholder={t('from')}
							value={formatAmountInput(amountFrom)}
							onChange={e => handlePriceDebouce('amountFrom', e.target.value)}
							className='h-8!'
						/>
						<span className='text-neutral-400 font-light'>-</span>
						<Input
							type='text'
							placeholder={t('to')}
							value={formatAmountInput(amountTo)}
							onChange={e => handlePriceDebouce('amountTo', e.target.value)}
							className='h-8!'
						/>
					</div>
				</div>

				{/* Profit Borders Selectors — not shown for purchases */}
				{!isPurchase && (
					<div className='flex flex-col gap-1.5'>
						<p className='text-neutral-600 text-xs font-medium'>{t('dealProfit')}</p>
						<div className='flex items-center gap-1.5'>
							<Input
								type='text'
								placeholder={t('from')}
								value={formatAmountInput(profitFrom)}
								onChange={e => handlePriceDebouce('profitFrom', e.target.value)}
								className='h-8!'
							/>
							<span className='text-neutral-400 font-light'>-</span>
							<Input
								type='text'
								placeholder={t('to')}
								value={formatAmountInput(profitTo)}
								onChange={e => handlePriceDebouce('profitTo', e.target.value)}
								className='h-8!'
							/>
						</div>
					</div>
				)}
			</div>
		</FilterSidebarComponent>
	)
})

export default FilterSidebar
