"use client"

import * as React from "react"

// Shared global counter across Dialog and AlertDialog.
// Each dialog that opens gets a unique layer number so
// overlay and content z-indexes never collide.
let globalLayer = 0

export const DialogLayerContext = React.createContext(0)

export function useDialogLayer(open?: boolean) {
  const [layer, setLayer] = React.useState(0)

  React.useEffect(() => {
    if (open) {
      globalLayer++
      setLayer(globalLayer)
      return () => {
        globalLayer = Math.max(0, globalLayer - 1)
      }
    }
  }, [open])

  return layer
}

export function getOverlayZIndex(layer: number) {
  return 50 + Math.max(0, layer - 1) * 10
}

export function getContentZIndex(layer: number) {
  return 50 + Math.max(0, layer - 1) * 10 + 1
}
