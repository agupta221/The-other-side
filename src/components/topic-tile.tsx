"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, ChevronDown } from "lucide-react"
import { useState } from "react"
import type { ViewpointType } from "@/types/viewpoints"

interface Argument {
  summary: string
  detail: string
}

interface TopicTileProps {
  topic: {
    title: string
    description: string
    arguments: Argument[]
    citations?: {
      url?: string
      title: string
      snippet?: string
    }[]
  }
  selectedViewpoint: ViewpointType
}

export function TopicTile({ topic, selectedViewpoint }: TopicTileProps) {
  const [expandedArguments, setExpandedArguments] = useState<number[]>([])

  const viewpointStyles = {
    progressive: "border-blue-500/40 bg-blue-950/20",
    moderate: "border-neutral-500/40 bg-neutral-950/20",
    conservative: "border-red-500/40 bg-red-950/20",
  }

  const titleStyles = {
    progressive: "text-blue-400",
    moderate: "text-neutral-400",
    conservative: "text-red-400",
  }

  const pillStyles = {
    progressive: "bg-blue-950/50 border-blue-500/20 hover:border-blue-500/40",
    moderate: "bg-neutral-950/50 border-neutral-500/20 hover:border-neutral-500/40",
    conservative: "bg-red-950/50 border-red-500/20 hover:border-red-500/40",
  }

  // Function to get citation index from argument text
  const getCitationIndex = (text: string): number | null => {
    const match = text.match(/\[(\d+)\]$/)
    return match ? parseInt(match[1]) - 1 : null
  }

  const toggleArgument = (index: number) => {
    setExpandedArguments(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`space-y-4 rounded-lg border ${viewpointStyles[selectedViewpoint]} p-6`}
    >
      <div className="space-y-2">
        <h3 className={`text-lg font-medium ${titleStyles[selectedViewpoint]}`}>
          {topic.title}
        </h3>
        <p className="text-sm text-neutral-400">{topic.description}</p>
      </div>

      <div className="space-y-3">
        {topic.arguments.map((argument, index) => {
          const citationIndex = getCitationIndex(argument.detail)
          const citation = citationIndex !== null && topic.citations ? topic.citations[citationIndex] : null
          const isExpanded = expandedArguments.includes(index)

          return (
            <motion.div
              key={index}
              className="overflow-hidden"
              initial={false}
            >
              <button
                onClick={() => toggleArgument(index)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isExpanded 
                    ? `${pillStyles[selectedViewpoint]} border`
                    : 'hover:bg-white/5'
                }`}
              >
                <span className="text-base font-medium text-neutral-200 text-left">
                  {argument.summary}
                </span>
                <ChevronDown 
                  className={`h-4 w-4 text-neutral-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 space-y-3">
                      <p className="text-sm leading-relaxed text-neutral-300">
                        {argument.detail.replace(/\[\d+\]$/, "").trim()}
                      </p>
                      {citation && citation.url && (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-400 transition-colors ${pillStyles[selectedViewpoint]}`}
                        >
                          <span className="truncate max-w-[300px]">
                            {citation.title || citation.url}
                          </span>
                          <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {topic.citations && topic.citations.length > 0 && (
        <div className="mt-4 border-t border-neutral-800 pt-4">
          <h4 className="text-sm font-medium text-neutral-400 mb-3">All Sources</h4>
          <div className="flex flex-wrap gap-2">
            {topic.citations.map((citation, index) => (
              citation.url && (
                <a
                  key={index}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-neutral-300 transition-colors ${pillStyles[selectedViewpoint]}`}
                >
                  <span className="truncate max-w-[200px]">
                    [{index + 1}] {citation.title || citation.url}
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
} 