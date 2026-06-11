'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import { Loader, Save } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { showErrorNotification } from '@/lib/utils/notifications'
import {
  uploadContractHtml,
  useUpdateContract,
} from '@/modules/settings/contract/hooks/useContractData'

const ContractEditDialog = ({ contract, onClose, onSuccess, tco, branchId }) => {
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef(null)
  const fullHtmlRef = useRef('')

  useEffect(() => {
    if (!contract?.file) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetch(contract?.file)
      .then((r) => r?.text())
      .then((html) => {
        if (cancelled) return
        fullHtmlRef.current = html
        const iframe = iframeRef?.current
        if (!iframe) return
        const doc = iframe?.contentDocument
        doc?.open()
        doc?.write(html)
        doc?.close()
        if (doc) doc.designMode = 'on'
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) showErrorNotification(tco?.('editDialog.loading'))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contract?.file, tco])

  const { mutate, isPending } = useUpdateContract({
    contractGuid: contract?.guid,
    branchId,
    onSuccess,
    tco,
  })

  const handleSave = async () => {
    const doc = iframeRef?.current?.contentDocument
    if (!doc) return
    setIsSaving(true)
    try {
      const html = doc?.documentElement?.outerHTML
      const contractFileLink = await uploadContractHtml({
        html,
        fileName: contract?.branch_name,
      })

      mutate({
        guid: contract?.guid,
        branch_id: contract?.branch_id,
        company_id: contract?.company_id,
        file: contractFileLink,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      showErrorNotification(tco?.('editDialog.uploadError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <CustomDialog
      open={true}
      onClose={onClose}
      contentClass="min-w-[1000px] max-w-[95vw] max-h-[90vh] p-0 flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{tco?.('editDialog.title')}</h2>
          {contract?.branch_name && (
            <p className="text-sm text-slate-500 mt-0.5">{contract?.branch_name}</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-[500px] max-h-[75vh] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Loader className="animate-spin text-slate-400" size={24} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="contract-editor"
          className="flex-1 w-full border-0"
          style={{ minHeight: 0 }}
        />
      </div>

      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending || isSaving}
          className="px-4 py-2 text-sm font-medium text-slate-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {tco?.('editDialog.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || isSaving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0E73F6] text-white text-sm font-medium rounded-lg hover:bg-[#0a5fd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isSaving ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {tco?.('editDialog.save')}
        </button>
      </div>
    </CustomDialog>
  )
}

export default ContractEditDialog
