import IconButton from '@/components/shared/Buttons/IconButton'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  Download,
  Plus,
} from 'lucide-react'
import HintQuestion from '@/components/shared/HintQuestion'

/**
 * Шапка страницы «Проекты»: заголовок, кнопка создания, показатель анализа,
 * переключатель вида, поиск и меню экспорта.
 */
export default function ProjectsHeader({
  t,
  canAdd = true,
  onCreateProject,
  onCreateGroup,
  onExport,
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
