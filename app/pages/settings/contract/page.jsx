'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { Document } from '@tiptap/extension-document'
import { HardBreak } from '@tiptap/extension-hard-break'
import { ListItem } from '@tiptap/extension-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { TextStyle } from '@tiptap/extension-text-style'
import { Dropcursor, Gapcursor, Placeholder, TrailingNode } from '@tiptap/extensions'
import { EditorContent, useEditor } from '@tiptap/react'
import { Loader, Pencil, Save } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { RichTextProvider } from 'reactjs-tiptap-editor'
import { Attachment, RichTextAttachment } from 'reactjs-tiptap-editor/attachment'
import { Blockquote, RichTextBlockquote } from 'reactjs-tiptap-editor/blockquote'
import { Bold, RichTextBold } from 'reactjs-tiptap-editor/bold'
import {
  RichTextBubbleCallout,
  RichTextBubbleCodeBlock,
  RichTextBubbleColumns,
  RichTextBubbleIframe,
  RichTextBubbleImage,
  RichTextBubbleKatex,
  RichTextBubbleLink,
  RichTextBubbleMenuDragHandle,
  RichTextBubbleTable,
  RichTextBubbleText,
  RichTextBubbleVideo,
} from 'reactjs-tiptap-editor/bubble'
import { BulletList, RichTextBulletList } from 'reactjs-tiptap-editor/bulletlist'
import { Callout, RichTextCallout } from 'reactjs-tiptap-editor/callout'
import { Clear, RichTextClear } from 'reactjs-tiptap-editor/clear'
import { Code, RichTextCode } from 'reactjs-tiptap-editor/code'
import { CodeBlock, RichTextCodeBlock } from 'reactjs-tiptap-editor/codeblock'
import { CodeView, RichTextCodeView } from 'reactjs-tiptap-editor/codeview'
import { Color, RichTextColor } from 'reactjs-tiptap-editor/color'
import { Column, ColumnNode, MultipleColumnNode, RichTextColumn } from 'reactjs-tiptap-editor/column'
import { Emoji, RichTextEmoji } from 'reactjs-tiptap-editor/emoji'
import { ExportPdf, RichTextExportPdf } from 'reactjs-tiptap-editor/exportpdf'
import { ExportWord, RichTextExportWord } from 'reactjs-tiptap-editor/exportword'
import { FontFamily, RichTextFontFamily } from 'reactjs-tiptap-editor/fontfamily'
import { FontSize, RichTextFontSize } from 'reactjs-tiptap-editor/fontsize'
import { Heading, RichTextHeading } from 'reactjs-tiptap-editor/heading'
import { Highlight, RichTextHighlight } from 'reactjs-tiptap-editor/highlight'
import { History, RichTextRedo, RichTextUndo } from 'reactjs-tiptap-editor/history'
import { HorizontalRule, RichTextHorizontalRule } from 'reactjs-tiptap-editor/horizontalrule'
import { Iframe, RichTextIframe } from 'reactjs-tiptap-editor/iframe'
import { Image, RichTextImage } from 'reactjs-tiptap-editor/image'
import { ImportWord, RichTextImportWord } from 'reactjs-tiptap-editor/importword'
import { Indent, RichTextIndent } from 'reactjs-tiptap-editor/indent'
import { Italic, RichTextItalic } from 'reactjs-tiptap-editor/italic'
import { Katex, RichTextKatex } from 'reactjs-tiptap-editor/katex'
import { LineHeight, RichTextLineHeight } from 'reactjs-tiptap-editor/lineheight'
import { Link, RichTextLink } from 'reactjs-tiptap-editor/link'
import { MarkdownPaste } from 'reactjs-tiptap-editor/markdownpaste'
import { MoreMark, RichTextMoreMark } from 'reactjs-tiptap-editor/moremark'
import { OrderedList, RichTextOrderedList } from 'reactjs-tiptap-editor/orderedlist'
import { RichTextSearchAndReplace, SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace'
import { SlashCommand } from 'reactjs-tiptap-editor/slashcommand'
import { RichTextStrike, Strike } from 'reactjs-tiptap-editor/strike'
import { RichTextTable, Table } from 'reactjs-tiptap-editor/table'
import { RichTextTaskList, TaskList } from 'reactjs-tiptap-editor/tasklist'
import { RichTextAlign, TextAlign } from 'reactjs-tiptap-editor/textalign'
import { RichTextTextDirection, TextDirection } from 'reactjs-tiptap-editor/textdirection'
import { RichTextUnderline, TextUnderline } from 'reactjs-tiptap-editor/textunderline'
import { RichTextVideo, Video } from 'reactjs-tiptap-editor/video'

import { all, createLowlight } from 'lowlight'

import 'react-image-crop/dist/ReactCrop.css'
import 'reactjs-tiptap-editor/style.css'

const lowlight = createLowlight(all)

import { apiClient } from '../../../../lib/api/ucode/base'
import { queryClient } from '../../../../lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '../../../../lib/utils/notifications'
import { authStore } from '../../../../store/auth.store'

const DocumentCustom = Document.extend({
  content: '(block|columns)+',
})

const uploadToCdn = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(
    'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.authToken}` },
      body: formData,
    },
  )
  const data = await res.json()
  const link = data?.data?.link
  return link ? `https://cdn.u-code.io/${link}` : ''
}

const editorExtensions = [
  DocumentCustom,
  Text,
  Paragraph,
  HardBreak,
  ListItem,
  TextStyle,
  Dropcursor.configure({ color: '#0E73F6', width: 2 }),
  Gapcursor,
  TrailingNode,
  Placeholder.configure({ placeholder: "Нажмите '/' для команд" }),

  History,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  Code,
  MoreMark,

  Color.configure({ defaultColor: '#000000' }),
  Highlight.configure({ defaultColor: '#ffff00' }),
  FontFamily,
  FontSize,
  LineHeight,

  Heading,
  Blockquote,
  Callout,
  BulletList,
  OrderedList,
  TaskList,
  HorizontalRule,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextDirection,
  Indent,

  Link,
  Image.configure({ upload: uploadToCdn, resourceImage: 'both' }),
  Video,
  Iframe,
  Table,
  CodeBlock.configure({ lowlight }),
  Katex,
  Emoji,
  Column,
  ColumnNode,
  MultipleColumnNode,
  Attachment.configure({ upload: uploadToCdn }),

  SearchAndReplace,
  SlashCommand,
  MarkdownPaste,
  Clear,
  CodeView,
  ExportPdf.configure({ paperSize: 'A4' }),
  ExportWord,
  ImportWord,
]

const ContractPage = observer(() => {
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
        <h1 className="text-xl font-bold text-slate-900">Договоры</h1>
        <p className="text-sm text-slate-500 mt-1">Список договоров по филиалам</p>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Филиал</th>
              <th className="text-left px-4 py-3 font-medium">Файл</th>
              <th className="text-right px-4 py-3 font-medium w-32">Действия</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Договоры не найдены
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
                      <span className="text-slate-400">—</span>
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
                        Редактировать
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

function ContractEditDialog({ contract, onClose, onSuccess }) {
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const editor = useEditor({
    extensions: editorExtensions,
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!contract?.file) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(contract.file)
        const text = await res.text()
        if (cancelled) return
        editor?.commands.setContent(text)
      } catch {
        if (!cancelled) showErrorNotification('Не удалось загрузить договор')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (editor) load()
    return () => {
      cancelled = true
    }
  }, [contract?.file, editor])

  const { mutate, isPending } = useMutation({
    mutationKey: ['update_contract', contract?.guid],
    mutationFn: (payload) =>
      apiClient.defaultUcodeFunction({
        urlMethod: 'PUT',
        urlParams: `/items/templates?from-ofs=true`,
        data: payload,
      }),
    onSuccess: () => {
      showSuccessNotification('Договор успешно сохранён')
      onSuccess?.()
    },
    onError: () => {
      showErrorNotification('Не удалось сохранить договор')
    },
  })

  const handleSave = async () => {
    if (!editor) return
    setIsSaving(true)
    try {
      const html = editor.getHTML()
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
      showErrorNotification('Не удалось загрузить файл договора')
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
          <h2 className="text-lg font-bold text-slate-900">Редактирование договора</h2>
          {contract.branch_name && (
            <p className="text-sm text-slate-500 mt-0.5">{contract.branch_name}</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-auto min-h-[500px] max-h-[75vh]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="animate-spin text-slate-400" size={24} />
          </div>
        ) : (
          <RichTextProvider editor={editor}>
            <div className="flex flex-wrap items-center gap-1 border-b sticky top-0 z-20 border-gray-200 bg-gray-50 px-3 py-2">
              <RichTextUndo />
              <RichTextRedo />
              <span className="mx-1 h-5 w-px bg-gray-300" />
              <RichTextHeading />
              <RichTextFontFamily />
              <RichTextFontSize />
              <span className="mx-1 h-5 w-px bg-gray-300" />
              <RichTextBold />
              <RichTextItalic />
              <RichTextUnderline />
              <RichTextStrike />
              <RichTextCode />
              <RichTextMoreMark />
              <span className="mx-1 h-5 w-px bg-gray-300" />
              <RichTextColor />
              <RichTextHighlight />
              <span className="mx-1 h-5 w-px bg-gray-300" />
              <RichTextAlign />
              <RichTextTextDirection />
              <RichTextLineHeight />
              <RichTextIndent />
              <span className="mx-1 h-5 w-px bg-gray-300" />
              <RichTextBulletList />
              <RichTextOrderedList />
              <RichTextTaskList />
              <RichTextBlockquote />
              <RichTextCallout />
              <RichTextHorizontalRule />
              <span className="mx-1 h-5 w-px bg-gray-300" />
              <RichTextLink />
              <RichTextImage />
              <RichTextVideo />
              <RichTextIframe />
              <RichTextTable />
              <RichTextColumn />
              <RichTextCodeBlock />
              <RichTextKatex />
              <RichTextEmoji />
              <RichTextAttachment />
              <span className="mx-1 h-5 w-px bg-gray-300" />
              <RichTextSearchAndReplace />
              <RichTextImportWord />
              <RichTextExportWord />
              <RichTextExportPdf />
              <RichTextCodeView />
              <RichTextClear />
            </div>

            <RichTextBubbleMenuDragHandle />
            <RichTextBubbleText />
            <RichTextBubbleLink />
            <RichTextBubbleImage />
            <RichTextBubbleVideo />
            <RichTextBubbleTable />
            <RichTextBubbleIframe />
            <RichTextBubbleColumns />
            <RichTextBubbleCallout />
            <RichTextBubbleKatex />
            <RichTextBubbleCodeBlock />

            <div className="flex-1 overflow-auto bg-white overflow-x-auto">
              <EditorContent editor={editor} />
            </div>
          </RichTextProvider>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending || isSaving}
          className="px-4 py-2 text-sm font-medium text-slate-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || isSaving || loading || !editor}
          className="flex items-center gap-2 px-4 py-2 bg-[#0E73F6] text-white text-sm font-medium rounded-lg hover:bg-[#0a5fd1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          Сохранить
        </button>
      </div>
    </CustomDialog>
  )
}

export default ContractPage
