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
  EllipsisVertical,
  HelpCircle,
  LayoutList,
  List,
  Search,
} from 'lucide-react'
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
}) {
  return (
    <header className="flex items-center justify-between px-3 h-[60px] sticky top-0 bg-white z-20">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-1.5">
          <h1 className={styles.title}>{t('pageTitle')}</h1>
          <HelpCircle size={16} className="text-neutral-300" />
        </div>

        {canAdd && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="primary-btn text-sm rounded-sm! gap-1.5">
                {t('create')}
                <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 p-1.5" align="start">
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
      </div>

      <div className="flex items-center gap-2">
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

        <div className="w-72">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="secondary-btn h-9 px-2.5">
              <EllipsisVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44 p-2" align="end">
            <DropdownMenuItem
              onClick={onExport}
              className="w-full flex items-center cursor-pointer text-sm gap-2 justify-start outline-none"
            >
              <Download size={16} />
              <span>{t('downloadExcel')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
