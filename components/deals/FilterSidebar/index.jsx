import { FilterSidebar as FilterSidebarComponent } from '@/components/directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeDefaultApiQuery } from '../../../hooks/useDashboard'
import { sealDeal } from '../../../store/saleDeal.store'
import { formatNumber } from '../../../utils/helpers'
import SelectCounterParties from '../../ReadyComponents/SelectCounterParties'
import Input from '../../shared/Input'
import MultiSelect from '../../shared/Selects/MultiSelect'

const FilterSidebar = observer(({ onOpenChange }) => {
	const [isOpen, setIsOpen] = useState(true)
	const [queryParams, setQueryParams] = useQueryStates({
		selectedCounterparties: { defaultValue: [] },
		dateRange: { defaultValue: { start: null, end: null } },
		amountFrom: { defaultValue: "" },
		amountTo: { defaultValue: "" },
		profitFrom: { defaultValue: "" },
		profitTo: { defaultValue: "" },
		status: { defaultValue: [] },
	})

	// Sync URL params to store on mount

	useEffect(() => {
		setState('selectedCounterparties', queryParams.selectedCounterparties)
		setState('dateRange', queryParams.dateRange)
		setState('amountFrom', queryParams.amountFrom)
		setState('amountTo', queryParams.amountTo)
		setState('profitFrom', queryParams.profitFrom)
		setState('profitTo', queryParams.profitTo)
		setState('status', queryParams.status)
	}, [])

	const toggleOpen = val => {
		setIsOpen(val)
		onOpenChange?.(val)
	}

	const {
		selectedCounterparties,
		dateRange,
		amountFrom,
		amountTo,
		profitFrom,
		profitTo,
		status,
		setState,
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


	const activeFilterCount = useMemo(() => {
		let count = 0
		if (selectedCounterparties?.length > 0) count++
		if (dateRange?.end || dateRange?.start) count++
		if (amountFrom || amountTo) count++
		if (profitFrom || profitTo) count++
		return count
	}, [
		selectedCounterparties,
		dateRange,
		amountFrom,
		amountTo,
		profitFrom,
		profitTo,
	])

	const debounceSetParams = useMemo(
		() => debounce((field, value) => {
			setState(field, value)
		}, 300),
		[setState]
	)

	const handlePriceDebouce = (field, value) => {
		setQueryParams({ [field]: value })
		debounceSetParams(field, value)
	}


	const handleFilterChange = (field, value) => {
		setQueryParams({ [field]: value })
		setState(field, value)
	}

	return (
		<FilterSidebarComponent
			isOpen={isOpen}
			onClose={() => toggleOpen(!isOpen)}
			clearCount={activeFilterCount}
			onClear={() => sealDeal.resetFilters()}
		>
			<div className='flex flex-col gap-4'>
				{/* status filter with singleSelect component */}
				<div className='flex flex-col gap-1.5 mt-2'>
					<MultiSelect
						data={statuses}
						value={status || []}
						onChange={val => handleFilterChange('status', val)}
						placeholder='Статус сделки'
					/>
				</div>

				{/* Counterparty Selection */}
				<div className='flex flex-col gap-1.5'>
					<SelectCounterParties
						onChange={values => handleFilterChange('selectedCounterparties', values)}
						placeholder='Выберите контрагентов'
						value={selectedCounterparties}
					/>
				</div>

				{/* Date Range Selector */}
				<div className='flex flex-col gap-1.5'>
					<NewDateRangeComponent
						value={dateRange}
						onChange={range =>
							handleFilterChange('dateRange', { start: range.start, end: range.end })
						}
					/>
				</div>

				{/* Amount Borders Selectors */}
				<div className='flex flex-col gap-1.5'>
					<p className='text-neutral-600 text-xs font-medium'>Сумма сделки</p>
					<div className='flex items-center gap-1.5'>
						<Input
							type='text'
							placeholder='От'
							value={formatNumber(queryParams.amountFrom)}
							onChange={e => handlePriceDebouce('amountFrom', e.target.value)}
							className='h-8!'
						/>
						<span className='text-neutral-400 font-light'>-</span>
						<Input
							type='text'
							placeholder='До'
							value={formatNumber(queryParams.amountTo)}
							onChange={e => handlePriceDebouce('amountTo', e.target.value)}
							className='h-8!'
						/>
					</div>
				</div>

				{/* Profit Borders Selectors */}
				<div className='flex flex-col gap-1.5'>
					<p className='text-neutral-600 text-xs font-medium'>Прибыль сделки</p>
					<div className='flex items-center gap-1.5'>
						<Input
							type='text'
							placeholder='От'
							value={formatNumber(queryParams.profitFrom)}
							onChange={e => handlePriceDebouce('profitFrom', e.target.value)}
							className='h-8!'
						/>
						<span className='text-neutral-400 font-light'>-</span>
						<Input
							type='text'
							placeholder='До'
							value={formatNumber(queryParams.profitTo)}
							onChange={e => handlePriceDebouce('profitTo', e.target.value)}
							className='h-8!'
						/>
					</div>
				</div>
			</div>
		</FilterSidebarComponent>
	)
})

export default FilterSidebar
