

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white">
      {/* bg-linear-to-t from-[#456fad] to-[#022565] */}
      {/* <div className="animate-pulse">
        <AuthLogo color="#0F0F10" width="180" height="44" />
      </div> */}
      <div className="mt-8 flex items-center gap-2">
        <span className="h-4 w-4 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-4 w-4 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-4 w-4 rounded-full bg-primary/80 animate-bounce" />
      </div>
    </div>
  )
}

export default LoadingScreen
