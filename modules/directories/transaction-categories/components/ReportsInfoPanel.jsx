const ReportsInfoPanel = ({ t }) => (
	<div className="w-1/2 px-6 pt-6 mx-auto">
		<p className="text-sm text-slate-500 mb-6 text-center">
			{t('info.title')}
		</p>

		<div className="flex gap-4">
			{/* Left Column - 2 cards vertically */}
			<div className="flex-1">
				<div className="flex flex-col gap-4">
					{/* Cash Flow */}
					<div className="bg-white rounded-lg border border-primary p-4">
						<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">{t('reports.cashFlow.title')}</h3>

						<div className="flex flex-col gap-3">
							{['operational', 'investment', 'financial'].map((section, i) => (
								<div key={section} className={i > 0 ? "flex flex-col pt-2 border-t border-gray-200" : "flex flex-col"}>
									<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">{t(`reports.cashFlow.${section}`)}</div>
									<div className="flex flex-col gap-0.5 ml-4">
										<div className="text-sm text-slate-700">{t('reports.cashFlow.receipts')}</div>
										<div className="text-sm text-slate-700">{t('reports.cashFlow.payments')}</div>
									</div>
								</div>
							))}

							<div className="flex flex-col pt-3 border-t border-gray-300">
								<div className="text-[15px] font-bold text-slate-900">{t('reports.cashFlow.total')}</div>
							</div>
						</div>
					</div>

					{/* P&L */}
					<div className="bg-white rounded-lg border border-primary p-4">
						<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">{t('reports.pAndL.title')}</h3>

						<div className="flex flex-col gap-3">
							<div className="flex flex-col">
								<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
									<span>{t('reports.pAndL.income')}</span>
									<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
								</div>
								<div className="flex flex-col gap-0.5 ml-4">
									<div className="text-sm text-slate-700">{t('reports.pAndL.incomeItems.goodsSales')}</div>
									<div className="text-sm text-slate-700">{t('reports.pAndL.incomeItems.services')}</div>
									<div className="text-sm text-slate-700">{t('reports.pAndL.incomeItems.other')}</div>
								</div>
							</div>

							<div className="flex flex-col pt-2 border-t border-gray-200">
								<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-xs text-red-500">{t('reports.pAndL.minus')}</span>
										<span>{t('reports.pAndL.expenses')}</span>
									</div>
									<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
								</div>
								<div className="flex flex-col gap-0.5 ml-4">
									{['productionStaff', 'goodsPurchase', 'adminStaff', 'rent', 'other'].map(key => (
										<div key={key} className="text-sm text-slate-700">{t(`reports.pAndL.expenseItems.${key}`)}</div>
									))}
									<div className="text-sm text-slate-700 ml-4">
										{t('reports.pAndL.expenseItems.bankServices')}
									</div>
									<div className="text-sm text-slate-700 ml-4 flex items-center gap-2">
										<span className="px-2 py-0.5 text-[10px] bg-slate-400 text-white rounded">{t('reports.pAndL.expenseItems.soon')}</span>
										<span>{t('reports.pAndL.expenseItems.exchangeDiff')}</span>
									</div>
									<div className="text-sm text-slate-700 ml-4">
										{t('reports.pAndL.expenseItems.depreciation')}
									</div>
									<div className="text-sm text-slate-700 ml-4">
										{t('reports.pAndL.expenseItems.interest')}
									</div>
									<div className="text-sm text-slate-700 ml-4">
										{t('reports.pAndL.expenseItems.incomeTax')}
									</div>
								</div>
							</div>

							<div className="flex flex-col pt-3 border-t border-gray-300">
								<div className="text-[15px] font-bold text-slate-900">{t('reports.pAndL.undistributedProfit')}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Right Column - 1 big card */}
			<div className="flex-1 pb-10">
				{/* Balance */}
				<div className="bg-white rounded-lg border border-primary p-4 h-full">
					<h3 className="text-lg font-bold text-slate-900 mb-3 pb-3 border-b border-gray-200">{t('reports.balance.title')}</h3>

					<div className="flex flex-col gap-3">
						{/* Current Assets */}
						<div className="flex flex-col">
							<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
								<span>{t('reports.balance.currentAssets.title')}</span>
								<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
							</div>
							<div className="flex flex-col gap-0.5 ml-4">
								{['receivables', 'cash', 'inventory', 'other'].map(k => (
									<div key={k} className="text-sm text-slate-700">{t(`reports.balance.currentAssets.${k}`)}</div>
								))}
								<div className="text-sm text-slate-700 ml-4">
									{t('reports.balance.currentAssets.advancePayments')}
								</div>
								<div className="text-sm text-slate-700 ml-4">
									{t('reports.balance.currentAssets.loansShort')}
								</div>
							</div>
						</div>

						{/* Non-Current Assets */}
						<div className="flex flex-col pt-2 border-t border-gray-200">
							<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span>{t('reports.balance.nonCurrentAssets.title')}</span>
									<span className="px-2 py-0.5 text-[11px] bg-slate-600 text-white rounded font-medium">{t('reports.balance.nonCurrentAssets.and')}</span>
								</div>
							</div>
							<div className="flex flex-col gap-0.5 ml-4">
								{['fixedAssets', 'equipment', 'transport', 'other'].map(k => (
									<div key={k} className="text-sm text-slate-700">{t(`reports.balance.nonCurrentAssets.${k}`)}</div>
								))}
								{['loansLong', 'financialInvestments', 'intangible'].map(k => (
									<div key={k} className="text-sm text-slate-700 ml-4">{t(`reports.balance.nonCurrentAssets.${k}`)}</div>
								))}
							</div>
						</div>

						<div className="flex flex-col pt-3 border-t border-gray-300">
							<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.totalAssets')}</div>
						</div>

						{/* Current Liabilities */}
						<div className="flex flex-col pt-2 border-t border-gray-200">
							<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
								<span>{t('reports.balance.currentLiabilities.title')}</span>
								<span className="px-2 py-0.5 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">0</span>
							</div>
							<div className="flex flex-col gap-0.5 ml-4">
								{['payables', 'other'].map(k => (
									<div key={k} className="text-sm text-slate-700">{t(`reports.balance.currentLiabilities.${k}`)}</div>
								))}
								{['thirdParty', 'loansShort'].map(k => (
									<div key={k} className="text-sm text-slate-700 ml-4">{t(`reports.balance.currentLiabilities.${k}`)}</div>
								))}
							</div>
						</div>

						{/* Long-Term Liabilities */}
						<div className="flex flex-col pt-2 border-t border-gray-200">
							<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span>{t('reports.balance.longTermLiabilities.title')}</span>
									<span className="px-2 py-0.5 text-[11px] bg-primary text-white rounded font-medium">{t('reports.balance.longTermLiabilities.fin')}</span>
								</div>
							</div>
							<div className="flex flex-col gap-0.5 ml-4">
								{['credits', 'other'].map(k => (
									<div key={k} className="text-sm text-slate-700">{t(`reports.balance.longTermLiabilities.${k}`)}</div>
								))}
								<div className="text-sm text-slate-700 ml-4">
									{t('reports.balance.longTermLiabilities.loansLong')}
								</div>
							</div>
						</div>

						<div className="flex flex-col pt-3 border-t border-gray-300">
							<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.totalLiabilities')}</div>
						</div>

						{/* Capital */}
						<div className="flex flex-col pt-2 border-t border-gray-200">
							<div className="text-[15px] font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span>{t('reports.balance.capital.title')}</span>
									<span className="px-2 py-0.5 text-[11px] bg-primary text-white rounded font-medium">{t('reports.balance.capital.fin')}</span>
								</div>
							</div>
							<div className="flex flex-col gap-0.5 ml-4">
								<div className="text-sm text-slate-700">{t('reports.balance.capital.founderInvestments')}</div>
								<div className="text-sm text-slate-700 flex items-center gap-2">
									<span className="text-xs text-green-500">{t('reports.balance.capital.plus')}</span>
									<span>{t('reports.balance.capital.undistributedProfit')}</span>
								</div>
							</div>
						</div>

						<div className="flex flex-col pt-3 border-t border-gray-300">
							<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.totalCapital')}</div>
						</div>

						<div className="flex flex-col pt-3 border-t-2 border-slate-900">
							<div className="text-[15px] font-bold text-slate-900">{t('reports.balance.balanceEquation')}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
)

export default ReportsInfoPanel
