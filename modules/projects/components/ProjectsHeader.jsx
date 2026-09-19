import IconButton from '@/components/shared/Buttons/IconButton'
import FilterButton from '@/components/shared/Filters/FilterButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  Download,
  LayoutList,
  List,
  Plus,
  Search,
} from 'lucide-react'
import HintQuestion from '@/components/shared/HintQuestion'
import styles from '../projects.module.scss'

/**
 * Шапка страницы «Проекты»: заголовок, кнопка создания, показатель анализа,
 * переключатель вида, поиск и меню экспорта.
 */
export default function ProjectsHeader({
  t,
  canAdd = true,
  searchValue,
  analysisMethod,
  methodOptions,
  viewMode,
  onSearch,
  onCreateProject,
  onCreateGroup,
  onMethodChange,
  onViewModeChange,
  onExport,
  onOpenFilters,
  filterCount = 0,
}) {
  return (
    <PageHeader
      className="sticky top-0 z-20 h-[60px] px-3"
      title={
        <span className="flex items-center gap-1.5">
          {t('pageTitle')}
          <HintQuestion size={16} className="text-neutral-300" />
        </span>
      }
      search={
        <div className="w-72">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
      }
      filters={
        <>
          <div className="w-60">
            <SingleSelect
              data={methodOptions}
              withSearch={false}
              value={analysisMethod}
              isClearable={false}
              onChange={onMethodChange}
              className="bg-white"
            />
          </div>

          {/* Переключатель вида списка */}
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={cn(styles.viewToggleBtn, viewMode === 'list' && styles.active)}
              onClick={() => onViewModeChange('list')}
              aria-label="list view"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              className={cn(styles.viewToggleBtn, viewMode === 'compact' && styles.active)}
              onClick={() => onViewModeChange('compact')}
              aria-label="compact view"
            >
              <LayoutList size={18} />
            </button>
          </div>

          <FilterButton onClick={onOpenFilters} count={filterCount} />
        </>
      }
      actions={
        <>
          <IconButton icon={Download} label={t('downloadExcel')} onClick={onExport} />

          {canAdd && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="primary-btn text-sm rounded-sm! gap-1.5">
                  <Plus size={16} />
                  {t('create')}
                  <ChevronDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 p-1.5" align="end">
                <DropdownMenuItem
                  onClick={onCreateProject}
                  className="w-full cursor-pointer text-sm px-2 py-2 rounded-md outline-none"
                >
                  {t('createProject')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onCreateGroup}
                  className="w-full cursor-pointer text-sm px-2 py-2 rounded-md outline-none"
                >
                  {t('createGroup')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      }
    />
  )
}
