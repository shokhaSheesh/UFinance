// components/ImportErrorModal.jsx
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
      <CustomDialog
        open={isOpen}
        onClose={onClose}
        contentClass="p-6 rounded-xl w-[400px]"
      >
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-neutral-800">
            {t('page.importErrorTitle')}
          </h2>
          <p className="text-sm text-neutral-600">
            {t('page.importErrorDescription')}
          </p>

          {data?.errors?.length > 0 && (
            <div className="bg-red-50 p-3 rounded-md max-h-32 overflow-y-auto">
              <ul className="text-xs text-red-600 list-disc pl-4">
                {data.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-sky-500 hover:bg-gray-50 rounded-md transition-colors"
            >
              {t('page.cancel')}
            </button>

            {data?.failedExport?.file_url && (
              <button
                type="button"
                onClick={() => {
                  const url  = `https://cdn.u-code.io/${data.failedExport.file_url}`
                  const name = data.failedExport.file_name || 'import_failed.xlsx'
                  handleDownload(url, name)
                }}
                className="px-4 py-2 cursor-pointer text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                {t('page.downloadErrorFile')}
              </button>
            )}
          </div>
        </div>
      </CustomDialog>
    </Suspense>
  )
}