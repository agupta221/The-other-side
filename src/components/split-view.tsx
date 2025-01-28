"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { AuthorInfo } from "@/components/author-info"

interface SplitViewProps {
  title: string
  content: string
  onClose: () => void
  rightPanel?: React.ReactNode
  authorInfo?: {
    name: string
    background: string
    potentialBiases: string[]
    recentArticles: {
      title: string
      url: string
      date?: string
    }[]
    citations: {
      url: string
      title: string
    }[]
  }
}

export function SplitView({ title, content, onClose, rightPanel, authorInfo }: SplitViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [splitPosition, setSplitPosition] = useState(50) // percentage

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const container = document.getElementById('split-container')
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Limit the split position between 30% and 70%
    setSplitPosition(Math.min(Math.max(newPosition, 30), 70))
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <motion.div 
        id="split-container"
        className="relative w-full max-w-[90vw] h-[85vh] flex rounded-lg bg-black/50 backdrop-blur-sm border border-neutral-800 shadow-xl overflow-hidden"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        {/* Close Button */}
        <Button
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-500 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Left Panel - Article Content */}
        <div 
          className="h-full overflow-y-auto p-6"
          style={{ width: `${splitPosition}%` }}
        >
          <div className="space-y-6 pr-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              {title}
            </h1>
            {authorInfo && <AuthorInfo authorInfo={authorInfo} />}
            <div className="prose prose-invert prose-lg max-w-none [&>p]:mb-6 [&>h1]:mt-8 [&>h2]:mt-6 [&>h3]:mt-4">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Resizer with Handle */}
        <div className="relative w-1 h-full bg-neutral-800 hover:bg-red-500 transition-colors group">
          {/* Drag Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-6 h-12 flex items-center justify-center bg-neutral-800 group-hover:bg-red-500 rounded-full cursor-col-resize transition-colors"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          {/* Invisible wider hit area for better usability */}
          <div
            className="absolute inset-0 w-6 -translate-x-1/2 left-1/2 cursor-col-resize"
            onMouseDown={handleMouseDown}
          />
        </div>

        {/* Right Panel */}
        <div 
          className="h-full overflow-y-auto p-6 pt-16"
          style={{ width: `${100 - splitPosition}%` }}
        >
          {rightPanel || (
            <div className="h-full flex items-center justify-center text-neutral-400">
              Additional content will appear here
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
} 