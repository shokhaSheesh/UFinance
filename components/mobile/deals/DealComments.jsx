'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MCard } from '@/components/mobile/ui'
import { useSaleComments } from '@/hooks/useSaleComments'
import { cn } from '@/lib/utils'
import { Check, FileText, FolderOpen, Loader2, MoreHorizontal, Paperclip, Pencil, Send, Trash2, X } from '@/components/mobile/icons'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

/**
 * Файлы и комментарии сделки на телефоне.
 *
 * Данные и действия — из того же useSaleComments, что у панели на
 * компьютере, поэтому комментарий, оставленный с телефона, сразу виден в
 * сделке на большом экране. Иначе только подача: на компьютере правка и
 * удаление появляются при наведении, а на телефоне наведения нет — у
 * каждого комментария своя кнопка «…».
 */

const ACCEPTED_FORMATS = '.pdf,.doc,.docx,.xls,.xlsx,.jpeg,.png,.jpg,.zip,.rar,.txt,.csv,.xml'

const filesOf = (message) =>
  message.files?.length ? message.files : message.file ? [message.file] : []

export default function DealComments({ dealGuid, variant = 'sale' }) {
  const t = useTranslations('Deals.commentChat')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const fileRef = useRef(null)
  const editFileRef = useRef(null)
  const [menuFor, setMenuFor] = useState(null)

  const {
    messages,
    text,
    setText,
    attachedFiles,
    editingId,
    editText,
    setEditText,
    editFiles,
    deleteTargetId,
    canSend,
    isSending,
    handleFileChange,
    handleRemoveAttach,
    handleSend,
    handleEdit,
    handleEditConfirm,
    handleEditCancel,
    handleEditFileChange,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useSaleComments({ salesId: dealGuid, variant })

  return (
    <>
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tm('deals.commentsTitle')}</div>

      <MCard className="p-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-8 pt-7 pb-5 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderOpen size={24} aria-hidden="true" />
            </span>
            <p className="text-[13px] leading-relaxed text-slate-500">{t('emptyState')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-3">
            {messages.map((message) => {
              const isEditing = editingId === message.id
              const files = filesOf(message)
              const pending = isEditing ? (editFiles || []).map((file) => ({ name: file.name })) : []

              return (
                <div key={message.id} className="rounded-2xl bg-slate-50 px-3.5 py-3">
                  {[...files, ...pending].length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {[...files, ...pending].map((file, index) => (
                        <a
                          key={`${file.name}-${index}`}
                          href={file.url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex max-w-full items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#0e73f6] ring-1 ring-slate-200"
                        >
                          <FileText size={13} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileRef.current?.click()}
                        aria-label={tm('deals.attach')}
                        className="shrink-0 text-slate-400"
                      >
                        <Paperclip size={17} aria-hidden="true" />
                      </button>
                      <input
                        ref={editFileRef}
                        type="file"
                        accept={ACCEPTED_FORMATS}
                        multiple
                        onChange={handleEditFileChange}
                        className="hidden"
                      />
                      <input
                        autoFocus
                        value={editText}
                        onChange={(event) => setEditText(event.target.value)}
                        className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-[15px] text-slate-900 ring-1 ring-slate-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        aria-label={t('cancel')}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={handleEditConfirm}
                        aria-label={t('save')}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0e73f6] text-white"
                      >
                        <Check size={16} aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    message.message && (
                      <p className="text-[15px] leading-snug break-words text-slate-900">{message.message}</p>
                    )
                  )}

                  {!isEditing && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[11px] text-slate-400">
                        {[message.email, message.createdAt ? moment(message.createdAt).format('D MMM, HH:mm') : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMenuFor(message)}
                        aria-label={tc('actions')}
                        className="-mr-1.5 flex h-7 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 active:bg-slate-200"
                      >
                        <MoreHorizontal size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Поле ввода — внизу карточки, как в мессенджере */}
        <div className="border-t border-slate-100 p-3">
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {attachedFiles.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="flex max-w-full items-center gap-1 rounded-lg bg-[#e8f1ff] py-1 pr-1 pl-2.5 text-[12px] font-medium text-[#0e73f6]"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttach(index)}
                    aria-label={tc('delete')}
                    className="flex h-5 w-5 shrink-0 items-center justify-center"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={tm('deals.attach')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
            >
              <Paperclip size={18} aria-hidden="true" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <textarea
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t('writeComment')}
              className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-[20px] bg-slate-100 px-4 py-2.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isSending}
              aria-label={tm('deals.send')}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                canSend && !isSending ? 'bg-[#0e73f6] text-white' : 'bg-slate-100 text-slate-300'
              )}
            >
              {isSending ? (
                <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={17} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </MCard>

      {/* Что сделать с комментарием */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title={tm('deals.commentsTitle')}>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => {
              handleEdit(menuFor)
              setMenuFor(null)
            }}
            className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left active:bg-slate-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Pencil size={18} aria-hidden="true" />
            </span>
            <span className="text-[15px] font-semibold text-slate-900">{t('edit')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleDeleteRequest(menuFor.id)
              setMenuFor(null)
            }}
            className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={18} aria-hidden="true" />
            </span>
            <span className="text-[15px] font-semibold text-red-600">{t('delete')}</span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        title={tm('deals.deleteCommentTitle')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleDeleteCancel}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="h-12 flex-1 rounded-full bg-red-600 text-[15px] font-semibold text-white"
            >
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{tm('deals.deleteCommentText')}</p>
      </BottomSheet>
    </>
  )
}
