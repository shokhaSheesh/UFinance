export const TAB_TO_API_NAME = {
	income: 'Доходы',
	expense: 'Расходы',
	assets: 'Актив',
	liabilities: 'Обязательства',
	capital: 'Капитал',
}

export function convertToCategory(node, level = 0) {
	const isStatic = node?.static === true

	return {
		id: node?.guid || `temp-${node?.nazvanie}-${level}`,
		guid: node?.guid,
		name: node?.nazvanie,
		hasMenu: !!node?.guid,
		hasLock: isStatic,
		isStatic: isStatic,
		children: node?.children ? node.children.map(child => convertToCategory(child, level + 1)) : undefined,
		balans: node?.balans,
		komentariy: node?.komentariy,
		tip: node?.tip,
		tip_operatsii: node?.tip_operatsii,
		chart_of_accounts_id_2: node?.chart_of_accounts_id_2,
		level: level,
	}
}
