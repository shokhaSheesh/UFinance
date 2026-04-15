import { dashboardAPI } from '@/lib/api/dashboard'
import { defaultUcodeApiRequest, ucodeRequest } from '@/lib/api/ucode/base'
import { chartOfAccountsAPI } from '@/lib/api/ucode/chartOfAccounts'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import {
	keepPreviousData,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

// Get dashboard data
export const useDashboardData = params => {
	return useQuery({
		queryKey: ['dashboard', params],
		queryFn: () => dashboardAPI.getDashboardData(params),
	})
}

export const useMyAccountsBoard = params => {
	return useQuery({
		queryKey: ['myAccountsBoard', params],
		queryFn: () => dashboardAPI.getMyAccountsBoard(params),
	})
}

// Get operations
export const useOperations = params => {
	return useQuery({
		queryKey: ['operations', params],
		queryFn: () => dashboardAPI.getOperations(params),
	})
}

// Get products
export const useProducts = params => {
	return useQuery({
		queryKey: ['products', params],
		queryFn: () => dashboardAPI.getProducts(params),
	})
}

// Get accounts
export const useAccounts = params => {
	return useQuery({
		queryKey: ['accounts', params],
		queryFn: () => dashboardAPI.getAccounts(params),
	})
}

// Get transaction categories
export const useTransactionCategories = params => {
	return useQuery({
		queryKey: ['transactionCategories', params],
		queryFn: () => dashboardAPI.getTransactionCategories(params),
	})
}

// Create operation mutation
export const useCreateOperation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.createOperation,
		onMutate: async newOperation => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['operationsList'] })

			// Сохраняем предыдущее состояние
			const previousData = queryClient.getQueriesData({ queryKey: ['operationsList'] })

			return { previousData }
		},
		onSuccess: (response, variables) => {
			// Добавляем новую операцию в кеш
			queryClient.setQueriesData({ queryKey: ['operationsList'] }, old => {
				if (!old?.data?.data?.data) return old

				const newOp = response?.data?.data || variables

				return {
					...old,
					data: {
						...old.data,
						data: {
							...old.data.data,
							data: [newOp, ...old.data.data.data],
						},
					},
				}
			})

			showSuccessNotification('Операция успешно создана!')
		},
		onError: (error, variables, context) => {
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			showErrorNotification(error.message || 'Ошибка при создании операции')
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
		},
	})
}

// Update operation mutation
export const useUpdateOperation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, data }) => dashboardAPI.updateOperation(id, data),
		onMutate: async ({ id, data }) => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['operationsList'] })
			await queryClient.cancelQueries({ queryKey: ['operation', id] })

			// Сохраняем предыдущее состояние
			const previousData = queryClient.getQueriesData({ queryKey: ['operationsList'] })
			const previousOperation = queryClient.getQueryData(['operation', id])

			// Оптимистично обновляем операцию в списке
			queryClient.setQueriesData({ queryKey: ['operationsList'] }, old => {
				if (!old?.data?.data?.data) return old

				return {
					...old,
					data: {
						...old.data,
						data: {
							...old.data.data,
							data: old.data.data.data.map(op =>
								op.guid === id
									? { ...op, ...data, data_obnovleniya: new Date().toISOString() }
									: op,
							),
						},
					},
				}
			})

			return { previousData, previousOperation }
		},
		onSuccess: () => {
			showSuccessNotification('Операция успешно обновлена!')
		},
		onError: (error, variables, context) => {
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			if (context?.previousOperation) {
				queryClient.setQueryData(['operation', variables.id], context.previousOperation)
			}
			showErrorNotification(error.message || 'Ошибка при обновлении операции')
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
		},
	})
}

// Delete operation mutation
export const useDeleteOperation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.deleteOperation,
		onMutate: async guidsToDelete => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['operationsList'] })

			// Сохраняем предыдущее состояние для отката
			const previousData = queryClient.getQueriesData({ queryKey: ['operationsList'] })

			// Оптимистично обновляем кеш - удаляем операции из списка
			queryClient.setQueriesData({ queryKey: ['operationsList'] }, old => {
				if (!old?.data?.data?.data) return old

				const guidsArray = Array.isArray(guidsToDelete) ? guidsToDelete : [guidsToDelete]

				return {
					...old,
					data: {
						...old.data,
						data: {
							...old.data.data,
							data: old.data.data.data.filter(op => !guidsArray.includes(op.guid)),
						},
					},
				}
			})

			return { previousData }
		},
		onError: (error, variables, context) => {
			// Откатываем изменения при ошибке
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			showErrorNotification(error.message || 'Ошибка при удалении операции')
		},
		onSuccess: () => {
			showSuccessNotification('Операция успешно удалена!')
		},
		onSettled: () => {
			// Обновляем связанные запросы в фоне
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
		},
	})
}

// Get chart of accounts using v2/items/chart_of_accounts endpoint (GET)
export const useChartOfAccountsV2 = (params = {}) => {
	return useQuery({
		queryKey: ['chartOfAccountsV2', params],
		queryFn: async () => {
			console.log('useChartOfAccountsV2: Making request with params:', params)
			try {
				const result = await dashboardAPI.getChartOfAccountsV2(params)
				console.log('useChartOfAccountsV2: Response received:', result)
				return result
			} catch (error) {
				console.error('useChartOfAccountsV2: Error:', error)
				console.error('useChartOfAccountsV2: Error response:', error.response?.data)
				// Return empty data structure instead of throwing to prevent app crash
				return {
					status: 'ERROR',
					data: { data: { count: 0, response: [] } },
				}
			}
		},
		enabled: true,
		staleTime: 5 * 60 * 1000,
		retry: false,
	})
}

// Get chart of accounts tree using invoke_function planfact-plan-fact (POST)
export const useChartOfAccountsPlanFact = (params = {}) => {
	return useQuery({
		queryKey: ['chartOfAccountsPlanFact', params],
		queryFn: async () => {
			console.log('useChartOfAccountsPlanFact: Making request with params:', params)
			try {
				const result = await chartOfAccountsAPI.getChartOfAccountsInvokeFunction(params)
				console.log('useChartOfAccountsPlanFact: Response received:', result)
				return result
			} catch (error) {
				console.error('useChartOfAccountsPlanFact: Error:', error)
				console.error('useChartOfAccountsPlanFact: Error response:', error.response?.data)
				return { status: 'ERROR', data: { data: [] } }
			}
		},
		enabled: true,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
		refetchOnMount: true, // Always refetch on component mount
		refetchOnWindowFocus: false, // Don't refetch on window focus
		retry: false,
	})
}

// Get bank accounts (Мои счета)
export const useBankAccounts = (params = {}) => {
	return useQuery({
		queryKey: ['bankAccounts', params],
		queryFn: async () => {
			console.log('useBankAccounts: Making request with params:', params)
			try {
				const result = await dashboardAPI.getBankAccounts(params)
				console.log('useBankAccounts: Response received:', result)
				return result
			} catch (error) {
				console.error('useBankAccounts: Error:', error)
				console.error('useBankAccounts: Error response:', error.response?.data)
				// Return empty data structure instead of throwing to prevent app crash
				return {
					status: 'ERROR',
					data: { data: { count: 0, response: [] } },
				}
			}
		},
		enabled: true, // projectId is now in config, so always enabled
		staleTime: 5 * 60 * 1000,
		retry: false, // Don't retry on error to prevent infinite loops
	})
}

// Get bank accounts using invoke_function planfact-plan-fact (POST)
export const useBankAccountsPlanFact = (params = {}) => {
	return useQuery({
		queryKey: ['bankAccountsPlanFact', params],
		queryFn: async () => {
			console.log('useBankAccountsPlanFact: Making request with params:', params)
			try {
				const { bankAccountsAPI } = await import('@/lib/api/ucode/bankAccounts')
				const result = await bankAccountsAPI.getBankAccountsInvokeFunction(params)
				console.log('useBankAccountsPlanFact: Response received:', result)
				return result
			} catch (error) {
				console.error('useBankAccountsPlanFact: Error:', error)
				console.error('useBankAccountsPlanFact: Error response:', error.response?.data)
				return { status: 'ERROR', data: { data: [] } }
			}
		},
		enabled: true,
		staleTime: 0, // Always consider data stale
		gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
		refetchOnMount: true, // Always refetch on component mount
		refetchOnWindowFocus: false, // Don't refetch on window focus
		retry: false,
	})
}

// Get currencies (Валюты)
export const useCurrencies = (params = {}) => {
	return useQuery({
		queryKey: ['currencies', params],
		queryFn: async () => {
			console.log('useCurrencies: Making request with params:', params)
			try {
				const { currenciesAPI } = await import('@/lib/api/ucode/currencies')
				const result = await currenciesAPI.getCurrenciesInvokeFunction(params)
				console.log('useCurrencies: Response received:', result)
				return result
			} catch (error) {
				console.error('useCurrencies: Error:', error)
				return {
					status: 'ERROR',
					data: { data: [] },
				}
			}
		},
		enabled: true,
		staleTime: 5 * 60 * 1000,
		retry: false,
	})
}

// Get counterparties (Контрагенты)
export const useCounterparties = (params = {}) => {
	return useQuery({
		queryKey: ['counterparties', params],
		queryFn: async () => {
			console.log('useCounterparties: Making request with params:', params)
			try {
				const result = await dashboardAPI.getCounterparties(params)
				console.log('useCounterparties: Response received:', result)
				return result
			} catch (error) {
				console.error('useCounterparties: Error:', error)
				console.error('useCounterparties: Error response:', error.response?.data)
				// Return empty data structure instead of throwing to prevent app crash
				return {
					status: 'ERROR',
					data: { data: { count: 0, response: [] } },
				}
			}
		},
		enabled: true,
		staleTime: 5 * 60 * 1000,
		retry: false, // Don't retry on error to prevent infinite loops
	})
}

// Get counterparties using v2/items/counterparties endpoint
export const useCounterpartiesV2 = (params = {}) => {
	return useQuery({
		queryKey: ['counterpartiesV2', params],
		queryFn: () => dashboardAPI.getCounterpartiesV2(params),
		enabled: true,
		staleTime: 5 * 60 * 1000,
	})
}

// Get counterparties using invoke_function planfact-plan-fact (POST)
export const useCounterpartiesPlanFact = (params = {}, enabled = true) => {
	return useQuery({
		queryKey: ['counterpartiesPlanFact', params],
		queryFn: async () => {
			console.log('useCounterpartiesPlanFact: Making request with params:', params)
			try {
				const { counterpartiesAPI } = await import('@/lib/api/ucode/counterparties')
				const result = await counterpartiesAPI.getCounterpartiesInvokeFunction(params)
				console.log('useCounterpartiesPlanFact: Response received:', result)
				return result
			} catch (error) {
				console.error('useCounterpartiesPlanFact: Error:', error)
				console.error('useCounterpartiesPlanFact: Error response:', error.response?.data)
				return { status: 'ERROR', data: { data: [] } }
			}
		},
		enabled: enabled,
		staleTime: 1000 * 60 * 60, // Consider data fresh for 1 hour
		gcTime: 2 * 60 * 60 * 1000, // Keep in cache for 2 hours
		refetchOnMount: 'always', // Always refetch when component mounts
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
		retry: false,
	})
}

// Get counterparty by ID
export const useCounterpartyById = (guid, enabled = true) => {
	console.log('useCounterpartyById called with guid:', guid, 'enabled:', enabled)

	return useQuery({
		queryKey: ['counterpartyById', guid],
		queryFn: async () => {
			console.log('useCounterpartyById: Making request for guid:', guid)
			try {
				const { counterpartiesAPI } = await import('@/lib/api/ucode/counterparties')
				const result = await counterpartiesAPI.getCounterpartyById(guid)
				console.log('useCounterpartyById: Response received:', result)
				return result
			} catch (error) {
				console.error('useCounterpartyById: Error:', error)
				console.error('useCounterpartyById: Error response:', error.response?.data)
				return { status: 'ERROR', data: null }
			}
		},
		enabled: enabled && !!guid,
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
		retry: false,
	})
}

// Create counterparty mutation
export const useCreateCounterparty = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: dashboardAPI.createCounterparty,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['counterpartiesPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesV2'] })
			queryClient.invalidateQueries({ queryKey: ['counterparties'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
			showSuccessNotification('Контрагент успешно создан!')
		},
		onError: error => {
			showErrorNotification(error.message || 'Ошибка при создании контрагента')
		},
	})
}

// Get counterparties groups using v2/items/counterparties_group endpoint
export const useCounterpartiesGroupsV2 = (params = {}) => {
	return useQuery({
		queryKey: ['counterpartiesGroupsV2', params],
		queryFn: () => dashboardAPI.getCounterpartiesGroupsV2(params),
		enabled: true,
		staleTime: 5 * 60 * 1000,
	})
}

// Get counterparties groups using invoke_function planfact-plan-fact (POST)
export const useCounterpartiesGroupsPlanFact = (params = {}) => {
	return useQuery({
		queryKey: ['counterpartiesGroupsPlanFact', params],
		queryFn: async () => {
			console.log('useCounterpartiesGroupsPlanFact: Making request with params:', params)
			try {
				const { counterpartiesAPI } = await import('@/lib/api/ucode/counterparties')
				const result = await counterpartiesAPI.getCounterpartiesGroupInvokeFunction(params)
				console.log('useCounterpartiesGroupsPlanFact: Response received:', result)
				return result
			} catch (error) {
				console.error('useCounterpartiesGroupsPlanFact: Error:', error)
				console.error('useCounterpartiesGroupsPlanFact: Error response:', error.response?.data)
				return { status: 'ERROR', data: { data: [] } }
			}
		},
		enabled: true,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnMount: true, // Always refetch on component mount
		refetchOnWindowFocus: false,
		retry: false,
	})
}

// Create counterparties group mutation
export const useCreateCounterpartiesGroup = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: dashboardAPI.createCounterpartiesGroup,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsV2'] })
			showSuccessNotification('Группа контрагентов успешно создана!')
		},
		onError: error => {
			showErrorNotification(error.message || 'Ошибка при создании группы контрагентов')
		},
	})
}

// Update counterparties group mutation
export const useUpdateCounterpartiesGroup = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: dashboardAPI.updateCounterpartiesGroup,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsV2'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesV2'] })
			showSuccessNotification('Группа контрагентов успешно обновлена!')
		},
		onError: error => {
			showErrorNotification(error.message || 'Ошибка при обновлении группы контрагентов')
		},
	})
}

// Delete counterparties groups mutation
export const useDeleteCounterpartiesGroups = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: dashboardAPI.deleteCounterpartiesGroups,
		onMutate: async guidsToDelete => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })

			// Сохраняем предыдущее состояние для отката
			const previousData = queryClient.getQueriesData({
				queryKey: ['counterpartiesGroupsPlanFact'],
			})

			// Оптимистично удаляем группы из кеша
			const guidsArray = Array.isArray(guidsToDelete) ? guidsToDelete : [guidsToDelete]

			queryClient.setQueriesData({ queryKey: ['counterpartiesGroupsPlanFact'] }, old => {
				if (!old) return old

				// Handle structure: { data: { data: { data: [...] } } }
				if (old.data?.data?.data && Array.isArray(old.data.data.data)) {
					return {
						...old,
						data: {
							...old.data,
							data: {
								...old.data.data,
								data: old.data.data.data.filter(item => !guidsArray.includes(item.guid)),
							},
						},
					}
				}

				// Handle structure: { data: { data: [...] } }
				if (old.data?.data && Array.isArray(old.data.data)) {
					return {
						...old,
						data: {
							...old.data,
							data: old.data.data.filter(item => !guidsArray.includes(item.guid)),
						},
					}
				}

				// Handle structure: { data: [...] }
				if (Array.isArray(old.data)) {
					return {
						...old,
						data: old.data.filter(item => !guidsArray.includes(item.guid)),
					}
				}

				return old
			})

			return { previousData }
		},
		onError: (error, variables, context) => {
			// Откатываем изменения при ошибке
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			showErrorNotification(error.message || 'Ошибка при удалении групп контрагентов')
		},
		onSuccess: () => {
			showSuccessNotification('Группы контрагентов успешно удалены!')
		},
		onSettled: () => {
			// Обновляем связанные запросы в фоне
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsV2'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesV2'] })
		},
	})
}

// Update counterparty mutation
export const useUpdateCounterparty = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: dashboardAPI.updateCounterparty,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['counterpartiesPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesV2'] })
			queryClient.invalidateQueries({ queryKey: ['counterparties'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
			showSuccessNotification('Контрагент успешно обновлен!')
		},
		onError: error => {
			showErrorNotification(error.message || 'Ошибка при обновлении контрагента')
		},
	})
}

// Delete counterparties mutation
export const useDeleteCounterparties = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: dashboardAPI.deleteCounterparties,
		onMutate: async guidsToDelete => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['counterpartiesPlanFact'] })

			// Сохраняем предыдущее состояние для отката
			const previousData = queryClient.getQueriesData({ queryKey: ['counterpartiesPlanFact'] })

			// Оптимистично удаляем контрагентов из кеша
			const guidsArray = Array.isArray(guidsToDelete) ? guidsToDelete : [guidsToDelete]

			queryClient.setQueriesData({ queryKey: ['counterpartiesPlanFact'] }, old => {
				if (!old) return old

				// Handle structure: { data: { data: { data: [...] } } }
				if (old.data?.data?.data && Array.isArray(old.data.data.data)) {
					return {
						...old,
						data: {
							...old.data,
							data: {
								...old.data.data,
								data: old.data.data.data.filter(item => !guidsArray.includes(item.guid)),
							},
						},
					}
				}

				// Handle structure: { data: { data: [...] } }
				if (old.data?.data && Array.isArray(old.data.data)) {
					return {
						...old,
						data: {
							...old.data,
							data: old.data.data.filter(item => !guidsArray.includes(item.guid)),
						},
					}
				}

				// Handle structure: { data: [...] }
				if (Array.isArray(old.data)) {
					return {
						...old,
						data: old.data.filter(item => !guidsArray.includes(item.guid)),
					}
				}

				return old
			})

			return { previousData }
		},
		onError: (error, variables, context) => {
			// Откатываем изменения при ошибке
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			showErrorNotification(error.message || 'Ошибка при удалении контрагента(ов)')
		},
		onSuccess: () => {
			// Invalidate all counterparties queries to refetch fresh data
			queryClient.invalidateQueries({ queryKey: ['counterpartiesV2'] })
			queryClient.invalidateQueries({ queryKey: ['counterparties'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['counterpartiesGroupsPlanFact'] })
			showSuccessNotification('Контрагент(ы) успешно удален(ы)!')
		},
	})
}

// Get operations list (Список операций) using v2/items/operations
export const useOperationsList = (params = {}) => {
	return useQuery({
		queryKey: ['operationsList', params],
		queryFn: async () => {
			console.log('useOperationsList: Making request with params:', params)
			try {
				const result = await dashboardAPI.getOperationsList(params)
				console.log('useOperationsList: Response received:', result)
				return result
			} catch (error) {
				console.error('useOperationsList: Error:', error)
				console.error('useOperationsList: Error response:', error.response?.data)
				// Return empty data structure instead of throwing to prevent app crash
				return {
					status: 'ERROR',
					data: { data: { count: 0, response: [] } },
				}
			}
		},
		enabled: true,
		staleTime: 0, // Always fetch fresh data
		gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
		placeholderData: previousData => previousData, // Keep previous data while fetching
		retry: false, // Don't retry on error to prevent infinite loops
	})
}

// Create chart of accounts mutation
export const useCreateChartOfAccounts = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: params => chartOfAccountsAPI.createChartOfAccount(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsV2'] })
			showSuccessNotification('Учетная статья успешно создана!')
		},
		onError: error => {
			showErrorNotification(error.message || 'Ошибка при создании учетной статьи')
		},
	})
}

// Update chart of accounts mutation
export const useUpdateChartOfAccounts = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: params => chartOfAccountsAPI.updateChartOfAccount(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsV2'] })
			showSuccessNotification('Учетная статья успешно обновлена!')
		},
		onError: error => {
			showErrorNotification(error.message || 'Ошибка при обновлении учетной статьи')
		},
	})
}

// Delete chart of accounts mutation
export const useDeleteChartOfAccounts = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: params => chartOfAccountsAPI.deleteChartOfAccount(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsV2'] })
			showSuccessNotification('Учетная статья успешно удалена!')
		},
	})
}

// Get my accounts (Мои счета) - v2/items/my_accounts
export const useMyAccountsV2 = (params = {}) => {
	return useQuery({
		queryKey: ['myAccountsV2', params],
		queryFn: () => dashboardAPI.getMyAccountsV2(params),
	})
}

// Create my account mutation
export const useCreateMyAccount = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.createMyAccount,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['myAccountsV2'] })
			queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
			queryClient.invalidateQueries({ queryKey: ['bankAccountsPlanFact'] })
			showSuccessNotification('Счет успешно создан!')
		},
		onError: error => {
			showErrorNotification(
				error.response?.data?.description || error.message || 'Ошибка при создании счета',
			)
		},
	})
}

// Update my account mutation
export const useUpdateMyAccount = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.updateMyAccount,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['myAccountsV2'] })
			queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
			queryClient.invalidateQueries({ queryKey: ['bankAccountsPlanFact'] })
			showSuccessNotification('Счет успешно обновлен!')
		},
		onError: error => {
			showErrorNotification(
				error.response?.data?.description || error.message || 'Ошибка при обновлении счета',
			)
		},
	})
}

// Delete my accounts mutation
export const useDeleteMyAccounts = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.deleteMyAccounts,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['myAccountsV2'] })
			queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
			queryClient.invalidateQueries({ queryKey: ['bankAccountsPlanFact'] })
			showSuccessNotification('Счета успешно удалены!')
		},
		onError: error => {
			showErrorNotification(
				error.response?.data?.description || error.message || 'Ошибка при удалении счетов',
			)
		},
	})
}

// Get legal entities (Юрлица) - v2/items/legal_entities
export const useLegalEntitiesV2 = (params = {}) => {
	return useQuery({
		queryKey: ['legalEntitiesV2', params],
		queryFn: () => dashboardAPI.getLegalEntitiesV2(params),
		enabled: true,
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		retry: false, // Don't retry on error to prevent infinite loops
	})
}

// Get legal entities using invoke_function planfact-plan-fact (POST)
export const useLegalEntitiesPlanFact = (params = {}) => {
	return useQuery({
		queryKey: ['legalEntitiesPlanFact', params],
		queryFn: async () => {
			console.log('useLegalEntitiesPlanFact: Making request with params:', params)
			try {
				const { legalEntitiesAPI } = await import('@/lib/api/ucode/legalEntities')
				const result = await legalEntitiesAPI.getLegalEntitiesInvokeFunction(params)
				console.log('useLegalEntitiesPlanFact: Response received:', result)
				return result
			} catch (error) {
				console.error('useLegalEntitiesPlanFact: Error:', error)
				console.error('useLegalEntitiesPlanFact: Error response:', error.response?.data)
				return { status: 'ERROR', data: { data: [] } }
			}
		},
		enabled: true,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
		refetchOnMount: true, // Always refetch on component mount
		refetchOnWindowFocus: false, // Don't refetch on window focus
		retry: false,
	})
}

// Get accounts groups (Группы счетов) - v2/items/accounts_group
export const useAccountsGroupsV2 = (params = {}) => {
	return useQuery({
		queryKey: ['accountsGroupsV2', params],
		queryFn: () => dashboardAPI.getAccountsGroupsV2(params),
		enabled: true,
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		retry: false, // Don't retry on error to prevent infinite loops
	})
}

// Create legal entity mutation
export const useCreateLegalEntity = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.createLegalEntity,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesV2'] })
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
			showSuccessNotification('Юрлицо успешно создано!')
		},
		onError: error => {
			showErrorNotification(
				error.response?.data?.description || error.message || 'Ошибка при создании юрлица',
			)
		},
	})
}

// Update legal entity mutation
export const useUpdateLegalEntity = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.updateLegalEntity,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesV2'] })
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
			showSuccessNotification('Юрлицо успешно обновлено!')
		},
		onError: error => {
			showErrorNotification(
				error.response?.data?.description || error.message || 'Ошибка при обновлении юрлица',
			)
		},
	})
}

// Delete legal entities mutation
export const useDeleteLegalEntities = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: dashboardAPI.deleteLegalEntities,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesV2'] })
			queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
			showSuccessNotification('Юрлицо успешно удалено!')
		},
		onError: error => {
			showErrorNotification(
				error.response?.data?.description || error.message || 'Ошибка при удалении юрлица',
			)
		},
	})
}

// Get finance summary
export const useFinanceSummary = params => {
	return useQuery({
		queryKey: ['financeSummary', params],
		queryFn: () => dashboardAPI.getFinanceSummary(params),
		staleTime: 1000 * 60 * 5, // 5 minutes
	})
}

// Get operations using invoke_function planfact-plan-fact (POST)
export const useOperationsPlanFact = (params = {}) => {
	return useQuery({
		queryKey: ['operationsPlanFact', params],
		queryFn: async () => {
			console.log('useOperationsPlanFact: Making request with params:', params)
			try {
				const result = await getOperations(params)
				console.log('useOperationsPlanFact: Response received:', result)
				return result
			} catch (error) {
				console.error('useOperationsPlanFact: Error:', error)
				console.error('useOperationsPlanFact: Error response:', error.response?.data)
				return { status: 'ERROR', data: { data: { data: [] } } }
			}
		},
		enabled: true,
		staleTime: 1 * 60 * 1000, // Cache for 1 minute
		retry: false,
	})
}

// Get single operation by GUID
export const useOperation = (guid, options = {}) => {
	return useQuery({
		queryKey: ['operation', guid],
		queryFn: async () => {
			console.log('useOperation: Making request for guid:', guid)
			try {
				const { operationsAPI } = await import('@/lib/api/ucode/operations')
				const result = await operationsAPI.getOperation(guid)
				console.log('useOperation: Response received:', result)
				return result
			} catch (error) {
				console.error('useOperation: Error:', error)
				console.error('useOperation: Error response:', error.response?.data)
				return { status: 'ERROR', data: null }
			}
		},
		enabled: !!guid && options.enabled !== false,
		staleTime: 0, // Always consider data stale to force refetch
		gcTime: 0, // Don't cache data
		refetchOnMount: true, // Always refetch on mount
		retry: false,
	})
}

// ============================================
// НОВАЯ АРХИТЕКТУРА ДЛЯ ОПЕРАЦИЙ
// ============================================

import { operationsAPI } from '@/lib/api/ucode/operations'

/**
 * Получить список операций с фильтрацией и пагинацией
 * @param {Object} params - Параметры запроса
 * @param {Object} params.dateRange - Диапазон дат {startDate, endDate}
 * @param {number} params.page - Номер страницы
 * @param {number} params.limit - Количество элементов
 * @param {Object} params.filters - Фильтры операций
 * @param {boolean} params.enabled - Включить/выключить запрос
 */
export const useOperationsListNew = (params = {}) => {
	const { enabled = true, ...queryParams } = params

	return useQuery({
		queryKey: ['operationsListNew', queryParams],
		queryFn: () => operationsAPI.getList(queryParams),
		enabled,
		staleTime: 30 * 1000, // 30 секунд
		gcTime: 5 * 60 * 1000, // 5 минут
		placeholderData: previousData => previousData,
		retry: 1,
	})
}

/**
 * Получить операцию по GUID
 * @param {string} guid - GUID операции
 * @param {boolean} enabled - Включить/выключить запрос
 */
export const useOperationByGuid = (guid, enabled = true) => {
	return useQuery({
		queryKey: ['operation', guid],
		queryFn: () => operationsAPI.getByGuid(guid),
		enabled: enabled && !!guid,
		staleTime: 60 * 1000, // 1 минута
		gcTime: 10 * 60 * 1000, // 10 минут
	})
}

/**
 * Создать операцию
 */
export const useCreateOperationNew = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: operationData => operationsAPI.create(operationData),
		onMutate: async newOperation => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['operationsList'] })

			// Сохраняем предыдущее состояние
			const previousData = queryClient.getQueriesData({ queryKey: ['operationsList'] })

			return { previousData }
		},
		onSuccess: (response, variables) => {
			// Добавляем новую операцию в кеш
			queryClient.setQueriesData({ queryKey: ['operationsList'] }, old => {
				if (!old?.data?.data?.data) return old

				// Получаем созданную операцию из ответа
				const newOp = response?.data?.data || variables

				return {
					...old,
					data: {
						...old.data,
						data: {
							...old.data.data,
							data: [newOp, ...old.data.data.data], // Добавляем в начало списка
						},
					},
				}
			})

			showSuccessNotification('Операция успешно создана!')
		},
		onError: (error, variables, context) => {
			// Откатываем изменения при ошибке
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			console.error('Error creating operation:', error)
			showErrorNotification(error.details?.description || 'Ошибка при создании операции')
		},
		onSettled: () => {
			// Обновляем связанные запросы в фоне
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
		},
	})
}

/**
 * Обновить операцию
 */
export const useUpdateOperationNew = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: operationData => operationsAPI.update(operationData),
		onMutate: async updatedOperation => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['operationsList'] })
			await queryClient.cancelQueries({ queryKey: ['operation', updatedOperation.guid] })

			// Сохраняем предыдущее состояние
			const previousData = queryClient.getQueriesData({ queryKey: ['operationsList'] })
			const previousOperation = queryClient.getQueryData(['operation', updatedOperation.guid])

			// Оптимистично обновляем операцию в списке
			queryClient.setQueriesData({ queryKey: ['operationsList'] }, old => {
				if (!old?.data?.data?.data) return old

				return {
					...old,
					data: {
						...old.data,
						data: {
							...old.data.data,
							data: old.data.data.data.map(op =>
								op.guid === updatedOperation.guid
									? { ...op, ...updatedOperation, data_obnovleniya: new Date().toISOString() }
									: op,
							),
						},
					},
				}
			})

			// Обновляем кеш конкретной операции
			queryClient.setQueryData(['operation', updatedOperation.guid], old => {
				return {
					...old,
					data: {
						...old?.data,
						...updatedOperation,
						data_obnovleniya: new Date().toISOString(),
					},
				}
			})

			return { previousData, previousOperation }
		},
		onSuccess: (data, variables) => {
			showSuccessNotification('Операция успешно обновлена!')
		},
		onError: (error, variables, context) => {
			// Откатываем изменения при ошибке
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			if (context?.previousOperation) {
				queryClient.setQueryData(['operation', variables.guid], context.previousOperation)
			}
			console.error('Error updating operation:', error)
			showErrorNotification(error.details?.description || 'Ошибка при обновлении операции')
		},
		onSettled: (data, error, variables) => {
			// Обновляем связанные запросы в фоне
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
		},
	})
}

/**
 * Удалить операции
 */
export const useDeleteOperationsNew = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: guids => operationsAPI.delete(guids),
		onMutate: async guidsToDelete => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({ queryKey: ['operationsList'] })

			// Сохраняем предыдущее состояние
			const previousData = queryClient.getQueriesData({ queryKey: ['operationsList'] })

			// Оптимистично удаляем операции из списка
			const guidsArray = Array.isArray(guidsToDelete) ? guidsToDelete : [guidsToDelete]

			queryClient.setQueriesData({ queryKey: ['operationsList'] }, old => {
				if (!old?.data?.data?.data) return old

				return {
					...old,
					data: {
						...old.data,
						data: {
							...old.data.data,
							data: old.data.data.data.filter(op => !guidsArray.includes(op.guid)),
						},
					},
				}
			})

			return { previousData }
		},
		onSuccess: () => {
			showSuccessNotification('Операции успешно удалены!')
		},
		onError: (error, variables, context) => {
			// Откатываем изменения при ошибке
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data)
				})
			}
			console.error('Error deleting operations:', error)
			showErrorNotification(error.details?.description || 'Ошибка при удалении операций')
		},
		onSettled: () => {
			// Обновляем связанные запросы в фоне
			queryClient.invalidateQueries({ queryKey: ['dashboard'] })
		},
	})
}

/**
 * Экспортировать операции
 */
export const useExportOperations = () => {
	return useMutation({
		mutationFn: params => operationsAPI.export(params),
		onSuccess: () => {
			showSuccessNotification('Экспорт успешно выполнен!')
		},
		onError: error => {
			console.error('Error exporting operations:', error)
			showErrorNotification(error.details?.description || 'Ошибка при экспорте операций')
		},
	})
}

/**
 * Получить структуру таблицы операций
 */
export const useOperationsTableStructure = () => {
	return useQuery({
		queryKey: ['operationsTableStructure'],
		queryFn: () => operationsAPI.getTableStructure(),
		staleTime: Infinity, // Структура таблицы не меняется
		gcTime: Infinity,
	})
}

/**
 * Получить отчет о движении денежных средств
 */
export const useCashFlowReport = (params = {}) => {
	return useQuery({
		queryKey: ['cashFlowReport', params],
		queryFn: async () => {
			console.log('useCashFlowReport: Making request with params:', params)
			try {
				const { getCashFlowReport } = await import('@/lib/api/ucode/cashflow')
				const result = await getCashFlowReport(params)
				console.log('useCashFlowReport: Response received:', result)
				return result
			} catch (error) {
				console.error('useCashFlowReport: Error:', error)
				return { status: 'ERROR', data: { data: { data: null } } }
			}
		},
		refetchOnMount: 'always',
		staleTime: 0,
		refetchOnWindowFocus: true,
		retry: false,
	})
}

/**
 * Universal useUcodeRequest globally accessible
 */
export const useUcodeRequestMutation = ({ mutationSetting = {} } = {}) => {
	return useMutation({
		mutationFn: ({ method, data }) => ucodeRequest({ method, data }),
		onError: error => {
			console.error('useUcodeRequestMutation Error:', error)

			// Handle specific "already exists" error for registration
			const errorMessage = error.message || error.details?.data || error.details?.description || ''
			if (
				errorMessage.includes('already exists') ||
				errorMessage.includes('уже существует') ||
				errorMessage.includes('already registered') ||
				errorMessage.includes('уже зарегистрирован')
			) {
				showErrorNotification('Пользователь с таким email уже существует')
				return
			}

			// console.log('error', error)

			showErrorNotification(
				error.message || error.details?.description || 'Ошибка при выполнении запроса',
			)
		},
		...mutationSetting,
	})
}

/**
 * Universal useUcodeRequestQuery globally accessible
 */
export const useUcodeRequestQuery = ({
	queryKey,
	method,
	data,
	skip = false,
	querySetting = {},
}) => {
	return useQuery({
		queryKey: [queryKey || method, data],
		queryFn: () => ucodeRequest({ method, data }),
		enabled: !skip,
		onError: error => {
			console.error('useUcodeRequestQuery Error:', error)
			showErrorNotification(
				error.details?.description || error.message || 'Ошибка при выполнении запроса',
			)
		},
		refetchOnMount: 'always',
		refetchOnWindowFocus: false,
		staleTime: 0,
		...querySetting,
	})
}

/**
 * Universal useUcodeRequestInfinite globally accessible
 */
export const useUcodeRequestInfinite = ({ method, data, skip = false, querySetting = {} }) => {
	return useInfiniteQuery({
		queryKey: [method, data],
		queryFn: ({ pageParam = 1 }) => ucodeRequest({ method, data: { ...data, page: pageParam } }),
		getNextPageParam: lastPage => {
			// Support both nested data.data.pagination and flat data.pagination structures
			const pagination = lastPage?.data?.data?.pagination ||
				lastPage?.data?.pagination || {
				page: lastPage?.data?.data?.page || lastPage?.data?.page,
				totalPages:
					lastPage?.data?.data?.totalPages ||
					lastPage?.data?.data?.total_pages ||
					lastPage?.data?.data?.page_count ||
					lastPage?.data?.totalPages ||
					lastPage?.data?.total_pages,
			}

			if (!pagination || pagination.page === undefined) return undefined

			const currentPage = Number(pagination.page)
			let totalPages = Number(
				pagination.totalPages || pagination.total_pages || pagination.page_count,
			)

			// Fallback: Calculate totalPages from total and limit if totalPages is missing but total is present
			if (isNaN(totalPages) || totalPages === 0) {
				const total = Number(lastPage?.data?.data?.total || lastPage?.data?.total || 0)
				const limit = Number(pagination.limit || 15) // Default limit fallback
				if (total > 0) {
					totalPages = Math.ceil(total / limit)
				}
			}

			return currentPage < totalPages ? currentPage + 1 : undefined
		},
		enabled: !skip,
		onError: error => {
			console.error('useUcodeRequestInfinite Error:', error)
			showErrorNotification(
				error.details?.description || error.message || 'Ошибка при выполнении запроса',
			)
		},
		placeholderData: prev => prev,
		...querySetting,
	})
}

// vaqtinchalik UcodeDefaultApi uchun
export const useUcodeDefaultApiMutation = ({ mutationKey = '' }) => {
	return useMutation({
		mutationKey: [mutationKey],
		mutationFn: ({ urlMethod, urlParams, data }) =>
			defaultUcodeApiRequest({ urlMethod, urlParams, data }),
		onError: error => {
			console.error('useUcodeDefaultApiMutation Error:', error)
		},
	})
}

export const useUcodeDefaultApiQuery = ({
	queryKey = '',
	urlMethod,
	urlParams,
	data,
	querySetting = {},
}) => {
	return useQuery({
		queryKey: [queryKey, data],
		queryFn: () => defaultUcodeApiRequest({ urlMethod, urlParams, data }),
		onError: error => {
			console.error('useUcodeDefaultApiQuery Error:', error)
		},
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		...querySetting,
	})
}
