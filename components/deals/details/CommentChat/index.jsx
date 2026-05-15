'use client';
import { useSaleComments } from '@/hooks/useSaleComments';
import { Check, Download, Loader2, Paperclip, Pencil, Send, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

const ACCEPTED_FORMATS = '.pdf,.doc,.docx,.xls,.xlsx,.jpeg,.png,.jpg,.zip,.rar,.txt,.csv,.xml';

function formatDateRu(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const mon = months[d.getMonth()];
  const yr = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} '${yr} в ${hh}:${mm}`;
}

async function downloadFile(file) {
  if (!file?.url) return;
  const fileName = file.name || 'file';
  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

const CommentChat = ({ dealGuid }) => {
  const t = useTranslations('Deals.commentChat');
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
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
    handleKeyDown,
    handleEdit,
    handleEditConfirm,
    handleEditCancel,
    handleEditFileChange,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useSaleComments({ salesId: dealGuid });

  const hasContent = messages.length > 0 || attachedFiles.length > 0;

  return (
    <div className="flex w-full flex-col h-full bg-white rounded-lg shadow-[0_10px_10px_rgba(118,164,172,0.1)] max-h-[500px] border border-gray-100/50">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 inline-flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 tracking-wider">{t('title')}</h3>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-6 overflow-y-auto flex flex-col ${hasContent ? 'justify-start' : 'justify-center'}`}>
        {messages.length === 0 && attachedFiles.length === 0 ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5 border border-neutral-100/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                <path d="M22 19V9C22 7.89543 21.1046 7 20 7H13.4142L11.7071 5.29289C11.332 4.91775 10.8234 4.70711 10.2929 4.70711H4C2.89543 4.70711 2 5.60254 2 6.70711V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11H16M12 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
              {t('emptyState')}
            </p>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col gap-3 self-start justify-start">
            {messages.map(msg => {
              const isEditing = editingId === msg.id;
              const existingFiles = msg.files && msg.files.length > 0 ? msg.files : (msg.file ? [msg.file] : []);
              const pendingFiles = (editFiles || []).map(f => ({ name: f.name }));
              const filesToShow = isEditing ? [...existingFiles, ...pendingFiles] : existingFiles;

              return (
                <div key={msg.id} className="group p-3 bg-gray-50 rounded-lg w-full">
                  {filesToShow.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {filesToShow.map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => f.url && downloadFile(f)}
                          className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 underline"
                        >
                          {f.url && <Download size={10} />}
                          <span className="truncate max-w-[180px]">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-2 mb-2">
                      <label className="cursor-pointer text-cyan-600 hover:text-cyan-700">
                        <Paperclip size={14} />
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept={ACCEPTED_FORMATS}
                          multiple
                          className="hidden"
                          onChange={handleEditFileChange}
                        />
                      </label>
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleEditConfirm();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        className="flex-1 bg-transparent border-b border-gray-200 focus:border-cyan-500 outline-none text-sm pb-1"
                        autoFocus
                      />
                    </div>
                  ) : (
                    msg.message && <p className="text-sm text-gray-800 wrap-break-word">{msg.message}</p>
                  )}

                  <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                    <>
                      {isSending ? <Loader2 className='animate-spin' /> : <div className="flex flex-col items-start">
                        <span>{msg.email}</span>
                        <span>{formatDateRu(msg.createdAt)}</span>
                      </div>}
                    </>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <button onClick={handleEditCancel} className="p-1 text-gray-500 hover:text-gray-700" title={t('cancel')}>
                          <X size={14} />
                        </button>
                        <button onClick={handleEditConfirm} className="p-1 text-cyan-600 hover:text-cyan-700" title={t('save')}>
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(msg)} className="p-1 text-gray-500 hover:text-cyan-600" title={t('edit')}>
                          <Pencil size={13} />
                        </button>
                          <button onClick={() => handleDeleteRequest(msg.id)} className="p-1 text-gray-500 hover:text-red-600" title={t('delete')}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-5 border-t border-gray-100">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-cyan-50 text-cyan-700 text-xs px-2 py-1 rounded-md">
                <span className="truncate max-w-[100px]">{f.name}</span>
                <button onClick={() => handleRemoveAttach(i)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3">
          <label className="cursor-pointer text-cyan-600 hover:text-cyan-700 pb-1">
            <Paperclip size={18} />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_FORMATS}
              multiple
              onChange={handleFileChange}
            />
          </label>
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('writeComment')}
              className="w-full bg-transparent border-b border-gray-200 focus:border-cyan-500 outline-none text-sm pb-1 resize-none pr-8"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!canSend || isSending}
            className={`pb-1 ${canSend && !isSending ? 'text-cyan-600 hover:text-cyan-700' : 'text-gray-300'}`}
          >
            <Send size={18} fill={canSend && !isSending ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTargetId !== null && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-1100"
          onClick={handleDeleteCancel}
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-[90%] shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-2">Удалить комментарий</h3>
            <p className="text-sm text-gray-600 mb-5">
              Вы действительно хотите удалить комментарий? Восстановить его будет <strong>невозможно</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={handleDeleteCancel} className="px-4 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100">
                Отменить
              </button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentChat;
