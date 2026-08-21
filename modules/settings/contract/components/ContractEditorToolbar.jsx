'use client'

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Highlighter,
  Indent,
  Italic,
  List,
  ListOrdered,
  Outdent,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const TEXT_COLORS = [
  '#0f172a',
  '#334155',
  '#64748b',
  '#0E73F6',
  '#0ea5e9',
  '#16a34a',
  '#ca8a04',
  '#dc2626',
  '#9333ea',
  '#ffffff',
]

const HIGHLIGHT_COLORS = [
  '#fef3c7',
  '#fde68a',
  '#bbf7d0',
  '#bfdbfe',
  '#e9d5ff',
  '#fecaca',
  '#e2e8f0',
  '#fdba74',
]

const BLOCKS = ['p', 'h1', 'h2', 'h3']
const FONT_SIZES = ['2', '3', '4', '5', '6']

const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-gray-200" />

const ToolbarButton = ({ icon: Icon, label, active, disabled, onClick }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={!!active}
    disabled={disabled}
    // фокус остаётся в редакторе — иначе выделение в iframe теряется
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? 'bg-[#0E73F6]/10 text-[#0E73F6]'
        : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-[0_1px_3px_rgba(15,23,42,0.08)]'
    }`}
  >
    <Icon size={15} strokeWidth={2.1} />
  </button>
)

const ToolbarSelect = ({ value, onChange, disabled, label, children }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="h-8 shrink-0 cursor-pointer rounded-md border border-gray-200 bg-white px-2 text-[12.5px] text-slate-700 outline-none transition-colors hover:border-gray-300 focus:border-[#0E73F6] disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </select>
)

/** Кнопка с палитрой: цвет текста и заливка. */
const ColorPicker = ({ icon: Icon, label, colors, resetLabel, onPick, onReset, disabled }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        title={label}
        aria-label={label}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          open
            ? 'bg-[#0E73F6]/10 text-[#0E73F6]'
            : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-[0_1px_3px_rgba(15,23,42,0.08)]'
        }`}
      >
        <Icon size={15} strokeWidth={2.1} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(color)
                  setOpen(false)
                }}
                className="h-6 w-6 rounded-md border border-black/10 transition-transform hover:scale-110"
                style={{ background: color }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onReset()
              setOpen(false)
            }}
            className="mt-2 w-full rounded-md px-2 py-1.5 text-[11.5px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            {resetLabel}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Панель форматирования редактора договора. Все действия уходят наверх через
 * `onCommand` — сам редактор живёт в iframe и управляется execCommand.
 */
const ContractEditorToolbar = ({ format, onCommand, disabled = false, tco }) => {
  const t = (key) => tco?.(`editDialog.toolbar.${key}`) ?? key

  const toggles = [
    { command: 'bold', icon: Bold, label: t('bold'), active: format.bold },
    { command: 'italic', icon: Italic, label: t('italic'), active: format.italic },
    { command: 'underline', icon: Underline, label: t('underline'), active: format.underline },
    {
      command: 'strikeThrough',
      icon: Strikethrough,
      label: t('strike'),
      active: format.strikeThrough,
    },
  ]

  const alignments = [
    { command: 'justifyLeft', icon: AlignLeft, label: t('alignLeft'), value: 'left' },
    { command: 'justifyCenter', icon: AlignCenter, label: t('alignCenter'), value: 'center' },
    { command: 'justifyRight', icon: AlignRight, label: t('alignRight'), value: 'right' },
    { command: 'justifyFull', icon: AlignJustify, label: t('alignJustify'), value: 'justify' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-slate-50/80 px-4 py-2">
      <ToolbarButton
        icon={Undo2}
        label={t('undo')}
        disabled={disabled}
        onClick={() => onCommand('undo')}
      />
      <ToolbarButton
        icon={Redo2}
        label={t('redo')}
        disabled={disabled}
        onClick={() => onCommand('redo')}
      />

      <Divider />

      <ToolbarSelect
        value={format.block}
        disabled={disabled}
        label={t('block.label')}
        onChange={(value) => onCommand('formatBlock', `<${value}>`)}
      >
        {BLOCKS.map((block) => (
          <option key={block} value={block}>
            {t(`block.${block}`)}
          </option>
        ))}
      </ToolbarSelect>

      <ToolbarSelect
        value={FONT_SIZES.includes(format.fontSize) ? format.fontSize : '3'}
        disabled={disabled}
        label={t('size.label')}
        onChange={(value) => onCommand('fontSize', value)}
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {t(`size.${size}`)}
          </option>
        ))}
      </ToolbarSelect>

      <Divider />

      {toggles.map((item) => (
        <ToolbarButton
          key={item.command}
          icon={item.icon}
          label={item.label}
          active={item.active}
          disabled={disabled}
          onClick={() => onCommand(item.command)}
        />
      ))}

      <ColorPicker
        icon={Baseline}
        label={t('textColor')}
        colors={TEXT_COLORS}
        resetLabel={t('defaultColor')}
        disabled={disabled}
        onPick={(color) => onCommand('foreColor', color)}
        onReset={() => onCommand('foreColor', '#0f172a')}
      />
      <ColorPicker
        icon={Highlighter}
        label={t('highlight')}
        colors={HIGHLIGHT_COLORS}
        resetLabel={t('noHighlight')}
        disabled={disabled}
        onPick={(color) => onCommand('hiliteColor', color)}
        onReset={() => onCommand('hiliteColor', 'transparent')}
      />

      <Divider />

      {alignments.map((item) => (
        <ToolbarButton
          key={item.command}
          icon={item.icon}
          label={item.label}
          active={format.align === item.value}
          disabled={disabled}
          onClick={() => onCommand(item.command)}
        />
      ))}

      <Divider />

      <ToolbarButton
        icon={List}
        label={t('bulletList')}
        active={format.ul}
        disabled={disabled}
        onClick={() => onCommand('insertUnorderedList')}
      />
      <ToolbarButton
        icon={ListOrdered}
        label={t('numberedList')}
        active={format.ol}
        disabled={disabled}
        onClick={() => onCommand('insertOrderedList')}
      />
      <ToolbarButton
        icon={Outdent}
        label={t('outdent')}
        disabled={disabled}
        onClick={() => onCommand('outdent')}
      />
      <ToolbarButton
        icon={Indent}
        label={t('indent')}
        disabled={disabled}
        onClick={() => onCommand('indent')}
      />

      <Divider />

      <ToolbarButton
        icon={RemoveFormatting}
        label={t('clearFormat')}
        disabled={disabled}
        onClick={() => onCommand('removeFormat')}
      />
    </div>
  )
}

export default ContractEditorToolbar
