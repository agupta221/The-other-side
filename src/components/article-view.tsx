"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"

interface ArticleViewProps {
  title: string
  content: string
  onClose: () => void
}

export function ArticleView({ title, content, onClose }: ArticleViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <motion.div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-black/50 backdrop-blur-sm border border-neutral-800 p-6 shadow-xl"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        {/* Close Button */}
        <Button
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Article Content */}
        <div className="space-y-4 pr-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            {title}
          </h1>
          <div className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 