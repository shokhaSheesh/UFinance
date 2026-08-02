/**
 * Simple notification system
 * Shows error notifications to users
 */

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
