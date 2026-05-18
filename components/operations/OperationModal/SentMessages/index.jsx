'use client'
import { MessageSquareText, Minimize2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FilesPlugIcon } from '../../../../constants/icons'
import './style.scss'

const ACCEPTED_FORMATS = '.pdf,.doc,.docx,.xls,.xlsx,.jpeg,.png,.jpg,.zip,.rar,.txt,.csv,.xml'

const FILE_TYPE_COLORS = {
  pdf: '#e53935', doc: '#1565c0', docx: '#1565c0',
  xls: '#2e7d32', xlsx: '#2e7d32', png: '#e53935',
  jpg: '#e53935', jpeg: '#e53935', zip: '#f57f17',
  rar: '#f57f17', txt: '#546e7a', csv: '#2e7d32', xml: '#6a1b9a',
}

function getFileExt(name) {
  return name?.split('.').pop()?.toUpperCase() || 'FILE'
}

function getFileColor(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  return FILE_TYPE_COLORS[ext] || '#607d8b'
}

function formatDateRu(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  const mon = months[d.getMonth()]
  const yr = String(d.getFullYear()).slice(2)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${mon} '${yr} в ${hh}:${mm}`
}

function DeleteConfirmModal({ isOpen, onCancel, onConfirm }) {
  const t = useTranslations('Operations.comments')
  if (!isOpen) return null
  const modal = (
    <div className='sm-delete-overlay' onClick={onCancel}>
      <div className='sm-delete-modal' onClick={e => e.stopPropagation()}>
        <button className='sm-delete-modal__close' onClick={onCancel}>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
            <line x1='18' y1='6' x2='6' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
            <line x1='6' y1='6' x2='18' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
          </svg>
        </button>
        <h3 className='sm-delete-modal__title'>{t('deleteCommentTitle')}</h3>
        <p className='sm-delete-modal__text'>
          {t('deleteCommentTextStart')}<strong>{t('deleteCommentImpossible')}</strong>{t('deleteCommentTextEnd')}
        </p>
        <div className='sm-delete-modal__actions'>
          <button className='sm-delete-modal__btn sm-delete-modal__btn--cancel' onClick={onCancel}>{t('deleteCancel')}</button>
          <button className='sm-delete-modal__btn sm-delete-modal__btn--delete' onClick={onConfirm}>{t('deleteConfirm')}</button>
        </div>
      </div>
    </div>
  )
  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

async function downloadFile(file) {
  if (!file?.url) return
  const fileName = file.name || 'file'
  try {
    const res = await fetch(file.url)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    const a = document.createElement('a')
    a.href = file.url
    a.download = fileName
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

function FileBadge({ file, onRemove }) {
  const t = useTranslations('Operations.comments')
  const ext = getFileExt(file.name)
  const color = getFileColor(file.name)
  return (
    <div className='sm-file-badge'>
      <div className='sm-file-badge__icon' style={{ borderColor: color }}>
        <span className='sm-file-badge__ext' style={{ color }}>{ext}</span>
      </div>
      <span className='sm-file-badge__name'>{file.name}</span>
      {file.url && (
        <button className='sm-file-badge__download' onClick={() => downloadFile(file)} title={t('download')}>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            <polyline points='7 10 12 15 17 10' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            <line x1='12' y1='15' x2='12' y2='3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </button>
      )}
      {onRemove && (
        <button className='sm-file-badge__remove' onClick={onRemove} title={t('removeFile')}>
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
            <line x1='18' y1='6' x2='6' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
            <line x1='6' y1='6' x2='18' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
          </svg>
        </button>
      )}
    </div>
  )
}

function MessageCard({ msg, isEditing, editText, editFiles, onEditChange, onEditFileChange, onEditConfirm, onEditCancel, onEdit, onDelete }) {
  const t = useTranslations('Operations.comments')
  const editFileRef = useRef(null)

  if (isEditing) {
    const existingFiles = msg.files && msg.files.length > 0 ? msg.files : (msg.file ? [msg.file] : [])
    const pendingFiles = (editFiles || []).map(f => ({ name: f.name }))
    const allFiles = [...existingFiles, ...pendingFiles]
    return (
      <div className='sm-card sm-card--editing'>
        {allFiles.length > 0 && (
          <div className='sm-card__file-row'>
            <div className='sm-card__file-list'>
              {allFiles.map((file, i) => <FileBadge key={i} file={file} />)}
            </div>
            <button className='sm-card__action-btn sm-card__action-btn--delete' onClick={() => onDelete(msg.id)} title={t('delete')}>
              <svg width='15' height='15' viewBox='0 0 24 24' fill='none'>
                <polyline points='3 6 5 6 21 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M19 6L18.1429 20.1429C18.0627 21.1941 17.1845 22 16.1304 22H7.86957C6.81549 22 5.93726 21.1941 5.85714 20.1429L5 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M9 6V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </button>
          </div>
        )}
        <div className='sm-card__edit-input-row'>
          <label className='sm-card__edit-clip' title={t('attachFile')}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
              <path d='M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7185 1.38778 15.78 1.38778C16.8415 1.38778 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7822 4.32855 19.7822 5.39C19.7822 6.45145 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
            <input ref={editFileRef} type='file' accept={ACCEPTED_FORMATS} multiple style={{ display: 'none' }} onChange={onEditFileChange} />
          </label>
          <input
            className='sm-card__edit-input'
            type='text'
            value={editText}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onEditConfirm(); if (e.key === 'Escape') onEditCancel() }}
            autoFocus
          />
        </div>
        <div className='sm-card__meta'>
          <div className='sm-card__meta-left'>
            <span className='sm-card__email'>{msg.email}</span>
            <span className='sm-card__date'>{formatDateRu(msg.createdAt)}</span>
          </div>
          <div className='sm-card__edit-actions'>
            <button className='sm-card__edit-btn sm-card__edit-btn--cancel' onClick={onEditCancel} title={t('cancel')}>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
                <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
                <line x1='15' y1='9' x2='9' y2='15' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                <line x1='9' y1='9' x2='15' y2='15' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
              </svg>
            </button>
            <button className='sm-card__edit-btn sm-card__edit-btn--confirm' onClick={onEditConfirm} title={t('save')}>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
                <circle cx='12' cy='12' r='10' fill='#3b82f6' stroke='#3b82f6' strokeWidth='2' />
                <path d='M8 12.5L11 15.5L16 9.5' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='sm-card'>
      {msg.files && msg.files.length > 0
        ? msg.files.map((file, i) => <FileBadge key={i} file={file} />)
        : msg.file && <FileBadge file={msg.file} />}
      {msg.message && <p className='sm-card__text'>{msg.message}</p>}
      <div className='sm-card__meta'>
        <div className='sm-card__meta-left'>
          <span className='sm-card__email'>{msg.email}</span>
          <span className='sm-card__date'>{formatDateRu(msg.createdAt)}</span>
        </div>
        <div className='sm-card__actions'>
          <button className='sm-card__action-btn' onClick={() => onEdit(msg)} title={t('edit')}>
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none'>
              <path d='M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
              <path d='M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
          <button className='sm-card__action-btn sm-card__action-btn--delete' onClick={() => onDelete(msg.id)} title={t('delete')}>
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none'>
              <polyline points='3 6 5 6 21 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
              <path d='M19 6L18.1429 20.1429C18.0627 21.1941 17.1845 22 16.1304 22H7.86957C6.81549 22 5.93726 21.1941 5.85714 20.1429L5 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
              <path d='M9 6V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const SentMessages = ({
  messages,
  text,
  attachedFiles,
  editingId,
  editText,
  editFiles,
  deleteTargetId,
  onTextChange,
  onFileChange,
  onRemoveAttach,
  onSend,
  onKeyDown,
  onEdit,
  onEditChange,
  onEditFileChange,
  onEditConfirm,
  onEditCancel,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}) => {
  const [open, setOpen] = useState(false)
  const t = useTranslations('Operations.comments')
  const fileInputRef = useRef(null)

  return (
    <>

      {!open && <div className='flex h-fit p-2 m-2 text-sm rounded-md cursor-pointer hover:text-neutral-400 relative bg-neutral-600 items-center gap-2 text-white top-0' onClick={() => setOpen(true)}>
        <MessageSquareText size={18} />
        <p>Файлы и комментарии</p>
      </div>}

      <div className='sm-root' style={{ display: open ? 'flex' : 'none' }}>
        <div className="flex items-center justify-end">
          {open && <div className='flex h-fit self-end p-2 m-2 rounded-md cursor-pointer hover:text-neutral-400 relative bg-neutral-600 items-center gap-2 text-white top-0' onClick={() => setOpen(false)}>
            <Minimize2 size={16} />
            <p>Свернуть</p>
          </div>}
        </div>
        <>
          {messages.length === 0 && attachedFiles.length === 0 && (
            <div className='sm-plug-wrapper'>
              <div className='sm-plug'>
                <FilesPlugIcon className='sm-plug__icon' />
                <div className='sm-plug__title'>
                  {t('plugTitle')}
                </div>
                <div className='sm-plug__desc'>{t('plugMaxFiles')}</div>
                <div className='sm-plug__desc'>{t('plugMaxSize')}</div>
                <div className='sm-plug__desc'>
                  {t('plugFormatsLabel')}<br />
                  {t('plugFormats')}
                </div>
              </div>
            </div>
          )}

          {(messages.length > 0 || attachedFiles.length > 0) && (
            <div className='sm-list'>
              {messages.map(msg => (
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  isEditing={editingId === msg.id}
                  editText={editText}
                  editFiles={editFiles}
                  onEditChange={onEditChange}
                  onEditFileChange={onEditFileChange}
                  onEditConfirm={onEditConfirm}
                  onEditCancel={onEditCancel}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}

          <div className='sm-input-bar'>
            {attachedFiles.length > 0 && (
              <div className='sm-input-bar__files'>
                {attachedFiles.map((file, i) => (
                  <div className='sm-input-bar__file' key={i}>
                    <span className='sm-input-bar__file-name'>{file.name}</span>
                    <button className='sm-input-bar__file-remove' onClick={() => onRemoveAttach(i)} title={t('removeFile')}>
                      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                        <polyline points='3 6 5 6 21 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        <path d='M19 6L18.1429 20.1429C18.0627 21.1941 17.1845 22 16.1304 22H7.86957C6.81549 22 5.93726 21.1941 5.85714 20.1429L5 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        <path d='M9 6V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className='sm-input-bar__row'>
              <label className='sm-input-bar__clip' title={t('attachFile')}>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <path d='M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7185 1.38778 15.78 1.38778C16.8415 1.38778 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7822 4.32855 19.7822 5.39C19.7822 6.45145 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                </svg>
                <input ref={fileInputRef} type='file' accept={ACCEPTED_FORMATS} multiple style={{ display: 'none' }} onChange={onFileChange} />
              </label>
              <div className='sm-input-bar__field'>
                <textarea
                  className='sm-input-bar__textarea'
                  rows={1}
                  placeholder={t('placeholder')}
                  maxLength={256}
                  value={text}
                  onChange={e => onTextChange(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <span className='sm-input-bar__underline' />
              </div>
              <button className='sm-input-bar__send' onClick={onSend} title={t('send')}>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <line x1='22' y1='2' x2='11' y2='13' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                  <polygon points='22 2 15 22 11 13 2 9 22 2' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
                </svg>
              </button>
            </div>
          </div>

          <DeleteConfirmModal
            isOpen={deleteTargetId !== null}
            onCancel={onDeleteCancel}
            onConfirm={onDeleteConfirm}
          />
        </>
      </div>
    </>
  )
}

export default SentMessages
