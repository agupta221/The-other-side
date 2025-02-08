"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, ExternalLink, ChevronRight, Loader2, ChevronDown, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import DOMPurify from 'isomorphic-dompurify'

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: {
    title: string
    url: string
  }[]
}

interface ArticleChatProps {
  articleContent: string
  articleTitle: string
}

// Helper function to sanitize and format HTML
const formatMessageContent = (content: string) => {
  // Sanitize the HTML to prevent XSS
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'ul', 'ol', 'li', 'strong', 'blockquote', 'br'],
    ALLOWED_ATTR: []
  })
  return sanitizedHtml
}

export function ArticleChat({ articleContent, articleTitle }: ArticleChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentResponse, setCurrentResponse] = useState("")
  const [followUpQueries, setFollowUpQueries] = useState<string[]>([])
  const [isResponseComplete, setIsResponseComplete] = useState(false)
  const [isStreamStarted, setIsStreamStarted] = useState(false)
  const [isFollowUpsExpanded, setIsFollowUpsExpanded] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)

  // Check if we need to show scroll indicator
  const checkScrollIndicator = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current
      const isScrollable = scrollHeight > clientHeight
      const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10
      setShowScrollIndicator(isScrollable && !isScrolledToBottom)
    }
  }

  // Only scroll to bottom when explicitly called
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowScrollIndicator(false)
  }

  // Add scroll event listener
  useEffect(() => {
    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollIndicator)
      return () => container.removeEventListener('scroll', checkScrollIndicator)
    }
  }, [])

  // Check scroll indicator when content changes
  useEffect(() => {
    checkScrollIndicator()
  }, [currentResponse])

  // Only auto-scroll on new messages or when streaming is complete
  useEffect(() => {
    if (messages.length > 0 && !currentResponse) {
      scrollToBottom()
    }
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setCurrentResponse("")
    setFollowUpQueries([])
    setIsResponseComplete(false)
    setIsStreamStarted(false)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          articleContent,
          articleTitle
        })
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No reader available")

      let accumulatedResponse = ""
      let storedFollowUps: string[] = []

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === "follow_up_queries") {
                  storedFollowUps = data.content
                } else if (data.type === "answer" && data.content) {
                  if (!isStreamStarted) setIsStreamStarted(true)
                  accumulatedResponse += data.content
                  setCurrentResponse(accumulatedResponse)
                }
              } catch (e) {
                console.error("Error parsing chunk:", e)
              }
            }
          }
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: accumulatedResponse,
          sources: []
        }

        setMessages(prev => [...prev, assistantMessage])
        setCurrentResponse("")
        setFollowUpQueries(storedFollowUps)
        setIsResponseComplete(true)

      } finally {
        reader.releaseLock()
      }

    } catch (error) {
      console.error("Error in chat:", error)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I encountered an error while processing your request. Please try again."
      }])
    } finally {
      setIsLoading(false)
      setIsStreamStarted(false)
    }
  }

  const handleFollowUpClick = (query: string) => {
    setInput(query)
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-6 p-4 relative"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} ${index > 0 ? "mt-3" : ""}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center mr-2 mt-2">
                  <span className="text-red-400 text-sm font-semibold">AI</span>
                </div>
              )}
              <div
                className={`relative max-w-[80%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-red-600 text-white ml-4"
                    : "bg-neutral-800 text-neutral-200"
                }`}
              >
                <div 
                  className={`absolute top-4 ${
                    message.role === "user" ? "-right-2" : "-left-2"
                  } w-4 h-4 transform rotate-45 ${
                    message.role === "user" ? "bg-red-600" : "bg-neutral-800"
                  }`} 
                />
                <div 
                  className="relative prose prose-sm prose-invert max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mt-2 [&>ol]:mt-2 [&>ul>li]:mt-2 [&>ol>li]:mt-2 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:pl-4 [&>ol]:pl-4 [&>blockquote]:pl-4 [&>blockquote]:border-l-2 [&>blockquote]:border-neutral-600 [&>blockquote]:italic [&>blockquote]:my-4"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessageContent(message.content)
                  }}
                />
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 relative">
                    {message.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        <span className="truncate max-w-[150px]">
                          {source.title}
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center ml-2 mt-2">
                  <span className="text-white text-sm font-semibold">You</span>
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && !isStreamStarted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start mt-3"
            >
              <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center mr-2 mt-2">
                <span className="text-red-400 text-sm font-semibold">AI</span>
              </div>
              <div className="relative flex items-center gap-2 rounded-2xl py-2 px-4 bg-neutral-800 text-neutral-200">
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                <span className="text-sm">Uncovering the truth...</span>
              </div>
            </motion.div>
          )}
          {currentResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mt-3"
            >
              <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center mr-2 mt-2">
                <span className="text-red-400 text-sm font-semibold">AI</span>
              </div>
              <div className="relative max-w-[80%] rounded-2xl p-4 bg-neutral-800 text-neutral-200">
                <div className="absolute top-4 -left-2 w-4 h-4 transform rotate-45 bg-neutral-800" />
                <div 
                  className="relative prose prose-sm prose-invert max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mt-2 [&>ol]:mt-2 [&>ul>li]:mt-2 [&>ol>li]:mt-2 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:pl-4 [&>ol]:pl-4 [&>blockquote]:pl-4 [&>blockquote]:border-l-2 [&>blockquote]:border-neutral-600 [&>blockquote]:italic [&>blockquote]:my-4"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessageContent(currentResponse)
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />

        {/* Scroll Indicator */}
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="fixed top-80 right-8 bg-red-600 hover:bg-red-500 transition-colors rounded-full p-3 shadow-lg shadow-red-500/20 z-50"
            >
              <ArrowDown className="h-5 w-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Follow-up Queries */}
      {followUpQueries.length > 0 && isResponseComplete && !currentResponse && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 mx-4"
        >
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl">
            <button
              onClick={() => setIsFollowUpsExpanded(!isFollowUpsExpanded)}
              className="w-full p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-red-500 rounded-full" />
                <h3 className="text-sm font-medium text-neutral-200">Continue down the rabbit hole</h3>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                  isFollowUpsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence>
              {isFollowUpsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-2">
                    {followUpQueries.map((query, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-left bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl group transition-all duration-200"
                        onClick={() => handleFollowUpClick(query)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-red-600/20 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                            <ChevronRight className="h-4 w-4 text-red-400 group-hover:text-red-300" />
                          </div>
                          <span className="line-clamp-2">{query}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="relative px-4 pb-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Ask a question about the article..."
          className="min-h-[100px] resize-none pr-24 bg-black/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-red-500 hover:border-neutral-700 transition-colors rounded-2xl"
          disabled={isLoading}
        />
        <div className="absolute bottom-7 right-7">
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 
