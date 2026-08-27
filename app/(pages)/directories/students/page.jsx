import CounterpartiesListPage from '@/modules/directories/counterparties/CounterpartiesListPage'

// Студенты — те же контрагенты, но с признаком is_student
const StudentsPage = () => <CounterpartiesListPage isStudent />

export default StudentsPage
