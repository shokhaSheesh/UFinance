'use client'

import useIsMobile from '@/hooks/useIsMobile'
import OperationsMobilePage from '@/modules/operations/mobile'
import OperationsListPage from '@/modules/operations/list-page'

/**
 * Операции: таблица на большом экране, список с панелями — на телефоне.
 * Маршрут один, поэтому ссылки и закладки работают на обоих устройствах.
 */
const OperationsPage = () => {
	const isMobile = useIsMobile()

	if (isMobile === null) return null
	return isMobile ? <OperationsMobilePage /> : <OperationsListPage />
}

export default OperationsPage
