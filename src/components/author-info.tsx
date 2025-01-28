"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthorInfo {
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

interface AuthorInfoProps {
  authorInfo: AuthorInfo
}

export function AuthorInfo({ authorInfo }: AuthorInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-4 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 hover:border-red-700/50 rounded-lg text-neutral-200 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium">About the Author</span>
        <ChevronDown
          className={`h-4 w-4 text-red-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 mt-2 bg-black/20 border border-neutral-800 rounded-lg space-y-4">
              {/* Author Name */}
              <h3 className="text-lg font-semibold text-neutral-200">{authorInfo.name}</h3>

              {/* Background */}
              <p className="text-neutral-300">{authorInfo.background}</p>

              {/* Potential Biases */}
              {authorInfo.potentialBiases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">Potential Biases</h4>
                  <ul className="list-disc list-inside text-neutral-300 space-y-1">
                    {authorInfo.potentialBiases.map((bias, index) => (
                      <li key={index}>{bias}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Articles */}
              {authorInfo.recentArticles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">Recent Articles</h4>
                  <div className="flex flex-wrap gap-2">
                    {authorInfo.recentArticles.map((article, index) => (
                      <a
                        key={index}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 hover:border-red-700/50 rounded-full text-sm text-neutral-300 transition-colors"
                      >
                        {article.title}
                        <ExternalLink className="h-3 w-3 text-red-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {authorInfo.citations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {authorInfo.citations.map((citation, index) => (
                      <a
                        key={index}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 hover:border-red-700/50 rounded-full text-sm text-neutral-300 transition-colors"
                      >
                        {citation.title}
                        <ExternalLink className="h-3 w-3 text-red-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 