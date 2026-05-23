import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../../../constants/globalCurrency'

const currentYear = new Date().getFullYear()
const defaultDateRange = () => {
	return {
		start: new Date(currentYear, 0, 1), // january 1st of current year
		end: new Date(), // today
	}
}

class BalanceStore {
	// ── Filter state ────────────────────────────────────────────────────────────
	dateRange = defaultDateRange()
	selectedEntity = []
	selectedCurrency = GlobalCurrency.code || 'UZS'
	selectedCounterparties = []
	selectedAccount = []
	defaultDate = { start: new Date(currentYear, 0, 1), end: new Date() }

	constructor() {
		makeAutoObservable(this)
		if (typeof window !== 'undefined') {
			makePersistable(this, {
				name: 'balance_store',
				properties: [
					'dateRange',
					'selectedEntity',
					'selectedCurrency',
					'selectedCounterparties',
					'selectedAccount',
				],
				storage: window.localStorage,
				debugMode: true,
			})
		}
	}

	// ── Setters ─────────────────────────────────────────────────────────────────
	setDateRange(range) {
		if (!range.start || !range.end) {
			this.dateRange = defaultDateRange()
		} else {
			this.dateRange = range
		}
	}

	setSelectedEntity(entity) {
		this.selectedEntity = entity
	}

	setSelectedCurrency(currency) {
		this.selectedCurrency = currency
	}

	setSelectedCounterparties(items) {
		this.selectedCounterparties = items
	}

	setSelectedAccount(account) {
		this.selectedAccount = account
	}

	resetFilters() {
		this.dateRange = defaultDateRange()
		this.selectedEntity = []
		this.selectedCurrency = GlobalCurrency.code || 'UZS'
		this.selectedCounterparties = []
		this.selectedAccount = []
	}
}

export const balanceStore = new BalanceStore()
