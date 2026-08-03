/**
 * Simple notification system
 * Shows error notifications to users
 */

import { CircleAlert } from "lucide-react"
import { createElement } from "react"
import { toast } from "sonner"

export function showErrorNotification(message, options = {}) {
  toast.success(message, {
    // Ошибку читают дольше, чем «сохранено»: 1.5 с не хватало, чтобы заметить
    // и прочитать длинный текст (например, почему объект нельзя удалить)
    duration: 5000,
    style: {
      backgroundColor: "#F60808",
      color: "white",
      border: "1px solid #F60808"
    },
    ...options
  })

}

/**
 * Ошибка с заголовком: белая карточка с красной рамкой, иконкой и крестиком.
 * Нужна там, где одной строки мало — когда бэк отказал в действии и надо
 * объяснить правило и что сделать дальше.
 */
export function showErrorAlert(title, description, options = {}) {
  toast.error(title, {
    description,
    // текст в два-три предложения читают дольше обычного уведомления
    duration: 8000,
    closeButton: true,
    icon: createElement(CircleAlert, { size: 18, color: "#F04438" }),
    style: {
      background: "#fff",
      border: "1px solid #FDA29B",
      color: "#101828",
      boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)"
    },
    classNames: {
      title: "font-semibold",
      description: "text-[#475467]"
    },
    ...options
  })
}

export function showSuccessNotification(message, options = {}) {
  toast.success(message, {
    duration: 1500,
    style: {
      backgroundColor: "#01D201",
      color: "white",
      border: "1px solid #01D201"
    },
    ...options
  })

}
