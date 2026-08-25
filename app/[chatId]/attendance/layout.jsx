import MiniAppProvider from "@/components/kindergarten/MiniAppProvider"
import "./attendance.scss"

export const metadata = {
  title: "Перекличка · детский сад",
  description: "Мини-приложение для переклички в детском саду",
}

// Раздел живёт отдельно от основного кабинета: без сайдбара, без логина —
// его открывает телеграм-бот как webview
export default function KindergartenLayout({ children }) {
  return <MiniAppProvider>{children}</MiniAppProvider>
}
