import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { getPresetRange } from '../../../utils/datePresets'

const formatDate = date => {
	const d = typeof date === 'string' ? new Date(date) : date
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// По умолчанию отчёт строится за текущий квартал — тот же диапазон, что даёт
// пресет «Этот квартал» в календаре фильтров
const DEFAULT_RANGE_TYPE = 'quarter'

const getDefaultDateRange = () => {
	const [start, end] = getPresetRange(DEFAULT_RANGE_TYPE)
	return { start, end }
}

class PnLStore {
	dateRange = getDefaultDateRange()
	selectedPeriod = 'all'
	selectedGrouping = 'monthly'
	isCalculation = 'cash'
	operational = false
	ebitda = false
	ebit = false
	ebt = false
	deals = []
	selectedProjects = []
	selectedAccounts = []
	selectedLegalEntities = []
	selectedCounterparties = []
	defaultDate = getDefaultDateRange()
	selectedCurrency = GlobalCurrency?.code || 'UZS'
	dateRangeType = DEFAULT_RANGE_TYPE

	constructor() {
		makeAutoObservable(this)
		if (typeof window !== 'undefined') {
			makePersistable(this, {
				name: 'pnl_store_v2',
				properties: [
					'profitTypes',
					'selectedAccounts',
					'selectedLegalEntities',
					'selectedCounterparties',
					'selectedCurrency',
					'selectedPeriod',
					'selectedGrouping',
					'deals',
					'selectedProjects',
					'isCalculation',
					'dateRange',
					'dateRangeType'
				],
				storage: window.localStorage,
				debugMode: false,
			})
		}
	}

	// ── Setters ─────────────────────────────────────────────────────────────────
	setDateRange(val) {
		if (!val.start || !val.end) {
			this.dateRange = getDefaultDateRange()
		} else {
			this.dateRange = { start: val?.start, end: val?.end }
		}
	}
	setDateRangeType(type) {
		this.dateRangeType = type
	}
	setSelectedPeriod(val) {
		this.selectedPeriod = val
	}
	setSelectedGrouping(val) {
		this.selectedGrouping = val
	}
	setIsCalculation(val) {
		this.isCalculation = val
	}
	setSelectedAccounts(val) {
		this.selectedAccounts = val
	}
	setSelectedCounterparties(val) {
		this.selectedCounterparties = val
	}
	setSelectedCurrency(val) {
		this.selectedCurrency = val
	}
	setOperational(value) {
		this.operational = value
	}
	setSelectedLegalEntities(val) {
		this.selectedLegalEntities = val
	}
	setEbitDa(value) {
		this.ebitda = value
	}
	setEbit(value) {
		this.ebit = value
	}
	setEbt(value) {
		this.ebt = value
	}
	setDeals(value) {
		this.deals = value
	}

	setSelectedProjects(value) {
		this.selectedProjects = value
	}

	resetFilters() {
		this.dateRange = getDefaultDateRange()
		this.selectedPeriod = 'all'
		this.selectedGrouping = 'monthly'
		this.isCalculation = 'cash'
		this.operational = false
		this.ebitda = false
		this.ebit = false
		this.ebt = false
		this.deals = []
		this.selectedProjects = []
		this.selectedAccounts = []
		this.selectedLegalEntities = []
		this.selectedCounterparties = []
		this.selectedCurrency = GlobalCurrency?.code || 'UZS'
		this.dateRangeType = DEFAULT_RANGE_TYPE
	}
}

export const pnlStore = new PnLStore()
