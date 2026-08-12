import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { showErrorNotification } from '@/lib/utils/notifications'
import createDOMPurify from 'dompurify'
import moment from 'moment'

// Ширина A4 при 96dpi — верстаем скрытый контейнер под неё, иначе html2canvas
// снимет узкий скриншот и текст в PDF окажется мелким
const A4_WIDTH_PX = 794

// Акт приходит с бэка как готовый HTML-документ: сохраняем таблицы и стили,
// но вырезаем скрипты и обработчики событий
const SANITIZE_OPTS = {
  WHOLE_DOCUMENT: true,
  ADD_TAGS: ['style'],
  ADD_ATTR: [
    'style', 'colspan', 'rowspan', 'align', 'valign',
    'width', 'height', 'cellpadding', 'cellspacing', 'border', 'bgcolor',
  ],
}

const HTML_KEYS = ['html', 'content', 'act', 'body']

/**
 * Достаёт HTML акта из ответа. Бэк кладёт его в `data.html` — рядом с
 * `data.data`, где лежит разобранный акт (columns/tables/total), поэтому
 * проверяем каждый уровень вложенности, а не какой-то один.
 */
const readHtml = (res) => {
  const levels = [res, res?.data, res?.data?.data]
  for (const level of levels) {
    if (typeof level === 'string' && level.trim()) return level
    for (const key of HTML_KEYS) {
      const value = level?.[key]
      if (typeof value === 'string' && value.trim()) return value
    }
  }
  return ''
}

/**
 * Рендерит акт в отдельном iframe и отдаёт его body для снимка.
 *
 * Рендерить в основном документе нельзя: html2canvas читает вычисленные стили,
 * а глобальный CSS приложения (Tailwind 4 / shadcn) задаёт цвета через
 * `oklch()` и `color-mix()`, которые html2canvas парсить не умеет — падает с
 * «Attempting to parse an unsupported color function "lab"». В iframe
 * подключены только стили самого акта, поэтому таких цветов там нет.
 *
 * ВАЖНО: снимать нужно html2canvas-ом напрямую, НЕ через html2pdf.js —
 * тот перед снимком клонирует элемент в overlay-контейнер в ОСНОВНОМ
 * документе, где на клон снова каскадируют oklch-стили приложения,
 * и изоляция iframe теряется.
 */
const renderInIsolatedFrame = async (safeHtml) => {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  Object.assign(frame.style, {
    position: 'fixed',
    top: '0',
    left: '-10000px',
    width: `${A4_WIDTH_PX}px`,
    height: '1123px', // A4 при 96dpi — стартовая высота, ниже подгоняем под контент
    border: '0',
    background: '#fff',
  })
  document.body.appendChild(frame)

  const doc = frame.contentDocument || frame.contentWindow?.document
  doc.open()
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><style>` +
      `html,body{margin:0;padding:0;background:#fff;color:#111;` +
      `font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;}` +
      `table{border-collapse:collapse;}` +
      `</style></head><body>${safeHtml}</body></html>`
  )
  doc.close()

  // ждём шрифты и раскладку — иначе в canvas попадёт недорисованный кадр
  try {
    await doc.fonts?.ready
  } catch {
    /* нет FontFaceSet — не критично */
  }
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  )

  // высота по контенту, чтобы html2canvas не обрезал акт на первой странице
  frame.style.height = `${doc.documentElement.scrollHeight}px`

  return { frame, body: doc.body }
}

/**
 * Акт сверки: запрашивает HTML у `act_of_reconciliation` и сохраняет как PDF.
 *
 * Один и тот же бэкенд-метод обслуживает контрагента, сделку по продаже и
 * сделку по закупке — различается только идентификатор (`idField`):
 * `counterparty_id` | `sales_transaction_id` | `purchase_transactions_id`.
 *
 * @param {Object} options
 * @param {string} options.id — идентификатор сущности
 * @param {string} [options.idField='counterparty_id'] — имя поля идентификатора
 * @param {string} [options.counterpartyId] — контрагент сделки/закупки; акт строится
 *        по нему, поэтому передаём отдельно. У контрагента idField уже равен
 *        counterparty_id, так что дублировать не нужно.
 * @param {{ operationDateStart?: string, operationDateEnd?: string }} [options.filters] —
 *        период; если не выбран, берём год по сегодняшний день
 * @param {string} [options.name] — попадёт в имя файла
 */
export function useActOfReconciliation({ id, idField = 'counterparty_id', counterpartyId, filters, name } = {}) {
  const { mutateAsync, isPending } = useUcodeRequestMutation()

  const downloadPdf = async () => {
    if (!id) return

    const fromDate =
      filters?.operationDateStart || moment().startOf('year').format('YYYY-MM-DD')
    const toDate = filters?.operationDateEnd || moment().format('YYYY-MM-DD')

    let frame
    try {
      const res = await mutateAsync({
        method: 'act_of_reconciliation',
        data: {
          from_date: fromDate,
          to_date: toDate,
          [idField]: id,
          ...(counterpartyId ? { counterparty_id: counterpartyId } : {}),
        },
      })

      const html = readHtml(res)
      if (!html) throw new Error('empty act html')

      // canvas/window есть только в браузере — грузим библиотеки по требованию
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const purify = createDOMPurify(window)

      const { frame: rendered, body } = await renderInIsolatedFrame(
        purify.sanitize(html, SANITIZE_OPTS)
      )
      frame = rendered

      // html2canvas клонирует документ iframe'а (чистый), а не основной
      const canvas = await html2canvas(body, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: A4_WIDTH_PX,
      })

      const fileName = `Акт сверки${name ? ` — ${name}` : ''} (${fromDate} — ${toDate}).pdf`

      // Режем длинный снимок на A4-страницы вручную (раньше это делал html2pdf)
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const PAGE_W = 210
      const PAGE_H = 297
      const MARGIN = 10
      const contentWmm = PAGE_W - MARGIN * 2
      const contentHmm = PAGE_H - MARGIN * 2
      const pxPerMm = canvas.width / contentWmm
      const pageHeightPx = Math.floor(contentHmm * pxPerMm)

      let renderedPx = 0
      let pageIndex = 0
      while (renderedPx < canvas.height) {
        const sliceH = Math.min(pageHeightPx, canvas.height - renderedPx)
        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = sliceH
        const ctx = slice.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, slice.width, slice.height)
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

        if (pageIndex > 0) pdf.addPage()
        pdf.addImage(
          slice.toDataURL('image/jpeg', 0.95),
          'JPEG',
          MARGIN,
          MARGIN,
          contentWmm,
          sliceH / pxPerMm
        )
        renderedPx += sliceH
        pageIndex += 1
      }

      pdf.save(fileName)
    } catch (error) {
      console.error('act_of_reconciliation', error)
      showErrorNotification(
        error?.details?.description || error?.message || 'Не удалось сформировать акт сверки'
      )
    } finally {
      frame?.remove()
    }
  }

  return { downloadPdf, isPending }
}
