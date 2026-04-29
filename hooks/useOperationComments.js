'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../lib/api/ucode/base'
import { authStore } from '../store/auth.store'

const UPLOAD_URL = 'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png'
const CDN_BASE = 'https://cdn.u-code.io'
const MAX_FILES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024

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

async function apiListComments(operationId) {
  const res = await apiClient.invokeFunction({
    method: 'list_operation_files_and_comments',
    data: { operation_id: operationId },
  })
  return res?.data?.data || []
}

async function apiAddComment(operationId, comment, fileUrls) {
  const file = Array.isArray(fileUrls) ? fileUrls.filter(Boolean) : (fileUrls ? [fileUrls] : [])
  return apiClient.invokeFunction({
    method: 'add_operation_files_and_comments',
    data: { operation_id: operationId, comment, file: file.length ? file : '' },
  })
}

async function apiUpdateComment(guid, comment, fileUrls) {
  const file = Array.isArray(fileUrls) ? fileUrls.filter(Boolean) : (fileUrls ? [fileUrls] : [])
  return apiClient.invokeFunction({
    method: 'update_operation_files_and_comments',
    data: { guid, comment, file: file.length ? file : '' },
  })
}

async function apiDeleteComment(guid) {
  return apiClient.invokeFunction({
    method: 'delete_operation_files_and_comments',
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

export function useOperationComments({ isNew, operationId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editFiles, setEditFiles] = useState([])
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Stores pending { localId, text, files: File[] } when isNew=true
  const pendingRef = useRef([])

  const loadMessages = useCallback(async (opId) => {
    if (!opId) return
    setIsLoadingMessages(true)
    try {
      const data = await apiListComments(opId)
      setMessages(Array.isArray(data) ? data.map(normalizeMessage) : [])
    } catch (e) {
      console.error('useOperationComments loadMessages error', e)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (!isNew && operationId) {
      loadMessages(operationId)
    }
  }, [isNew, operationId, loadMessages])

  const canSend = text.trim().length > 0 || attachedFiles.length > 0

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      alert(`Максимальный размер файла — 5 МБ. Файлы слишком большие: ${oversized.map(f => f.name).join(', ')}`)
      e.target.value = ''
      return
    }
    const availableSlots = MAX_FILES - attachedFiles.length
    const filesToAdd = files.length > availableSlots ? files.slice(0, availableSlots) : files
    if (files.length > availableSlots) {
      alert(`Внимание: можно прикрепить не более ${MAX_FILES} файлов. Добавлено ${availableSlots}.`)
    }
    if (filesToAdd.length > 0) setAttachedFiles(prev => [...prev, ...filesToAdd])
    e.target.value = ''
  }

  const handleRemoveAttach = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (!canSend) return
    const currentText = text.trim()
    const currentFiles = [...attachedFiles]
    setText('')
    setAttachedFiles([])

    if (isNew) {
      const localId = Date.now()
      pendingRef.current.push({ localId, text: currentText, files: currentFiles })
      setMessages(prev => [{
        id: localId,
        message: currentText,
        file: currentFiles[0] ? { name: currentFiles[0].name } : null,
        files: currentFiles.map(f => ({ name: f.name })),
        email: authStore.userEmail,
        createdAt: new Date().toISOString(),
      }, ...prev])
    } else {
      setIsSending(true)
      try {
        const fileUrls = []
        for (const file of currentFiles) {
          fileUrls.push(await uploadFile(file))
        }
        await apiAddComment(operationId, currentText, fileUrls)
        await loadMessages(operationId)
      } catch (e) {
        console.error('useOperationComments handleSend error', e)
      } finally {
        setIsSending(false)
      }
    }
  }

  // Called by OperationModal after form saves a NEW operation
  const flushPending = async (opId) => {
    if (!opId || pendingRef.current.length === 0) return
    for (const pending of pendingRef.current) {
      try {
        const fileUrls = []
        for (const file of pending.files) {
          fileUrls.push(await uploadFile(file))
        }
        await apiAddComment(opId, pending.text, fileUrls)
      } catch (e) {
        console.error('useOperationComments flushPending error', e)
      }
    }
    pendingRef.current = []
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

    if (isNew) {
      setMessages(prev => prev.map(m => m.id === targetId ? { ...m, message: currentEditText } : m))
      const pending = pendingRef.current.find(p => p.localId === targetId)
      if (pending) pending.text = currentEditText
    } else {
      const msg = messages.find(m => m.id === targetId)
      if (!msg) return
      try {
        const existingUrls = (msg.files || []).map(f => f.url).filter(Boolean)
        const newUrls = []
        for (const file of currentEditFiles) {
          newUrls.push(await uploadFile(file))
        }
        await apiUpdateComment(msg.guid, currentEditText, [...existingUrls, ...newUrls])
        await loadMessages(operationId)
      } catch (e) {
        console.error('useOperationComments handleEditConfirm error', e)
      }
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
    if (oversized.length > 0) {
      alert(`Максимальный размер файла — 5 МБ. Файлы слишком большие: ${oversized.map(f => f.name).join(', ')}`)
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

    if (isNew) {
      setMessages(prev => prev.filter(m => m.id !== targetId))
      pendingRef.current = pendingRef.current.filter(p => p.localId !== targetId)
    } else {
      try {
        await apiDeleteComment(targetId)
        await loadMessages(operationId)
      } catch (e) {
        console.error('useOperationComments handleDeleteConfirm error', e)
      }
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
    flushPending,
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
