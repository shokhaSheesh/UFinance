import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../../../constants/globalCurrency'

const currentYear = new Date().getFullYear()

const getDefaultStartDate = () => {
	return new Date(currentYear, 0, 1) // January 1st of current year
}

const getDefaultEndDate = () => {
	return new Date() // today
}

class CashFlowStore {
	// ── Filter state ────────────────────────────────────────────────────────────
	periodStartDate = getDefaultStartDate()
	periodEndDate = getDefaultEndDate()
	periodType = 'monthly'
	currencyCode = GlobalCurrency?.code || 'UZS' // Defaulting to RUB as seen in page
	sellingDealId = [] // these are same values
	contrAgentId = []
	defaultDate = { start: new Date(currentYear, 0, 1), end: new Date() }
	accountId = []
	dealId = [] // these are same values
	projectId = []
	dateRangeType = 'year'

	constructor() {
		makeAutoObservable(this)
		if (typeof window !== 'undefined') {
			makePersistable(this, {
				name: 'cashflow_store_v2',
				properties: [
					'periodStartDate',
					'periodEndDate',
					'periodType',
					'currencyCode',
					'sellingDealId',
					'contrAgentId',
					'accountId',
					'dealId',
					'projectId',
					'dateRangeType'
				],
				storage: window.localStorage,
				debugMode: false,
			})
		}
	}

	// ── Setters ─────────────────────────────────────────────────────────────────
	setPeriodDateRange(range) {
		if (!range.start || !range.end) {
			this.periodStartDate = new Date(currentYear, 0, 1)
			this.periodEndDate = new Date()
		} else {
			this.periodStartDate = range.start
			this.periodEndDate = range.end
		}
	}
	setDateRangeType(type) {
		this.dateRangeType = type
	}

	setPeriodType(value) {
		this.periodType = value
	}

	setCurrencyCode(value) {
		this.currencyCode = value
	}

	setDeals(value) {
		this.sellingDealId = value
	}

	setSelectedProjects(value) {
		this.projectId = value
	}

	setCounterparties(value) {
		this.contrAgentId = value
	}

	setAccounts(value) {
		this.accountId = value
	}

	resetFilters() {
		this.periodStartDate = new Date(currentYear, 0, 1)
		this.periodEndDate = new Date()
		this.periodType = 'monthly'
		this.currencyCode = GlobalCurrency?.code
		this.sellingDealId = []
		this.contrAgentId = []
		this.accountId = []
		this.dealId = []
		this.projectId = []
		this.dateRangeType = 'year'
	}
}

export const cashFlowStore = new CashFlowStore()
