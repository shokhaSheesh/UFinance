'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import {
  Loader,
  Pencil,
  Save
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { apiClient } from '../../../../lib/api/ucode/base'
import { queryClient } from '../../../../lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '../../../../lib/utils/notifications'
import { authStore } from '../../../../store/auth.store'

const ContractPage = observer(() => {
  const tco = useTranslations('Settings.contract')
  const tc = useTranslations('Settings.common')
  const branchId = authStore.branch_id
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['get_contract', branchId],
    queryFn: () =>
      apiClient.defaultUcodeFunction({ urlMethod: 'GET', urlParams: `/items/templates?from-ofs=true` }),
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    select: (data) => data?.data?.data?.response,
  })

  const contracts =
    data?.map((item) => ({
      branch_id: item?.branch_id || '',
      file: item?.file || '',
      company_id: item?.company_id || '',
      guid: item?.guid,
      branch_name: item?.branch_id_data?.name,
    })) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full p-6 gap-4 overflow-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{tco('pageTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{tco('subtitle')}</p>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{tco('branch')}</th>
              <th className="text-left px-4 py-3 font-medium">{tco('file')}</th>
              <th className="text-right px-4 py-3 font-medium w-32">{tco('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  {tco('empty')}
                </td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.guid} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-slate-900">{c.branch_name || '—'}</td>
                  <td className="px-4 py-3">
                    {c.file ? (
                      <a
                        href={c.file}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0E73F6] hover:underline truncate inline-block max-w-[420px] align-middle"
                      >
                        {c.file.split('/').pop()}
                      </a>
                    ) : (
                        <span className="text-slate-400">{tc('noData')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#0E73F6] border border-[#0E73F6]/30 rounded-md hover:bg-[#0E73F6]/5"
                      >
                        <Pencil size={14} />
                        {tco('edit')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ContractEditDialog
          contract={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['get_contract', branchId] })
            setEditing(null)
          }}
        />
      )}
    </div>
  )
})

// ─── Toolbar button ──────────────────────────────────────────────────────────
function ToolBtn({ onClick, title, children, active }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault() // keep iframe focus
        onClick()
      }}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${active ? 'bg-gray-200 text-[#0E73F6]' : 'text-slate-600'}`}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <span className="mx-0.5 h-5 w-px bg-gray-300 self-center" />
}

// ─── Contract edit dialog ────────────────────────────────────────────────────
function ContractEditDialog({ contract, onClose, onSuccess }) {
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef(null)
  const fullHtmlRef = useRef('')

  // Load full HTML into iframe and enable editing
  useEffect(() => {
    if (!contract?.file) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetch(contract.file)
      .then((r) => r.text())
      .then((html) => {
        if (cancelled) return
        fullHtmlRef.current = html
        const iframe = iframeRef.current
        if (!iframe) return
        const doc = iframe.contentDocument
        doc.open()
        doc.write(html)
        doc.close()
        doc.designMode = 'on'
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) showErrorNotification(tco('editDialog.loading'))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [contract?.file])

  const exec = (cmd, value = null) => {
    iframeRef.current?.contentDocument?.execCommand(cmd, false, value)
    iframeRef.current?.contentWindow?.focus()
  }

  const { mutate, isPending } = useMutation({
    mutationKey: ['update_contract', contract?.guid],
    mutationFn: (payload) =>
      apiClient.defaultUcodeFunction({
        urlMethod: 'PUT',
        urlParams: `/items/templates?from-ofs=true`,
        data: payload,
      }),
    onSuccess: () => {
      showSuccessNotification(tco('editDialog.save'))
      onSuccess?.()
    },
    onError: () => {
      showErrorNotification(tco('editDialog.saveError'))
    },
  })

  const handleSave = async () => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    setIsSaving(true)
    try {
      // Get the full edited document HTML (preserves doctype + head + updated body)
      const html = doc.documentElement.outerHTML
      const formData = new FormData()
      const htmlBlob = new Blob([html], { type: 'text/html' })
      formData.append('file', htmlBlob, `${contract?.branch_name || 'contract'}.html`)

      const uploadResponse = await fetch(
        'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${authStore.authToken}` },
          body: formData,
        },
      )
      const uploadData = await uploadResponse.json()
      const fileLink = uploadData?.data?.link
      const contractFileLink = fileLink ? `https://cdn.u-code.io/${fileLink}` : ''

      mutate({
        guid: contract.guid,
        branch_id: contract.branch_id,
        company_id: contract.company_id,
        file: contractFileLink,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      showErrorNotification(tco('editDialog.uploadError'))
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
          <h2 className="text-lg font-bold text-slate-900">{tco('editDialog.title')}</h2>
          {contract.branch_name && (
            <p className="text-sm text-slate-500 mt-0.5">{contract.branch_name}</p>
          )}
        </div>
      </div>

      {/* Formatting toolbar */}
      {/* <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-3 py-1.5">
        <ToolBtn onClick={() => exec('undo')} title="Отменить"><Undo size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Повторить"><Redo size={15} /></ToolBtn>
        <Separator />
        <ToolBtn onClick={() => exec('bold')} title="Жирный"><Bold size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Курсив"><Italic size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Подчёркнутый"><Underline size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Зачёркнутый"><Strikethrough size={15} /></ToolBtn>
        <Separator />
        <ToolBtn onClick={() => exec('justifyLeft')} title="По левому краю"><AlignLeft size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="По центру"><AlignCenter size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="По правому краю"><AlignRight size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyFull')} title="По ширине"><AlignJustify size={15} /></ToolBtn>
        <Separator />
        <select
          className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-slate-600 focus:outline-none"
          defaultValue=""
          onChange={(e) => { if (e.target.value) exec('fontSize', e.target.value) }}
        >
          <option value="" disabled>Размер</option>
          {['1', '2', '3', '4', '5', '6', '7'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-slate-600 focus:outline-none"
          defaultValue=""
          onChange={(e) => { if (e.target.value) exec('foreColor', e.target.value) }}
        >
          <option value="" disabled>Цвет</option>
          {['#000000', '#e53e3e', '#dd6b20', '#38a169', '#3182ce', '#805ad5'].map((c) => (
            <option key={c} value={c} style={{ color: c }}>{c}</option>
          ))}
        </select>
      </div> */}

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
          {tco('editDialog.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || isSaving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0E73F6] text-white text-sm font-medium rounded-lg hover:bg-[#0a5fd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          {tco('editDialog.save')}
        </button>
      </div>
    </CustomDialog>
  )
}

export default ContractPage