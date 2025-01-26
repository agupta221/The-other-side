"use client"

import { useState, useCallback } from "react"
import { Search, Mail, Settings, User, Send, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ViewpointSpectrum } from "@/components/viewpoint-spectrum"
import { Ticker } from "@/components/ticker"
import { LoadingOverlay } from "@/components/loading-overlay"
import { AnimatedTitle } from "@/components/animated-title"

export default function ChatInterface() {
  const [showSpectrum, setShowSpectrum] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [perspectives, setPerspectives] = useState(null)
  const [error, setError] = useState<string | null>(null)

  const handleSendClick = useCallback(async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/perspectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch perspectives")
      }

      const data = await response.json()
      setPerspectives(data.perspectives)
      setIsMinimized(true)
      setShowSpectrum(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [query])

  const handleReset = () => {
    setIsMinimized(false)
    setShowSpectrum(false)
    setPerspectives(null)
    setQuery("")
  }

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-neutral-950 dark">
      {/* Animated Title */}
      <AnimatedTitle />

      {/* Loading Overlay */}
      <LoadingOverlay isOpen={isLoading} onClose={() => setIsLoading(false)} />

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-16 w-full flex flex-col justify-center" style={{ marginTop: "-64px" }}>
        <div className="relative space-y-8">
          {/* Close Button - Only shown in minimized mode */}
          <AnimatePresence>
            {isMinimized && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-8 right-6 z-50"
              >
                <Button
                  size="lg"
                  onClick={handleReset}
                  className="rounded-full bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content that can be hidden */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-8"
              >
                {/* Greeting */}
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold text-white">
                    Hi there!
                    <span className="bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent"></span>
                  </h1>
                  <h2 className="text-4xl font-semibold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                    What truth are you searching for?
                  </h2>
                </div>

                {/* Prompt Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                    onClick={() => handlePromptClick("What are the different perspectives on immigration policy and border security?")}
                  >
                    <div className="p-4 flex items-start space-x-3">
                      <User className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                      <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                        Borders divide, but perspectives collide—explore the immigration debate from all sides
                      </p>
                    </div>
                  </Card>
                  <Card 
                    className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                    onClick={() => handlePromptClick("What are the different perspectives on abortion rights and restrictions?")}
                  >
                    <div className="p-4 flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                      <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                        A question of choice, life, and rights—see where the lines are drawn
                      </p>
                    </div>
                  </Card>
                  <Card 
                    className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                    onClick={() => handlePromptClick("What are the different perspectives on the Israeli-Palestinian conflict?")}
                  >
                    <div className="p-4 flex items-start space-x-3">
                      <Search className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                      <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                        Conflict and compromise in the Middle East—unravel the truths on every side
                      </p>
                    </div>
                  </Card>
                  <Card 
                    className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                    onClick={() => handlePromptClick("What are the different perspectives on cryptocurrency regulation and adoption?")}
                  >
                    <div className="p-4 flex items-start space-x-3">
                      <Settings className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                      <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                        Fortune, fraud, or freedom? Trace the blockchain of differing opinions
                      </p>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area - Always visible */}
          <motion.div
            layout
            className="space-y-4"
            animate={{
              marginTop: isMinimized ? "2rem" : undefined,
            }}
          >
            <div className="relative">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Uncover all sides of the story..."
                className="min-h-[100px] resize-none pr-24 bg-black/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-red-500 hover:border-neutral-700 transition-colors"
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <Button
                  size="icon"
                  className="bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                  onClick={handleSendClick}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-red-400">
                {error}
              </div>
            )}

            {/* Viewpoint Spectrum */}
            {showSpectrum && perspectives && (
              <ViewpointSpectrum 
                onClose={() => setShowSpectrum(false)} 
                viewpoints={perspectives}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Ticker */}
      <Ticker />
    </div>
  )
} 