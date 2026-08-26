import MiniAppProvider from "@/components/attendance/MiniAppProvider"
import "./attendance.scss"

export const metadata = {
  title: "Перекличка · детский сад",
  description: "Мини-приложение для переклички в детском саду",
}

// Раздел живёт отдельно от основного кабинета: без сайдбара, без логина —
// его открывает телеграм-бот как webview
export default function AttendanceLayout({ children }) {
  return <MiniAppProvider>{children}</MiniAppProvider>
}
