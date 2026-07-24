import AiChatPanel from "@/components/AiChat/AiChatPanel"
import { Header } from "@/components/Header/Header"
import { Sidebar } from "@/components/Sidebar/Sidebar"

const PagesLayout = ({ children }) => {
  return (
    <div className="flex h-screen max-w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 max-h-screen overflow-hidden">
        <Header />
        <main className={"flex-1 overflow-hidden bg-white"}>
          {children}
        </main>
      </div>
      <AiChatPanel />
    </div>
  )
}

export default PagesLayout