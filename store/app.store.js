import { makeAutoObservable } from 'mobx';
import { makePersistable } from "mobx-persist-store";


class AppStore {
	isPayment = false
	currency = {
		name: '',
		guid: '',
		code: '',
	}
	currencies = []
	myCurrencies = []
	companyCurrencies = []
	localApiUrl = ''
	permission = {
		indicators: { read: false },
		operations: {
			income: { read: true, add: true, edit: true, delete: true },
			payout: { read: true, add: true, edit: true, delete: true },
			transfer: { read: true, add: true, edit: true, delete: true },
			accrual: { read: true, add: true, edit: true, delete: true },
			shipment: { read: true, add: true, edit: true, delete: true },
		},
		deals: { read: true, add: true, edit: true, delete: true },
		reports: {
			cashflow: { read: true },
			pnl: { read: true },
			balance: { read: true },
		},
		directories: {
			counterparties: { read: true, add: true, edit: true, delete: true },
			transactionCategories: { read: true, add: true, edit: true, delete: true },
			accounts: { read: true, add: true, edit: true, delete: true },
			legalentities: { read: true, add: true, edit: true, delete: true },
			productsServices: { read: true, add: true, edit: true, delete: true },
		},
		settings: {
			general: { read: true, add: true, edit: true, delete: true },
			users: { read: true, add: true, edit: true, delete: true },
			profile: { read: true, add: true, edit: true, delete: true },
			exchangerates: { read: true, add: true, edit: true, delete: true },
		},
	}

	constructor() {
		makeAutoObservable(this)
		if (typeof window !== 'undefined') {
			makePersistable(this, {
				name: 'plan_fact_app',
				properties: ['isPayment', 'currency', 'currencies', 'myCurrencies', 'companyCurrencies', 'localApiUrl'],
				storage: window.localStorage,
				debugMode: true,
				version: 1,
				deserialize: (storedValue, defaultValue) => {
					// Merge persisted permission with defaults to handle new fields
					if (storedValue?.permission && defaultValue?.permission) {
						storedValue.permission = this.mergePermissions(defaultValue.permission, storedValue.permission)
					}
					return { ...defaultValue, ...storedValue }
				},
			})
		}
	}

	mergePermissions(defaults, stored) {
		const result = {}
		for (const key in defaults) {
			if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
				result[key] = this.mergePermissions(defaults[key], stored?.[key] || {})
			} else {
				result[key] = stored?.[key] ?? defaults[key]
			}
		}
		return result
	}

	setIsPayment(value) {
		this.isPayment = value
	}

	setCurrency(value) {
		this.currency = value
	}

	setCurrencies(value) {
		this.currencies = value
	}

	setCompanyCurrencies(value) {
		this.companyCurrencies = value
	}

	setMyCurrencies(value) {
		this.myCurrencies = value
	}

	setLocalApiUrl(value) {
		this.localApiUrl = value
	}

	setPermission(value) {
		this.permission = value
	}

	// Restore state from localStorage/cookies on init
}

export const appStore = new AppStore();
