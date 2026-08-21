'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const EMPTY_FORMAT = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  ul: false,
  ol: false,
  align: 'left',
  block: 'p',
  fontSize: '3',
}

const ALIGN_COMMANDS = {
  justifyCenter: 'center',
  justifyRight: 'right',
  justifyFull: 'justify',
}

const shallowEqual = (a, b) => Object.keys(a).every((key) => a[key] === b[key])

const readBlock = (doc) => {
  const value = String(doc.queryCommandValue('formatBlock') || '')
    .toLowerCase()
    .replace(/[<>]/g, '')
  return ['h1', 'h2', 'h3', 'h4', 'blockquote'].includes(value) ? value : 'p'
}

const readFormat = (doc) => {
  const state = (command) => {
    try {
      return doc.queryCommandState(command)
    } catch {
      return false
    }
  }

  let align = 'left'
  Object.entries(ALIGN_COMMANDS).forEach(([command, value]) => {
    if (state(command)) align = value
  })

  let fontSize = '3'
  try {
    fontSize = String(doc.queryCommandValue('fontSize') || '3')
  } catch {
    fontSize = '3'
  }

  return {
    bold: state('bold'),
    italic: state('italic'),
    underline: state('underline'),
    strikeThrough: state('strikeThrough'),
    ul: state('insertUnorderedList'),
    ol: state('insertOrderedList'),
    align,
    block: readBlock(doc),
    fontSize,
  }
}

/**
 * Редактор договора внутри iframe (designMode).
 *
 * Держит каретку: клик по кнопке тулбара или по переменной уводит фокус из
 * iframe, поэтому диапазон запоминается на каждое изменение выделения и
 * восстанавливается перед выполнением команды.
 */
export const useContractEditor = ({ fileUrl, onLoadError }) => {
  const iframeRef = useRef(null)
  const lastRangeRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [format, setFormat] = useState(EMPTY_FORMAT)

  const getDoc = useCallback(() => iframeRef.current?.contentDocument || null, [])

  const syncFormat = useCallback((doc) => {
    const next = readFormat(doc)
    setFormat((prev) => (shallowEqual(prev, next) ? prev : next))
  }, [])

  useEffect(() => {
    if (!fileUrl) {
      setLoading(false)
      return
    }
    let cancelled = false
    let cleanupEditor = null

    fetch(fileUrl)
      .then((response) => response?.text())
      .then((html) => {
        if (cancelled) return
        const doc = iframeRef.current?.contentDocument
        if (!doc) return

        doc.open()
        doc.write(html)
        doc.close()
        doc.designMode = 'on'
        // Форматирование пишем инлайновыми стилями, а не тегами <font>:
        // такой HTML переживает выгрузку и печать без сюрпризов
        try {
          doc.execCommand('styleWithCSS', false, true)
        } catch {
          /* Safari может не поддерживать — не критично */
        }

        const handleSelection = () => {
          const selection = doc.getSelection?.()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            if (doc.body?.contains(range.commonAncestorContainer)) {
              lastRangeRef.current = range.cloneRange()
            }
          }
          syncFormat(doc)
        }

        doc.addEventListener('mouseup', handleSelection)
        doc.addEventListener('keyup', handleSelection)
        doc.addEventListener('input', handleSelection)
        doc.addEventListener('selectionchange', handleSelection)
        cleanupEditor = () => {
          doc.removeEventListener('mouseup', handleSelection)
          doc.removeEventListener('keyup', handleSelection)
          doc.removeEventListener('input', handleSelection)
          doc.removeEventListener('selectionchange', handleSelection)
        }

        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        onLoadError?.()
        setLoading(false)
      })

    return () => {
      cancelled = true
      cleanupEditor?.()
      lastRangeRef.current = null
    }
    // onLoadError намеренно не в зависимостях: пересоздание колбэка не должно
    // перезагружать документ и терять правки
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, syncFormat])

  /** Возвращает каретку в редактор перед выполнением команды. */
  const restoreSelection = useCallback((doc) => {
    const win = iframeRef.current?.contentWindow
    if (!doc?.body || !win) return null

    win.focus()
    const selection = doc.getSelection()
    if (!selection) return null

    const saved = lastRangeRef.current
    const range = doc.createRange()
    if (saved && doc.body.contains(saved.commonAncestorContainer)) {
      range.setStart(saved.startContainer, saved.startOffset)
      range.setEnd(saved.endContainer, saved.endOffset)
    } else {
      // каретки не было — ставим в конец последнего блока, чтобы текст не упал
      // голым узлом прямо в <body>
      range.selectNodeContents(doc.body.lastElementChild || doc.body)
      range.collapse(false)
    }
    selection.removeAllRanges()
    selection.addRange(range)
    return selection
  }, [])

  const rememberSelection = useCallback((doc) => {
    const selection = doc.getSelection?.()
    if (selection?.rangeCount) lastRangeRef.current = selection.getRangeAt(0).cloneRange()
    syncFormat(doc)
  }, [syncFormat])

  /** Команда форматирования (bold, justifyCenter, foreColor, …). */
  const exec = useCallback(
    (command, value = null) => {
      const doc = getDoc()
      if (!doc) return
      if (!restoreSelection(doc)) return

      try {
        const done = doc.execCommand(command, false, value)
        // hiliteColor не поддерживается частью движков — там заливку ставит backColor
        if (!done && command === 'hiliteColor') doc.execCommand('backColor', false, value)
      } catch (error) {
        console.error('contract editor command failed:', command, error)
      }
      rememberSelection(doc)
    },
    [getDoc, restoreSelection, rememberSelection]
  )

  /** Вставка текста (переменной) в место каретки. */
  const insertText = useCallback(
    (text) => {
      const doc = getDoc()
      if (!doc) return
      const selection = restoreSelection(doc)
      if (!selection) return

      let inserted = false
      try {
        // execCommand сохраняет историю Undo редактора
        inserted = doc.execCommand('insertText', false, text)
      } catch {
        inserted = false
      }

      if (!inserted && selection.rangeCount) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const node = doc.createTextNode(text)
        range.insertNode(node)
        range.setStartAfter(node)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }

      rememberSelection(doc)
    },
    [getDoc, restoreSelection, rememberSelection]
  )

  const getHtml = useCallback(() => getDoc()?.documentElement?.outerHTML || '', [getDoc])

  return { iframeRef, loading, format, exec, insertText, getHtml }
}

export default useContractEditor
