import * as React from "react"

/**
 * Рендерит ли переданный элемент настоящий <button>.
 *
 * Обёртки над Base UI поддерживают `asChild` через `render`, и Base UI
 * предупреждает, если `nativeButton` не совпадает с тем, что оказалось в
 * разметке. Для обычного <button> это видно по типу элемента, а для своего
 * компонента — нет, поэтому такие компоненты помечают себя статическим полем
 * `rendersNativeButton` (см. RowActionsTrigger).
 */
export function rendersNativeButton(children: React.ReactNode) {
  if (!React.isValidElement(children)) return false
  const type = children.type
  if (type === "button") return true
  return Boolean((type as { rendersNativeButton?: boolean })?.rendersNativeButton)
}
