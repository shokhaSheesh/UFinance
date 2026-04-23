'use client'
import { authStore } from '@/store/auth.store'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FilesPlugIcon } from '../../../../constants/icons'
import './style.scss'
// ─── constants ────────────────────────────────────────────────────────────────

const MAX_FILES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_FORMATS = '.pdf,.doc,.docx,.xls,.xlsx,.jpeg,.png,.jpg,.zip,.rar,.txt,.csv,.xml'

const FILE_TYPE_COLORS = {
	pdf: '#e53935',
	doc: '#1565c0',
	docx: '#1565c0',
	xls: '#2e7d32',
	xlsx: '#2e7d32',
	png: '#e53935',
	jpg: '#e53935',
	jpeg: '#e53935',
	zip: '#f57f17',
	rar: '#f57f17',
	txt: '#546e7a',
	csv: '#2e7d32',
	xml: '#6a1b9a',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── DeleteConfirmModal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ isOpen, onCancel, onConfirm }) {
	if (!isOpen) return null
	const modal = (
		<div className='sm-delete-overlay' onClick={onCancel}>
			<div className='sm-delete-modal' onClick={e => e.stopPropagation()}>
				<button className='sm-delete-modal__close' onClick={onCancel}>
					<svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<line x1='18' y1='6' x2='6' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
						<line x1='6' y1='6' x2='18' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
					</svg>
				</button>
				<h3 className='sm-delete-modal__title'>Удалить комментарий</h3>
				<p className='sm-delete-modal__text'>
					Вы действительно хотите удалить комментарий? Восстановить его будет <strong>невозможно</strong>.
				</p>
				<div className='sm-delete-modal__actions'>
					<button className='sm-delete-modal__btn sm-delete-modal__btn--cancel' onClick={onCancel}>
						Отменить
					</button>
					<button className='sm-delete-modal__btn sm-delete-modal__btn--delete' onClick={onConfirm}>
						Удалить
					</button>
				</div>
			</div>
		</div>
	)
	return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

// ─── FileBadge ────────────────────────────────────────────────────────────────

function FileBadge({ file, onRemove }) {
	const ext = getFileExt(file.name)
	const color = getFileColor(file.name)
	return (
		<div className='sm-file-badge'>
			<div className='sm-file-badge__icon' style={{ borderColor: color }}>
				<span className='sm-file-badge__ext' style={{ color }}>{ext}</span>
			</div>
			<span className='sm-file-badge__name'>{file.name}</span>
			{onRemove && (
				<button className='sm-file-badge__remove' onClick={onRemove} title='Убрать файл'>
					<svg width='12' height='12' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<line x1='18' y1='6' x2='6' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
						<line x1='6' y1='6' x2='18' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
					</svg>
				</button>
			)}
		</div>
	)
}

// ─── MessageCard ─────────────────────────────────────────────────────────────

function MessageCard({ msg, isEditing, editText, editFile, onEditChange, onEditFileChange, onEditConfirm, onEditCancel, onEdit, onDelete }) {
	const editFileRef = useRef(null)

	if (isEditing) {
		return (
			<div className='sm-card sm-card--editing'>
				{/* File row: badge + delete */}
				{(editFile || msg.file) && (
					<div className='sm-card__file-row'>
						<FileBadge file={editFile || msg.file} />
						<button className='sm-card__action-btn sm-card__action-btn--delete' onClick={() => onDelete(msg.id)} title='Удалить'>
							<svg width='15' height='15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
								<polyline points='3 6 5 6 21 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
								<path d='M19 6L18.1429 20.1429C18.0627 21.1941 17.1845 22 16.1304 22H7.86957C6.81549 22 5.93726 21.1941 5.85714 20.1429L5 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
								<path d='M9 6V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
							</svg>
						</button>
					</div>
				)}

				{/* Inline edit input with clip icon */}
				<div className='sm-card__edit-input-row'>
					<label className='sm-card__edit-clip' title='Прикрепить файл'>
						<svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path d='M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7185 1.38778 15.78 1.38778C16.8415 1.38778 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7822 4.32855 19.7822 5.39C19.7822 6.45145 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
						<input
							ref={editFileRef}
							type='file'
							accept={ACCEPTED_FORMATS}
							style={{ display: 'none' }}
							onChange={onEditFileChange}
						/>
					</label>
					<input
						className='sm-card__edit-input'
						type='text'
						value={editText}
						onChange={e => onEditChange(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') onEditConfirm()
							if (e.key === 'Escape') onEditCancel()
						}}
						autoFocus
					/>
				</div>

				{/* Meta + cancel/confirm buttons */}
				<div className='sm-card__meta'>
					<div className='sm-card__meta-left'>
						<span className='sm-card__email'>{authStore?.userEmail}</span>
						<span className='sm-card__date'>{formatDateRu(msg.createdAt)}</span>
					</div>
					<div className='sm-card__edit-actions'>
						<button className='sm-card__edit-btn sm-card__edit-btn--cancel' onClick={onEditCancel} title='Отмена'>
							<svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
								<circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
								<line x1='15' y1='9' x2='9' y2='15' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
								<line x1='9' y1='9' x2='15' y2='15' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
							</svg>
						</button>
						<button className='sm-card__edit-btn sm-card__edit-btn--confirm' onClick={onEditConfirm} title='Сохранить'>
							<svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
								<circle cx='12' cy='12' r='10' fill='#3b82f6' stroke='#3b82f6' strokeWidth='2' />
								<path d='M8 12.5L11 15.5L16 9.5' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
							</svg>
						</button>
					</div>
				</div>
			</div>
		)
	}

	// ── Normal (non-editing) view ──
	return (
		<div className='sm-card'>
			{/* Render all attached files */}
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
					<button className='sm-card__action-btn' onClick={() => onEdit(msg)} title='Редактировать'>
						<svg width='15' height='15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path d='M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
							<path d='M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
					</button>
					<button className='sm-card__action-btn sm-card__action-btn--delete' onClick={() => onDelete(msg.id)} title='Удалить'>
						<svg width='15' height='15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
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

// ─── SentMessages (main) ─────────────────────────────────────────────────────

const SentMessages = ({ onSend }) => {
	const [messages, setMessages] = useState([])
	const [text, setText] = useState('')
	const [attachedFiles, setAttachedFiles] = useState([])
	const [editingId, setEditingId] = useState(null)
	const [editText, setEditText] = useState('')
	const [editFile, setEditFile] = useState(null)
	const [deleteTargetId, setDeleteTargetId] = useState(null)
	const fileInputRef = useRef(null)

	const canSend = text.trim().length > 0 || attachedFiles.length > 0

	// ── handlers ──────────────────────────────────────────────────────────────

	function handleFileChange(e) {
		const files = Array.from(e.target.files || [])

		const oversized = files.filter(f => f.size > MAX_FILE_SIZE)
		if (oversized.length > 0) {
			alert(`Максимальный размер файла — 5 МБ. Файлы слишком большие: ${oversized.map(f => f.name).join(', ')}`)
			e.target.value = ''
			return
		}

		let filesToAdd = files
		const availableSlots = MAX_FILES - attachedFiles.length
		if (files.length > availableSlots) {
			alert(`Внимание: можно прикрепить не более ${MAX_FILES} файлов. Добавлено ${availableSlots} файлов.`)
			filesToAdd = files.slice(0, availableSlots)
		}

		if (filesToAdd.length > 0) {
			setAttachedFiles(prev => [...prev, ...filesToAdd])
		}

		e.target.value = ''
	}

	function handleRemoveAttach(index) {
		setAttachedFiles(prev => prev.filter((_, i) => i !== index))
	}

	function handleSend() {
		if (!canSend) return

		const payload = {
			files: attachedFiles.length > 0 ? attachedFiles : [],
			message: text.trim(),
		}

		if (onSend) onSend(payload)

		const newMsg = {
			id: Date.now(),
			file: attachedFiles.length > 0 ? { name: attachedFiles[0].name, size: attachedFiles[0].size } : null,
			files: attachedFiles.map(f => ({ name: f.name, size: f.size })),
			message: text.trim(),
			email: authStore.userEmail,
			createdAt: new Date().toISOString(),
		}
		setMessages(prev => [newMsg, ...prev])
		setText('')
		setAttachedFiles([])
	}

	function handleKeyDown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	function handleEdit(msg) {
		setEditingId(msg.id)
		setEditText(msg.message || '')
		setEditFile(null)
	}

	function handleEditConfirm() {
		setMessages(prev =>
			prev.map(m =>
				m.id === editingId
					? { ...m, message: editText, file: editFile || m.file }
					: m
			)
		)
		setEditingId(null)
		setEditText('')
		setEditFile(null)
	}

	function handleEditCancel() {
		setEditingId(null)
		setEditText('')
		setEditFile(null)
	}

	function handleEditFileChange(e) {
		const file = e.target.files?.[0]
		if (file) setEditFile({ name: file.name, size: file.size })
		e.target.value = ''
	}

	// Delete flow: show modal first
	function handleDeleteRequest(id) {
		setDeleteTargetId(id)
	}

	function handleDeleteConfirm() {
		if (deleteTargetId == null) return
		setMessages(prev => prev.filter(m => m.id !== deleteTargetId))
		if (editingId === deleteTargetId) {
			setEditingId(null)
			setEditText('')
			setEditFile(null)
		}
		setDeleteTargetId(null)
	}

	function handleDeleteCancel() {
		setDeleteTargetId(null)
	}

	// ── render ────────────────────────────────────────────────────────────────




	return (
		<div className='sm-root'>
			{/* Plug — shown only when no messages and no attached files */}
			{messages.length === 0 && attachedFiles.length === 0 && (
				<div className='sm-plug-wrapper'>
					<div className='sm-plug'>
						<FilesPlugIcon className='sm-plug__icon' />
						<div className='sm-plug__title'>
							Прикрепляйте к операциям файлы,<br />
							например, акты или счета, добавляйте<br />
							комментарии
						</div>
						<div className='sm-plug__desc'>Не более 10 файлов к операции</div>
						<div className='sm-plug__desc'>Максимальный размер файла — 5 МБ</div>
						<div className='sm-plug__desc'>
							Поддерживаемые форматы:<br />
							pdf, doc, docx, xls, xlsx, jpeg,<br />
							png, zip, rar, txt, csv, xml
						</div>
					</div>
				</div>
			)}

			{/* Scrollable message list — messages anchored to bottom */}
			{messages.length > 0 && (
				<div className='sm-list'>
					{messages.map(msg => (
						<MessageCard
							key={msg.id}
							msg={msg}
							isEditing={editingId === msg.id}
							editText={editText}
							editFile={editFile}
							onEditChange={setEditText}
							onEditFileChange={handleEditFileChange}
							onEditConfirm={handleEditConfirm}
							onEditCancel={handleEditCancel}
							onEdit={handleEdit}
							onDelete={handleDeleteRequest}
						/>
					))}
				</div>
			)}

			{/* Input bar */}
			<div className='sm-input-bar'>
				{attachedFiles.length > 0 && (
					<div className='sm-input-bar__files'>
						{attachedFiles.map((file, i) => (
							<div className='sm-input-bar__file' key={i}>
								<span className='sm-input-bar__file-name'>{file.name}</span>
								<button className='sm-input-bar__file-remove' onClick={() => handleRemoveAttach(i)} title='Удалить файл'>
									<svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
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
					<label className='sm-input-bar__clip' title='Прикрепить файл'>
						<svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path d='M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7185 1.38778 15.78 1.38778C16.8415 1.38778 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7822 4.32855 19.7822 5.39C19.7822 6.45145 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
						<input
							ref={fileInputRef}
							type='file'
							accept={ACCEPTED_FORMATS}
							multiple
							style={{ display: 'none' }}
							onChange={handleFileChange}
						/>
					</label>
					<div className='sm-input-bar__field'>
						<textarea
							className='sm-input-bar__textarea'
							rows={1}
							placeholder='Написать комментарий'
							maxLength={256}
							value={text}
							onChange={e => setText(e.target.value)}
							onKeyDown={handleKeyDown}
						/>
						<span className='sm-input-bar__underline' />
					</div>

					<button
						className={`sm-input-bar__send`}
						onClick={handleSend}
						title='Отправить'
					>
						<svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<line x1='22' y1='2' x2='11' y2='13' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
							<polygon points='22 2 15 22 11 13 2 9 22 2' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
						</svg>
					</button>
				</div>
			</div>

			{/* Delete confirmation modal */}
			<DeleteConfirmModal
				isOpen={deleteTargetId !== null}
				onCancel={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	)
}

export default SentMessages