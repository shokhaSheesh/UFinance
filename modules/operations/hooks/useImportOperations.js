// hooks/useImportOperations.js
import { apiClient } from '@/lib/api/ucode/base'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { useState } from 'react'

/**
 * Handles the full XLSX import flow:
 * - File picker
 * - Upload to CDN
 * - Call import_operations
 * - Surface per-row errors in a modal
 */
export function useImportOperations({ t, queryClient }) {
  const [isImporting, setIsImporting] = useState(false)
  const [importErrorModalOpen, setImportErrorModalOpen] = useState(false)
  const [importErrorData, setImportErrorData] = useState(null)

  const handleImportOperations = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'

    input.onchange = async (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        setIsImporting(true)

        // 1. Upload to CDN
        const formData = new FormData()
        formData.append('file', file, file.name)

        const uploadResponse = await fetch(
          'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${authStore.authToken}` },
            body: formData,
          }
        )

        if (!uploadResponse.ok) throw new Error('Failed to upload file')

        const uploadData = await uploadResponse.json()
        const fileLink = uploadData?.data?.link
        if (!fileLink) throw new Error('File link not returned from upload')

        // 2. Call import function
        const importResult = await apiClient.invokeFunction({
          method: 'import_operations',
          data: { url: `https://cdn.u-code.io/${fileLink}` },
        })

        const errors = importResult?.data?.errors || []
        const failedExport = importResult?.data?.failed_rows_export

        if (errors.length > 0) {
          setImportErrorData({ errors, failedExport })
          setImportErrorModalOpen(true)
        } else {
          showSuccessNotification(t('page.importedSuccess'))
        }
      } catch (err) {
        console.error('Error importing operations:', err)
        showErrorNotification(t('page.importFailed'))
      } finally {
        setIsImporting(false)
        queryClient.invalidateQueries({ queryKey: ['find_operations'] })
      }
    }

    input.click()
  }

  return {
    isImporting,
    importErrorModalOpen,
    setImportErrorModalOpen,
    importErrorData,
    handleImportOperations,
  }
}