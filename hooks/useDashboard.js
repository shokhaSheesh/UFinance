import { dashboardAPI } from '@/lib/api/dashboard'
import { defaultUcodeApiRequest, ucodeRequest } from '@/lib/api/ucode/base'
import { chartOfAccountsAPI } from '@/lib/api/ucode/chartOfAccounts'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient
} from '@tanstack/react-query'


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

// ============================================
// НОВАЯ АРХИТЕКТУРА ДЛЯ ОПЕРАЦИЙ
// ============================================

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
export const useUcodeDefaultApiMutation = (options = {}) => {
	const { mutationKey = '' } = options
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
