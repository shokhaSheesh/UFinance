const PnLEmptyState = () => (
  <div className="flex mx-auto flex-1 flex-col h-full justify-center items-center py-20 text-center">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: '16px', opacity: 0.3 }}>
      <path d="M8 16C8 11.5817 11.5817 8 16 8H48C52.4183 8 56 11.5817 56 16V48C56 52.4183 52.4183 56 48 56H16C11.5817 56 8 52.4183 8 48V16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16 24H48M16 32H48M16 40H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <p style={{ fontSize: '16px', color: '#667085', marginBottom: '8px' }}>Выберите период для отображения отчета</p>
    <p style={{ fontSize: '14px', color: '#98A2B3' }}>Используйте фильтры слева для настройки параметров отчета</p>
  </div>
)

export default PnLEmptyState
