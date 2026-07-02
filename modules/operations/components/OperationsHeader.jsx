// components/OperationsHeader.jsx
import Input from '@/components/shared/Input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, EllipsisVertical, Loader2, Search, Upload } from 'lucide-react'

/**
 * Sticky page header: title, create button, search, import, export.
 */
export default function OperationsHeader({
  t,
  isMounted,
  canAdd,
  isImporting,
  isExporting,
  searchQuery,
  onSearch,
  onCreate,
  onImport,
  onExport,
}) {
  return (
    <div className="h-16 px-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{t('page.title')}</h1>
        {isMounted && canAdd && (
          <button onClick={onCreate} className="primary-btn">
            {t('page.create')}
          </button>
        )}
      </div>

      <div className="flex items-center justify-self-center gap-2">
        <Input
          type="text"
          leftIcon={<Search size={20} />}
          placeholder={t('page.searchPlaceholder')}
          value={searchQuery}
          className="w-[300px]"
          onChange={onSearch}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="primary-btn"
              disabled={isImporting || isExporting}
            >
              {(isImporting || isExporting) ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <EllipsisVertical size={18} />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 p-2" align="end">
            <DropdownMenuItem
              onClick={onImport}
              disabled={isImporting}
              className="w-full flex items-center cursor-pointer text-sm gap-2 justify-start outline-none"
            >
              <Upload size={16} />
              <span>{t('page.import')}</span>
              {isImporting && <Loader2 size={14} className="animate-spin ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onExport}
              disabled={isExporting}
              className="w-full flex items-center cursor-pointer text-sm gap-2 justify-start outline-none"
            >
              <Download size={16} />
              <span>{t('page.export')}</span>
              {isExporting && <Loader2 size={14} className="animate-spin ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}