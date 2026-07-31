/**
 * Разбор ошибок удаления от бэкенда.
 *
 * Бэк отвечает на «занятый» объект HTTP 200 с телом вида
 *   { status: "error", data: { client_error: "this object is used and you can't
 *     delete it", custom_message: "…", error: "…" } }
 * Такой ответ не выбрасывается как исключение (status в нижнем регистре и
 * response.ok === true), поэтому проверять его нужно и у результата запроса,
 * и у пойманной ошибки.
 */

const OBJECT_IN_USE = /used and you can'?t delete it/i

const safeStringify = (value) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const seen = new WeakSet()
  try {
    return (
      JSON.stringify(value, (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return undefined
          seen.add(val)
        }
        return val
      }) || ''
    )
  } catch {
    return ''
  }
}

/**
 * Весь текст, который может нести причину отказа. Ошибка приходит в разных
 * обличьях: как тело ответа (throw responseData), как Error с `details`,
 * как Error без полей — поэтому собираем всё, что удаётся прочитать.
 */
const collectErrorText = (payload) => {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (payload instanceof Error) {
    return [
      payload.message,
      safeStringify(payload.details),
      safeStringify(payload.response),
      safeStringify(payload.data),
      safeStringify({ ...payload }), // собственные перечислимые поля
    ].join(' ')
  }
  return safeStringify(payload)
}

/**
 * Ответ (или ошибка) означает «объект используется, удалить нельзя».
 * @param {unknown} payload результат мутации либо пойманное исключение
 */
export const isObjectInUseError = (payload) =>
  OBJECT_IN_USE.test(collectErrorText(payload))

export default isObjectInUseError
