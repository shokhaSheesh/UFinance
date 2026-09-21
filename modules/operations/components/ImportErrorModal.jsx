// components/ImportErrorModal.jsx
import { TriangleAlert } from 'lucide-react'
import { DialogBody, DialogFooter, DialogHeader } from '@/components/shared/CustomDialog'
import { handleDownload } from '@/utils/helpers'
import { Suspense } from 'react'

/**
 * Modal shown when the operations import has per-row errors.
 * Receives the lazy-loaded CustomDialog as a prop so this file
 * itself stays out of the initial bundle.
 */
export default function ImportErrorModal({ t, isOpen, data, onClose, CustomDialog }) {
  if (!isOpen) return null

  return (
    <Suspense fallback={null}>
      <CustomDialog open={isOpen} onClose={onClose} contentClass="w-[480px]">
        <DialogHeader icon={TriangleAlert} tone="danger" title={t('page.importErrorTitle')} onClose={onClose} />
        <DialogBody className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">{t('page.importErrorDescription')}</p>
          {data?.errors?.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 p-3">
              <ul className="list-disc pl-4 text-xs text-red-600">
                {data.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={onClose} className="secondary-btn h-9">
            {t('page.cancel')}
          </button>
          {data?.failedExport?.file_url && (
            <button
              type="button"
              onClick={() => {
                const url = `https://cdn.u-code.io/${data.failedExport.file_url}`
                const name = data.failedExport.file_name || 'import_failed.xlsx'
                handleDownload(url, name)
              }}
              className="primary-btn"
            >
              {t('page.downloadErrorFile')}
            </button>
          )}
        </DialogFooter>
      </CustomDialog>
    </Suspense>
  )
}