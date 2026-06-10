import { apiClient } from '@/lib/api/ucode/base'
import { queryClient } from '@/lib/queryClient'
import { appStore } from '@/store/app.store'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { convertToCategory, TAB_TO_API_NAME } from '../utils/categoryUtils'

export function useCategoriesData(searchQuery) {
	const [activeTab, setActiveTab] = useState('income')
	const [expandedCategories, setExpandedCategories] = useState([])
	const [closingCategories, setClosingCategories] = useState([])
	const [selectedCategory, setSelectedCategory] = useState(null)

	const categoriesPermissions = appStore.permission.directories.transactionCategories

	const { data: chartOfAccountsData, isLoading, error } = useQuery({
		queryKey: ['get_chart_of_accounts'],
		queryFn: () => apiClient.invokeFunction({
			method: 'get_chart_of_accounts',
			data: {
				page: 1,
				limit: 100,
				search: searchQuery?.trim() || undefined,
			}
		}),
		placeholderData: keepPreviousData,
		select: (response) => response?.data?.data
	})

	const chartOfAccountsTree = chartOfAccountsData || []

	const categories = (() => {
		if (!Array.isArray(chartOfAccountsTree) || chartOfAccountsTree.length === 0) {
			return []
		}

		const rootName = TAB_TO_API_NAME[activeTab]
		if (!rootName) return []

		const rootNode = chartOfAccountsTree.find(node => node?.nazvanie === rootName)
		if (!rootNode || !rootNode?.children) {
			return []
		}

		return rootNode.children.map(child => convertToCategory(child, 0))
	})()

	const deleteMutation = useMutation({
		mutationKey: ['delete_chartofaccount'],
		mutationFn: (data) => apiClient.invokeFunction({ method: "delete_chart_of_account", data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsPlanFact'] })
			queryClient.invalidateQueries({ queryKey: ['chartOfAccountsV2'] })
		},
		onError: (err) => {
			console.log('error', err)
		}
	})

	const toggleCategory = useCallback(
		(id) => {
			if (expandedCategories.includes(id)) {
				const findAllChildren = (parentId) => {
					const children = []
					const parent = categories.find(c => c.id === parentId)
					if (parent?.children) {
						parent.children.forEach(child => {
							if (expandedCategories.includes(child.id)) {
								children.push(child.id)
								if (child.children) {
									children.push(...findAllChildren(child.id))
								}
							}
						})
					}
					return children
				}

				const allToClose = [id, ...findAllChildren(id)]

				setClosingCategories(prev => [...prev, ...allToClose])
				setTimeout(() => {
					setExpandedCategories(prev => prev.filter(cid => !allToClose.includes(cid)))
					setClosingCategories(prev => prev.filter(cid => !allToClose.includes(cid)))
				}, 250)
			} else {
				setExpandedCategories(prev => [...prev, id])
			}
		},
		[expandedCategories, categories],
	)

	const handleTabChange = (tabKey) => {
		setActiveTab(tabKey)
		setExpandedCategories([])
		setClosingCategories([])
		setSelectedCategory(null)
	}

	return {
		activeTab,
		categories,
		expandedCategories,
		closingCategories,
		selectedCategory,
		setSelectedCategory,
		isLoading,
		error,
		categoriesPermissions,
		deleteMutation,
		toggleCategory,
		handleTabChange,
	}
}
