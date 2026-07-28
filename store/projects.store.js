import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

// Все статусы проекта — по умолчанию показываем все
const ALL_STATUSES = ['planned', 'in_progress', 'completed']

class ProjectsStore {
  // Фильтр «Статус проекта»
  statuses = [...ALL_STATUSES]
  // Период проекта (диапазон) + активный пресет — как на странице Операции
  dateRange = { start: null, end: null }
  dateRangeType = ''
  // Выбранные проекты
  selectedProjects = []
  // Архив
  showActive = true
  showArchived = true
  // Показатель для анализа: 'cash' | 'accrual'
  analysisMethod = 'cash'
  // Вид списка: 'list' | 'compact'
  viewMode = 'list'
  search = ''

  constructor() {
    makeAutoObservable(this)

    if (typeof window !== 'undefined') {
      makePersistable(this, {
        name: 'projects_filters',
        properties: [
          'statuses',
          'dateRange',
          'dateRangeType',
          'selectedProjects',
          'showActive',
          'showArchived',
          'analysisMethod',
          'viewMode',
          'search',
        ],
        storage: window.localStorage,
        debugMode: false,
      })
    }
  }

  setState = (fieldName, value) => {
    this[fieldName] = value
  }

  // Переключение статуса в списке фильтра
  toggleStatus = (status) => {
    if (this.statuses.includes(status)) {
      this.statuses = this.statuses.filter((s) => s !== status)
    } else {
      this.statuses = [...this.statuses, status]
    }
  }

  resetFilters = () => {
    this.statuses = [...ALL_STATUSES]
    this.dateRange = { start: null, end: null }
    this.dateRangeType = ''
    this.selectedProjects = []
    this.showActive = true
    this.showArchived = true
    this.search = ''
  }
}

export const projectsStore = new ProjectsStore()
