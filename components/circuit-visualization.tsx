"use client"

import { useEffect, useRef } from "react"

interface SketchfabClient {
  init: (uid: string, options: { success: (api: { start: () => void }) => void; error: () => void }) => void;
}

declare global {
  interface Window {
    Sketchfab: new (element: HTMLElement) => SketchfabClient;
  }
}

export function CircuitVisualization() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const client = new window.Sketchfab(containerRef.current)
    
    client.init('5e73b74c166849958398c4cfef9321d4', {
      success: function onSuccess(api) {
        api.start()
      },
      error: function onError() {
        console.error('Sketchfab API error')
      }
    })
  }, [])

  return (
    <div className="relative w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden border border-purple-500/20">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
} 