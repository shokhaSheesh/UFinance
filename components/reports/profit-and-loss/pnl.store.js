import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../../../constants/globalCurrency'

const formatDate = date => {
	const d = typeof date === 'string' ? new Date(date) : date
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const currentYear = new Date().getFullYear()

const getDefaultDateRange = () => {
	return { start: new Date(currentYear, 0, 1), end: new Date() }
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
	selectedAccounts = []
	selectedLegalEntities = []
	selectedCounterparties = []
	defaultDate = { start: new Date(currentYear, 0, 1), end: new Date() }
	selectedCurrency = GlobalCurrency?.code || 'UZS'
	dateRangeType = 'year'

	constructor() {
		makeAutoObservable(this)
		if (typeof window !== 'undefined') {
			makePersistable(this, {
				name: 'cashflow_store_v2',
				properties: [
					'profitTypes',
					'selectedAccounts',
					'selectedLegalEntities',
					'selectedCounterparties',
					'selectedCurrency',
					'selectedPeriod',
					'selectedGrouping',
					'deals',
					'isCalculation',
					'dateRange',
					'dateRangeType'
				],
				storage: window.localStorage,
				debugMode: true,
			})
		}
	}

	// ── Setters ─────────────────────────────────────────────────────────────────
	setDateRange(val) {
		if (!val.start || !val.end) {
			this.dateRange = { start: new Date(currentYear, 0, 1), end: new Date() }
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
		this.selectedAccounts = []
		this.selectedLegalEntities = []
		this.selectedCounterparties = []
		this.selectedCurrency = GlobalCurrency?.code || 'UZS'
		this.dateRangeType = 'year'
	}
}

export const pnlStore = new PnLStore()
