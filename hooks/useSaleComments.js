'use client'
import { showErrorNotification } from '@/lib/utils/notifications'
import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../lib/api/ucode/base'
import { authStore } from '../store/auth.store'

const UPLOAD_URL = 'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png'
const CDN_BASE = 'https://cdn.u-code.io'
const MAX_FILES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Files & comments live behind the same file-upload flow for both sale and
// purchase deals — only the invoke_function method names and the id field differ.
// Configs are module-level constants so their reference stays stable across renders.
const VARIANT_CONFIGS = {
  sale: {
    idField: 'sales_id',
    listMethod: 'list_sale_files_and_comments',
    addMethod: 'add_sale_files_and_comments',
    updateMethod: 'update_sale_files_and_comments',
    deleteMethod: 'delete_sale_files_and_comments',
  },
  purchase: {
    idField: 'purchase_transactions_id',
    listMethod: 'list_purchase_files_and_comments',
    addMethod: 'add_purchase_files_and_comments',
    updateMethod: 'update_purchase_files_and_comments',
    deleteMethod: 'delete_purchase_files_and_comments',
  },
}

async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file, file.name)
  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authStore.authToken}` },
    body: formData,
  })
  if (!res.ok) throw new Error('File upload failed')
  const json = await res.json()
  return `${CDN_BASE}/${json.data.link}`
}

async function apiListComments(config, entityId) {
  const res = await apiClient.invokeFunction({
    method: config.listMethod,
    data: { [config.idField]: entityId },
  })
  return res?.data?.data || []
}

async function apiAddComment(config, entityId, comment, fileUrls) {
  const file = Array.isArray(fileUrls) ? fileUrls.filter(Boolean) : (fileUrls ? [fileUrls] : [])
  return apiClient.invokeFunction({
    method: config.addMethod,
    data: { [config.idField]: entityId, comment, file: file.length ? file : '' },
  })
}

async function apiUpdateComment(config, guid, comment, fileUrls) {
  const file = Array.isArray(fileUrls) ? fileUrls.filter(Boolean) : (fileUrls ? [fileUrls] : [])
  return apiClient.invokeFunction({
    method: config.updateMethod,
    data: { guid, comment, file: file.length ? file : '' },
  })
}

async function apiDeleteComment(config, guid) {
  return apiClient.invokeFunction({
    method: config.deleteMethod,
    data: { guid },
  })
}

function getFileName(url) {
  if (!url) return ''
  const last = url.split('/').pop() || ''
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

function normalizeMessage(item) {
  const urls = Array.isArray(item.file)
    ? item.file.filter(Boolean)
    : item.file ? [item.file] : []
  const files = urls.map(url => ({ name: getFileName(url), url }))
  return {
    id: item.guid,
    guid: item.guid,
    message: item.comment || '',
    file: files[0] || null,
    files,
    email: item.email || authStore.userEmail,
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  }
}

export function useSaleComments({ salesId, variant = 'sale' }) {
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.sale
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editFiles, setEditFiles] = useState([])
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const loadMessages = useCallback(async (id) => {
    if (!id) return
    setIsLoadingMessages(true)
    try {
      const data = await apiListComments(config, id)
      setMessages(Array.isArray(data) ? data.map(normalizeMessage) : [])
    } catch (e) {
      console.error('useSaleComments loadMessages error', e)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [config])

  useEffect(() => {
    if (salesId) loadMessages(salesId)
  }, [salesId, loadMessages])

  const canSend = text.trim().length > 0 || attachedFiles.length > 0

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      showErrorNotification(`Максимальный размер файла — 5 МБ. Файлы слишком большие: ${oversized.map(f => f.name).join(', ')}`)
      e.target.value = ''
      return
    }
    const availableSlots = MAX_FILES - attachedFiles.length
    const filesToAdd = files.length > availableSlots ? files.slice(0, availableSlots) : files
    if (files.length > availableSlots) {
      showErrorNotification(`Внимание: можно прикрепить не более ${MAX_FILES} файлов. Добавлено ${availableSlots}.`)
    }
    if (filesToAdd.length > 0) setAttachedFiles(prev => [...prev, ...filesToAdd])
    e.target.value = ''
  }

  const handleRemoveAttach = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (!canSend || !salesId) return
    const currentText = text.trim()
    const currentFiles = [...attachedFiles]
    setText('')
    setAttachedFiles([])

    setIsSending(true)
    try {
      const fileUrls = []
      for (const file of currentFiles) {
        fileUrls.push(await uploadFile(file))
      }
      await apiAddComment(config, salesId, currentText, fileUrls)
      await loadMessages(salesId)
    } catch (e) {
      console.error('useSaleComments handleSend error', e)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEdit = (msg) => {
    setEditingId(msg.id)
    setEditText(msg.message || '')
    setEditFiles([])
  }

  const handleEditConfirm = async () => {
    const targetId = editingId
    const currentEditText = editText
    const currentEditFiles = [...editFiles]
    setEditingId(null)
    setEditText('')
    setEditFiles([])

    const msg = messages.find(m => m.id === targetId)
    if (!msg) return
    try {
      const existingUrls = (msg.files || []).map(f => f.url).filter(Boolean)
      const newUrls = []
      for (const file of currentEditFiles) {
        newUrls.push(await uploadFile(file))
      }
      await apiUpdateComment(config, msg.guid, currentEditText, [...existingUrls, ...newUrls])
      await loadMessages(salesId)
    } catch (e) {
      console.error('useSaleComments handleEditConfirm error', e)
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditText('')
    setEditFiles([])
  }

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE)
    if (files.length > MAX_FILES) {
      showErrorNotification(`Внимание: можно прикрепить не более ${MAX_FILES} файлов. Добавлено ${files.length}.`)
      return
    }
    if (oversized.length > 0) {
      showErrorNotification(`Максимальный размер файла — 5 МБ. Файлы слишком большие: ${oversized.map(f => f.name).join(', ')}`)
      e.target.value = ''
      return
    }
    if (files.length > 0) setEditFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  const handleDeleteRequest = (id) => setDeleteTargetId(id)

  const handleDeleteConfirm = async () => {
    if (deleteTargetId == null) return
    const targetId = deleteTargetId
    setDeleteTargetId(null)
    if (editingId === targetId) {
      setEditingId(null)
      setEditText('')
      setEditFiles([])
    }
    try {
      await apiDeleteComment(config, targetId)
      await loadMessages(salesId)
    } catch (e) {
      console.error('useSaleComments handleDeleteConfirm error', e)
    }
  }

  const handleDeleteCancel = () => setDeleteTargetId(null)

  return {
    messages,
    text,
    setText,
    attachedFiles,
    editingId,
    editText,
    setEditText,
    editFiles,
    deleteTargetId,
    isLoadingMessages,
    isSending,
    canSend,
    handleFileChange,
    handleRemoveAttach,
    handleSend,
    handleKeyDown,
    handleEdit,
    handleEditConfirm,
    handleEditCancel,
    handleEditFileChange,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
  }
}
