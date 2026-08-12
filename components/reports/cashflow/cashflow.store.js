import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { getPresetRange } from '../../../utils/datePresets'

// По умолчанию отчёт строится за текущий квартал — тот же диапазон, что даёт
// пресет «Этот квартал» в календаре фильтров
const DEFAULT_RANGE_TYPE = 'quarter'

const getDefaultStartDate = () => getPresetRange(DEFAULT_RANGE_TYPE)[0]

const getDefaultEndDate = () => getPresetRange(DEFAULT_RANGE_TYPE)[1]

class CashFlowStore {
	// ── Filter state ────────────────────────────────────────────────────────────
	periodStartDate = getDefaultStartDate()
	periodEndDate = getDefaultEndDate()
	periodType = 'monthly'
	currencyCode = GlobalCurrency?.code || 'UZS' // Defaulting to RUB as seen in page
	sellingDealId = [] // these are same values
	contrAgentId = []
	defaultDate = { start: getDefaultStartDate(), end: getDefaultEndDate() }
	accountId = []
	dealId = [] // these are same values
	projectId = []
	dateRangeType = DEFAULT_RANGE_TYPE

	constructor() {
		makeAutoObservable(this)
		if (typeof window !== 'undefined') {
			makePersistable(this, {
				name: 'cashflow_store_v3',
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
			this.periodStartDate = getDefaultStartDate()
			this.periodEndDate = getDefaultEndDate()
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
		this.periodStartDate = getDefaultStartDate()
		this.periodEndDate = getDefaultEndDate()
		this.periodType = 'monthly'
		this.currencyCode = GlobalCurrency?.code
		this.sellingDealId = []
		this.contrAgentId = []
		this.accountId = []
		this.dealId = []
		this.projectId = []
		this.dateRangeType = DEFAULT_RANGE_TYPE
	}
}

export const cashFlowStore = new CashFlowStore()
