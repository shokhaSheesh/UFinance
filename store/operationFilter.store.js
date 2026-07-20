import { makeAutoObservable } from 'mobx';
import { makePersistable } from 'mobx-persist-store';
import { appStore } from './app.store';


export const allowedTip = {
	allowIncome: appStore.permission.operations.income.read,
	allowAccrual: appStore.permission.operations.accrual.read,
	allowTransfer: appStore.permission.operations.transfer.read,
	allowPayout: appStore.permission.operations.payout.read,
	allowShipment: appStore.permission.operations.shipment.read,
}

export const tips = [(allowedTip.allowAccrual ? 'Начисление' : ''), (allowedTip.allowAccrual ? 'Дебет' : ''), (allowedTip.allowAccrual ? 'Кредит' : ''), (allowedTip.allowShipment ? 'Отгрузка' : ''), (allowedTip.allowShipment ? 'Поставка' : ''), (allowedTip.allowIncome ? 'Поступление' : ''), (allowedTip.allowPayout ? 'Выплата' : ''), (allowedTip.allowTransfer ? 'Списание' : ''), (allowedTip.allowTransfer ? 'Зачисление' : ''), (allowedTip.allowTransfer ? 'Перемещение' : '')].filter(Boolean)


class OperationFilterStore {
	limit = 10
	searchQuery = ''
	debouncedSearchQuery = ''
	selectedDatePaymentRange = null
	selectedDateStartRange = null
	selectedCounterAgents = []
	selectedLegalEntities = []
	selectedFilters = tips
	amountRange = { min: '', max: '' }
	selectedChartOfAccounts = []
	paymentType = null

	paymentConfirm = true
	paymentNotConfirm = true
	accrualConfirm = true
	accrualNotConfirm = true

	paymentDateStart = ''
	paymentDateEnd = ''
	accrualDateStart = ''
	accrualDateEnd = ''
	deals = []
	purchaseDeals = []

	dateRangeTypeOplata = ''
	dateRangeTypeNachisleniya = ''

	constructor() {
		makeAutoObservable(this)
		if (typeof window !== 'undefined') {
			makePersistable(this, {
				name: 'operationFilter',
				properties: [
					'limit',
					'searchQuery',
					'debouncedSearchQuery',
					'selectedDatePaymentRange',
					'selectedDateStartRange',
					'selectedCounterAgents',
					'selectedLegalEntities',
					'selectedFilters',
					'amountRange',
					'selectedChartOfAccounts',
					'paymentType',
					'paymentConfirm',
					'paymentNotConfirm',
					'accrualConfirm',
					'accrualNotConfirm',
					'paymentDateStart',
					'paymentDateEnd',
					'accrualDateStart',
					'accrualDateEnd',
					'deals',
					'purchaseDeals',
					'dateRangeTypeOplata',
					'dateRangeTypeNachisleniya'
				],
				storage: window.localStorage,
				debugMode: false,
			})
		}
	}

	// Actions
	setLimit(num) {
		this.limit = num
	}

	setAutoFilter(filterdata) { 
		this.accrualConfirm = filterdata.accrualConfirm ?? this.accrualConfirm
		this.accrualNotConfirm = filterdata.accrualNotConfirm ?? this.accrualNotConfirm
		this.paymentConfirm = filterdata.paymentConfirm ?? this.paymentConfirm
		this.paymentNotConfirm = filterdata.paymentNotConfirm ?? this.paymentNotConfirm
		this.selectedFilters = filterdata.tip ?? this.selectedFilters
		this.selectedChartOfAccounts = filterdata.chart_of_accounts_ids ?? this.selectedChartOfAccounts
		this.selectedDateStartRange = { start: filterdata.accrualDateStart, end: filterdata.accrualDateEnd }
		this.selectedDatePaymentRange = { start: filterdata.paymentDateStart, end: filterdata.paymentDateEnd }
	}

	setState(state, value) {
		this[state] = value
	}

	setSearchQuery(query) {
		this.searchQuery = query
	}

	setDebouncedSearchQuery(query) {
		this.debouncedSearchQuery = query
	}

	setSelectedDatePaymentRange(range) {
		this.selectedDatePaymentRange = range
	}

	setSelectedDateStartRange(range) {
		this.selectedDateStartRange = range
	}

	setSelectedCounterAgents(agents) {
		this.selectedCounterAgents = agents
	}

	setSelectedLegalEntities(entities) {
		this.selectedLegalEntities = entities
	}

	setSelectedFilters(filters) {
		this.selectedFilters = filters
	}

	toggleFilter(key, forceValue) {
		// Permission check - map filter keys to their required permissions
		const permissionMap = {
			'Поступление': 'allowIncome',
			'Начисление': 'allowAccrual',
			'Дебет': 'allowAccrual',
			'Кредит': 'allowAccrual',
			'Отгрузка': 'allowShipment',
			'Поставка': 'allowShipment',
			'Выплата': 'allowPayout',
			'Списание': 'allowTransfer',
			'Зачисление': 'allowTransfer',
			'Перемещение': 'allowTransfer',
		}

		const requiredPermission = permissionMap[key]
		if (requiredPermission && !allowedTip[requiredPermission]) {
			return
		}

		const arr = [...this.selectedFilters]
		const shouldAdd = forceValue !== undefined ? forceValue : !arr.includes(key)

		let nextFilters = shouldAdd
			? arr.includes(key)
				? arr
				: [...arr, key]
			: arr.filter(v => v !== key)

		// Child to Parent logic - only run if not a complex (forced) toggle to avoid jitter
		if (forceValue === undefined) {
			const relationships = [
				{ parent: 'Перемещение', children: ['Списание', 'Зачисление'] },
				{ parent: 'Начисление', children: ['Дебет', 'Кредит'] },
			]

			relationships.forEach(({ parent, children }) => {
				if (children.includes(key)) {
					const currentChildrenState = children.map(child =>
						child === key ? shouldAdd : nextFilters.includes(child),
					)

					const anyChildrenChecked = currentChildrenState.some(Boolean)
					const allChildrenUnchecked = currentChildrenState.every(v => v === false)

					if (anyChildrenChecked) {
						if (!nextFilters.includes(parent)) nextFilters = [...nextFilters, parent]
					} else if (allChildrenUnchecked) {
						if (nextFilters.includes(parent)) nextFilters = nextFilters.filter(v => v !== parent)
					}
				}
			})
		}

		this.selectedFilters = nextFilters
	}

	toggleComplexFilter(type) {
		const isCurrentlySelected = this.selectedFilters.includes(type)
		const shouldAdd = !isCurrentlySelected

		// First toggle all children to the same state
		const relationships = {
			Перемещение: ['Списание', 'Зачисление'],
			Начисление: ['Дебет', 'Кредит'],
		}

		const children = relationships[type] || []
		children.forEach(child => {
			this.toggleFilter(child, shouldAdd)
		})

		// Then toggle parent itself
		this.toggleFilter(type, shouldAdd)
	}

	setAmountRange(updater) {
		if (typeof updater === 'function') {
			this.amountRange = updater(this.amountRange)
		} else {
			this.amountRange = updater
		}
	}

	setSelectedChartOfAccounts(accounts) {
		this.selectedChartOfAccounts = accounts
	}

	setPaymentType(type) {
		this.paymentType = type
	}

	setDateFilters(key, value) {
		this.dateFilters = { ...this.dateFilters, [key]: value }
	}

	setDateStartFilters(key, value) {
		this[key] = value
	}

	setSelectedDeals(deals) {
		this.deals = deals
	}

	setSelectedPurchaseDeals(deals) {
		this.purchaseDeals = deals
	}

	resetFilters() {
		this.searchQuery = ''
		this.debouncedSearchQuery = ''
		this.selectedDatePaymentRange = null
		this.selectedDateStartRange = null
		this.selectedCounterAgents = []
		this.selectedLegalEntities = []
		this.selectedFilters = tips
		this.amountRange = { min: '', max: '' }
		this.selectedChartOfAccounts = []
		this.paymentType = null
		this.paymentConfirm = true
		this.paymentNotConfirm = true
		this.accrualConfirm = true
		this.accrualNotConfirm = true
		this.deals = []
		this.purchaseDeals = []
		this.dateRangeTypeNachisleniya = ''
		this.dateRangeTypeOplata = ''
	}
}

export const operationFilterStore = new OperationFilterStore()
