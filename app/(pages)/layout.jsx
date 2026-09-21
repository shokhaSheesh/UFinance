import AiChatButton from "@/components/AiChat/AiChatButton"
import AiChatPanel from "@/components/AiChat/AiChatPanel"
import { Header } from "@/components/Header/Header"
import { Sidebar } from "@/components/Sidebar/Sidebar"

const PagesLayout = ({ children }) => {
  return (
    <div className="flex h-screen max-w-full pr-[var(--ai-w,0px)]">
      <Sidebar />
      <div className="flex flex-col flex-1 max-h-screen overflow-hidden">
        <Header />
        <main className={"flex-1 overflow-hidden bg-canvas"}>
          {children}
        </main>
      </div>
      <AiChatButton />
      <AiChatPanel />
    </div>
  )
}

export default PagesLayout
