'use client'

import {
  Archive as PhArchive,
  ArrowCounterClockwise as PhArrowCounterClockwise,
  ArrowDownLeft as PhArrowDownLeft,
  ArrowElbowDownRight as PhArrowElbowDownRight,
  ArrowLeft as PhArrowLeft,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowUUpLeft as PhArrowUUpLeft,
  ArrowUUpRight as PhArrowUUpRight,
  ArrowUpRight as PhArrowUpRight,
  ArrowsClockwise as PhArrowsClockwise,
  ArrowsDownUp as PhArrowsDownUp,
  ArrowsIn as PhArrowsIn,
  ArrowsLeftRight as PhArrowsLeftRight,
  ArrowsOut as PhArrowsOut,
  Bank as PhBank,
  BatteryFull as PhBatteryFull,
  Bell as PhBell,
  Books as PhBooks,
  BoxArrowUp as PhBoxArrowUp,
  BracketsCurly as PhBracketsCurly,
  Briefcase as PhBriefcase,
  Buildings as PhBuildings,
  Calendar as PhCalendar,
  CalendarBlank as PhCalendarBlank,
  CalendarCheck as PhCalendarCheck,
  CalendarDots as PhCalendarDots,
  CalendarX as PhCalendarX,
  CaretDoubleLeft as PhCaretDoubleLeft,
  CaretDoubleRight as PhCaretDoubleRight,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  CellSignalFull as PhCellSignalFull,
  ChartBar as PhChartBar,
  ChartLine as PhChartLine,
  ChatText as PhChatText,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  Checks as PhChecks,
  CircleNotch as PhCircleNotch,
  ClipboardText as PhClipboardText,
  Clock as PhClock,
  ClockCounterClockwise as PhClockCounterClockwise,
  Coins as PhCoins,
  Copy as PhCopy,
  CreditCard as PhCreditCard,
  Cube as PhCube,
  CurrencyDollar as PhCurrencyDollar,
  CurrencyKzt as PhCurrencyKzt,
  CurrencyRub as PhCurrencyRub,
  Database as PhDatabase,
  DeviceMobile as PhDeviceMobile,
  DotsThree as PhDotsThree,
  DotsThreeVertical as PhDotsThreeVertical,
  DownloadSimple as PhDownloadSimple,
  Envelope as PhEnvelope,
  Eraser as PhEraser,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  FileArrowDown as PhFileArrowDown,
  FileText as PhFileText,
  FileX as PhFileX,
  FileXls as PhFileXls,
  FloppyDisk as PhFloppyDisk,
  Folder as PhFolder,
  FolderOpen as PhFolderOpen,
  FolderPlus as PhFolderPlus,
  Gauge as PhGauge,
  Gear as PhGear,
  GitBranch as PhGitBranch,
  Globe as PhGlobe,
  Handshake as PhHandshake,
  Hash as PhHash,
  Highlighter as PhHighlighter,
  House as PhHouse,
  Kanban as PhKanban,
  List as PhList,
  ListNumbers as PhListNumbers,
  MagnifyingGlass as PhMagnifyingGlass,
  MapPin as PhMapPin,
  Minus as PhMinus,
  Money as PhMoney,
  Package as PhPackage,
  PaperPlaneRight as PhPaperPlaneRight,
  Paperclip as PhPaperclip,
  Pause as PhPause,
  PencilLine as PhPencilLine,
  PencilSimple as PhPencilSimple,
  Percent as PhPercent,
  PiggyBank as PhPiggyBank,
  Plus as PhPlus,
  PlusCircle as PhPlusCircle,
  Question as PhQuestion,
  Receipt as PhReceipt,
  Rows as PhRows,
  Scales as PhScales,
  Shield as PhShield,
  ShieldCheck as PhShieldCheck,
  Sigma as PhSigma,
  SignOut as PhSignOut,
  Signature as PhSignature,
  SlidersHorizontal as PhSlidersHorizontal,
  SquaresFour as PhSquaresFour,
  Stack as PhStack,
  Tag as PhTag,
  TextAUnderline as PhTextAUnderline,
  TextAlignCenter as PhTextAlignCenter,
  TextAlignJustify as PhTextAlignJustify,
  TextAlignLeft as PhTextAlignLeft,
  TextAlignRight as PhTextAlignRight,
  TextB as PhTextB,
  TextIndent as PhTextIndent,
  TextItalic as PhTextItalic,
  TextOutdent as PhTextOutdent,
  TextStrikethrough as PhTextStrikethrough,
  TextUnderline as PhTextUnderline,
  Translate as PhTranslate,
  Trash as PhTrash,
  TreeStructure as PhTreeStructure,
  TrendDown as PhTrendDown,
  TrendUp as PhTrendUp,
  Truck as PhTruck,
  User as PhUser,
  UserPlus as PhUserPlus,
  Users as PhUsers,
  UsersThree as PhUsersThree,
  Wallet as PhWallet,
  Warehouse as PhWarehouse,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  WifiHigh as PhWifiHigh,
  Wrench as PhWrench,
  X as PhX,
} from '@phosphor-icons/react'
import { forwardRef } from 'react'

/**
 * Значки продукта — набор Phosphor (MIT, без условий), общий для
 * компьютера и телефона.
 *
 * Экспортируются под прежними именами (как в lucide-react и react-icons),
 * поэтому замена набора — строка импорта в файле, а не правка разметки.
 *
 * Толщина: по умолчанию ICON_WEIGHT (bold — её утвердили на телефоне).
 * Проп strokeWidth из lucide переводится в толщину Phosphor: 1.5 и тоньше —
 * regular (тонкие значки сайдбара), толще — bold. fill="currentColor"
 * (закрашенный значок) — вес fill. Остальные пропы lucide отбрасываются.
 */

/** Толщина по умолчанию: 'regular' | 'bold' | 'light' | 'thin' | 'fill' | 'duotone'. */
export const ICON_WEIGHT = 'bold'

const weightFor = ({ weight, strokeWidth, fill }) => {
  if (weight) return weight
  if (fill && fill !== 'none') return 'fill'
  if (strokeWidth != null && Number(strokeWidth) <= 1.5) return 'regular'
  return ICON_WEIGHT
}

/** @returns {import('react').ForwardRefExoticComponent<any>} */
const wrap = (Icon, name) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Wrapped = forwardRef(function ProductIcon({ weight, strokeWidth, absoluteStrokeWidth, fill, stroke, ...props }, ref) {
    return <Icon ref={ref} weight={weightFor({ weight, strokeWidth, fill })} {...props} />
  })
  Wrapped.displayName = name
  return Wrapped
}

export const ArrowDownLeft = wrap(PhArrowDownLeft, 'ArrowDownLeft')
export const ArrowUpRight = wrap(PhArrowUpRight, 'ArrowUpRight')
export const ArrowLeft = wrap(PhArrowLeft, 'ArrowLeft')
export const ArrowLeftRight = wrap(PhArrowsLeftRight, 'ArrowLeftRight')
export const ArrowDownUp = wrap(PhArrowsDownUp, 'ArrowDownUp')
export const Undo2 = wrap(PhArrowUUpLeft, 'Undo2')
export const Redo2 = wrap(PhArrowUUpRight, 'Redo2')
export const CornerDownRight = wrap(PhArrowElbowDownRight, 'CornerDownRight')
export const RotateCcw = wrap(PhArrowCounterClockwise, 'RotateCcw')
export const RefreshCw = wrap(PhArrowsClockwise, 'RefreshCw')
export const ExternalLink = wrap(PhArrowSquareOut, 'ExternalLink')
export const Maximize2 = wrap(PhArrowsOut, 'Maximize2')
export const Minimize2 = wrap(PhArrowsIn, 'Minimize2')
export const Download = wrap(PhDownloadSimple, 'Download')
export const LogOut = wrap(PhSignOut, 'LogOut')
export const ChevronRight = wrap(PhCaretRight, 'ChevronRight')
export const ChevronRightIcon = wrap(PhCaretRight, 'ChevronRightIcon')
export const ChevronLeft = wrap(PhCaretLeft, 'ChevronLeft')
export const ChevronDown = wrap(PhCaretDown, 'ChevronDown')
export const ChevronUp = wrap(PhCaretUp, 'ChevronUp')
export const ChevronsRight = wrap(PhCaretDoubleRight, 'ChevronsRight')
export const ChevronsLeft = wrap(PhCaretDoubleLeft, 'ChevronsLeft')
export const Wallet = wrap(PhWallet, 'Wallet')
export const Banknote = wrap(PhMoney, 'Banknote')
export const Landmark = wrap(PhBank, 'Landmark')
export const Coins = wrap(PhCoins, 'Coins')
export const PiggyBank = wrap(PhPiggyBank, 'PiggyBank')
export const Percent = wrap(PhPercent, 'Percent')
export const Scale = wrap(PhScales, 'Scale')
export const TrendingUp = wrap(PhTrendUp, 'TrendingUp')
export const TrendingDown = wrap(PhTrendDown, 'TrendingDown')
export const BarChart3 = wrap(PhChartBar, 'BarChart3')
export const ChartLine = wrap(PhChartLine, 'ChartLine')
export const Receipt = wrap(PhReceipt, 'Receipt')
export const ReceiptText = wrap(PhReceipt, 'ReceiptText')
export const Database = wrap(PhDatabase, 'Database')
export const Gauge = wrap(PhGauge, 'Gauge')
export const Sigma = wrap(PhSigma, 'Sigma')
export const Hash = wrap(PhHash, 'Hash')
export const CreditCard = wrap(PhCreditCard, 'CreditCard')
export const CurrencyRub = wrap(PhCurrencyRub, 'CurrencyRub')
export const CurrencyKzt = wrap(PhCurrencyKzt, 'CurrencyKzt')
export const CurrencyDollar = wrap(PhCurrencyDollar, 'CurrencyDollar')
export const Home = wrap(PhHouse, 'Home')
export const User = wrap(PhUser, 'User')
export const Users = wrap(PhUsers, 'Users')
export const UserPlus = wrap(PhUserPlus, 'UserPlus')
export const Briefcase = wrap(PhBriefcase, 'Briefcase')
export const Building2 = wrap(PhBuildings, 'Building2')
export const Warehouse = wrap(PhWarehouse, 'Warehouse')
export const Package = wrap(PhPackage, 'Package')
export const PackageCheck = wrap(PhPackage, 'PackageCheck')
export const PackageOpen = wrap(PhPackage, 'PackageOpen')
export const Truck = wrap(PhTruck, 'Truck')
export const Boxes = wrap(PhCube, 'Boxes')
export const Layers = wrap(PhStack, 'Layers')
export const Library = wrap(PhBooks, 'Library')
export const FolderTree = wrap(PhTreeStructure, 'FolderTree')
export const ListTree = wrap(PhTreeStructure, 'ListTree')
export const FolderKanban = wrap(PhKanban, 'FolderKanban')
export const ClipboardList = wrap(PhClipboardText, 'ClipboardList')
export const ClipboardCheck = wrap(PhClipboardText, 'ClipboardCheck')
export const Languages = wrap(PhTranslate, 'Languages')
export const Wrench = wrap(PhWrench, 'Wrench')
export const Shield = wrap(PhShield, 'Shield')
export const ShieldCheck = wrap(PhShieldCheck, 'ShieldCheck')
export const Bell = wrap(PhBell, 'Bell')
export const Handshake = wrap(PhHandshake, 'Handshake')
export const Settings = wrap(PhGear, 'Settings')
export const Globe = wrap(PhGlobe, 'Globe')
export const MapPin = wrap(PhMapPin, 'MapPin')
export const Mail = wrap(PhEnvelope, 'Mail')
export const Smartphone = wrap(PhDeviceMobile, 'Smartphone')
export const Tag = wrap(PhTag, 'Tag')
export const GitBranch = wrap(PhGitBranch, 'GitBranch')
export const History = wrap(PhClockCounterClockwise, 'History')
export const Clock = wrap(PhClock, 'Clock')
export const Variable = wrap(PhBracketsCurly, 'Variable')
export const DealsIcon = wrap(PhHandshake, 'DealsIcon')
export const CounterpartiesIcon = wrap(PhUsersThree, 'CounterpartiesIcon')
export const Calendar = wrap(PhCalendar, 'Calendar')
export const CalendarDays = wrap(PhCalendarBlank, 'CalendarDays')
export const CalendarRange = wrap(PhCalendarDots, 'CalendarRange')
export const CalendarCheck = wrap(PhCalendarCheck, 'CalendarCheck')
export const CalendarClock = wrap(PhCalendarDots, 'CalendarClock')
export const CalendarX = wrap(PhCalendarX, 'CalendarX')
export const Plus = wrap(PhPlus, 'Plus')
export const PlusCircle = wrap(PhPlusCircle, 'PlusCircle')
export const CirclePlus = wrap(PhPlusCircle, 'CirclePlus')
export const Minus = wrap(PhMinus, 'Minus')
export const MinusIcon = wrap(PhMinus, 'MinusIcon')
export const Pencil = wrap(PhPencilSimple, 'Pencil')
export const Edit2 = wrap(PhPencilSimple, 'Edit2')
export const PenLine = wrap(PhPencilLine, 'PenLine')
export const Trash = wrap(PhTrash, 'Trash')
export const Trash2 = wrap(PhTrash, 'Trash2')
export const TrashIcon = wrap(PhTrash, 'TrashIcon')
export const Copy = wrap(PhCopy, 'Copy')
export const Check = wrap(PhCheck, 'Check')
export const CheckIcon = wrap(PhCheck, 'CheckIcon')
export const CheckCheck = wrap(PhChecks, 'CheckCheck')
export const CheckCircle2 = wrap(PhCheckCircle, 'CheckCircle2')
export const X = wrap(PhX, 'X')
export const XIcon = wrap(PhX, 'XIcon')
export const Search = wrap(PhMagnifyingGlass, 'Search')
export const SlidersHorizontal = wrap(PhSlidersHorizontal, 'SlidersHorizontal')
export const MoreHorizontal = wrap(PhDotsThree, 'MoreHorizontal')
export const EllipsisVertical = wrap(PhDotsThreeVertical, 'EllipsisVertical')
export const Send = wrap(PhPaperPlaneRight, 'Send')
export const Paperclip = wrap(PhPaperclip, 'Paperclip')
export const Save = wrap(PhFloppyDisk, 'Save')
export const Archive = wrap(PhArchive, 'Archive')
export const ArchiveRestore = wrap(PhBoxArrowUp, 'ArchiveRestore')
export const Pause = wrap(PhPause, 'Pause')
export const FileDown = wrap(PhFileArrowDown, 'FileDown')
export const FileText = wrap(PhFileText, 'FileText')
export const FileSpreadsheet = wrap(PhFileXls, 'FileSpreadsheet')
export const FileSignature = wrap(PhSignature, 'FileSignature')
export const FileX2 = wrap(PhFileX, 'FileX2')
export const Folder = wrap(PhFolder, 'Folder')
export const FolderOpen = wrap(PhFolderOpen, 'FolderOpen')
export const FolderPlus = wrap(PhFolderPlus, 'FolderPlus')
export const MessageSquareText = wrap(PhChatText, 'MessageSquareText')
export const Eye = wrap(PhEye, 'Eye')
export const EyeOff = wrap(PhEyeSlash, 'EyeOff')
export const Rows3 = wrap(PhRows, 'Rows3')
export const LayoutGrid = wrap(PhSquaresFour, 'LayoutGrid')
export const List = wrap(PhList, 'List')
export const ListOrdered = wrap(PhListNumbers, 'ListOrdered')
export const AlertCircle = wrap(PhWarningCircle, 'AlertCircle')
export const AlertTriangle = wrap(PhWarning, 'AlertTriangle')
export const TriangleAlert = wrap(PhWarning, 'TriangleAlert')
export const HelpCircle = wrap(PhQuestion, 'HelpCircle')
export const CircleQuestionMark = wrap(PhQuestion, 'CircleQuestionMark')
export const Loader = wrap(PhCircleNotch, 'Loader')
export const Loader2 = wrap(PhCircleNotch, 'Loader2')
export const Bold = wrap(PhTextB, 'Bold')
export const Italic = wrap(PhTextItalic, 'Italic')
export const Underline = wrap(PhTextUnderline, 'Underline')
export const Strikethrough = wrap(PhTextStrikethrough, 'Strikethrough')
export const AlignLeft = wrap(PhTextAlignLeft, 'AlignLeft')
export const AlignCenter = wrap(PhTextAlignCenter, 'AlignCenter')
export const AlignRight = wrap(PhTextAlignRight, 'AlignRight')
export const AlignJustify = wrap(PhTextAlignJustify, 'AlignJustify')
export const Indent = wrap(PhTextIndent, 'Indent')
export const Outdent = wrap(PhTextOutdent, 'Outdent')
export const Highlighter = wrap(PhHighlighter, 'Highlighter')
export const RemoveFormatting = wrap(PhEraser, 'RemoveFormatting')
export const Baseline = wrap(PhTextAUnderline, 'Baseline')
export const Signal = wrap(PhCellSignalFull, 'Signal')
export const Wifi = wrap(PhWifiHigh, 'Wifi')
export const BatteryFull = wrap(PhBatteryFull, 'BatteryFull')

// Закрашенные и двухтонные варианты — замены значков react-icons
/** @returns {import('react').ForwardRefExoticComponent<any>} */
const withWeight = (Icon, weight, name) => {
  const Weighted = forwardRef(function WeightedIcon(props, ref) {
    return <Icon ref={ref} weight={weight} {...props} />
  })
  Weighted.displayName = name
  return Weighted
}
export const DatabaseFill = withWeight(Database, 'fill', 'DatabaseFill')
export const CurrencyKztDuotone = withWeight(CurrencyKzt, 'duotone', 'CurrencyKztDuotone')
