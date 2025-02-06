"use client"

import { useState, useCallback } from "react"
import { Search, Mail, Settings, User, Send, X, Link, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ViewpointSpectrum } from "@/components/viewpoint-spectrum"
import { Ticker } from "@/components/ticker"
import { LoadingOverlay } from "@/components/loading-overlay"
import { AnimatedTitle } from "@/components/animated-title"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ArticleView } from "@/components/article-view"
import { SplitView } from "@/components/split-view"

interface ArticleData {
  title: string
  content: string
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

export default function ChatInterface() {
  const [showSpectrum, setShowSpectrum] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [newsUrl, setNewsUrl] = useState("")
  const [perspectives, setPerspectives] = useState(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"search" | "news">("search")
  const [articleData, setArticleData] = useState<ArticleData | null>(null)

  const handleSendClick = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setArticleData(null)
    setShowSpectrum(false)
    setPerspectives(null)

    try {
      if (mode === "news") {
        if (!newsUrl) {
          throw new Error("Please enter a news article URL")
        }

        // First scrape the article
        let scrapeResponse
        try {
          scrapeResponse = await fetch("/api/scrape", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: newsUrl }),
          })

          if (!scrapeResponse.ok) {
            const error = await scrapeResponse.json()
            throw new Error(error.error || "Failed to scrape article")
          }
        } catch (error) {
          console.error("Error scraping article:", error)
          throw new Error("Failed to fetch article. Please check the URL and try again.")
        }

        const articleData = await scrapeResponse.json()

        // Run article formatting, analysis, and author info in parallel
        try {
          const [formattedArticle, analysisResponse] = await Promise.all([
            // Format article with OpenAI
            fetch("/api/format", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ content: articleData.content }),
            }).then(async res => {
              if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Failed to format article")
              }
              return res.json()
            }),

            // Analyze article with Perplexity
            fetch("/api/perspectives", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                mode: "news",
                articleContent: articleData.content 
              }),
            }).then(res => {
              if (!res.ok) throw new Error("Failed to analyze article")
              return res.json()
            })
          ])

          // Try to get author information, but don't fail if it errors
          let authorInfo = null
          try {
            const authorResponse = await fetch("/api/author", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                articleContent: articleData.content 
              }),
            })
            if (authorResponse.ok) {
              const authorData = await authorResponse.json()
              authorInfo = authorData.authorInfo
            }
          } catch (error) {
            console.error("Error getting author information:", error)
            // Don't throw the error, just continue without author info
          }

          // Update state with all results
          setArticleData({
            title: articleData.title,
            content: formattedArticle.content,
            authorInfo: authorInfo
          })
          setPerspectives(analysisResponse.perspectives)
          setShowSpectrum(true)

        } catch (error) {
          console.error("Error processing article:", error)
          throw new Error("Failed to process article. Please try again.")
        }

      } else {
        // Regular search mode
        if (!query.trim()) {
          throw new Error("Please enter a search query")
        }

        try {
          const response = await fetch("/api/perspectives", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              mode: "search",
              query: query.trim() 
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to get perspectives")
          }

          const data = await response.json()
          setPerspectives(data.perspectives)
          setShowSpectrum(true)
          setIsMinimized(true)
        } catch (error) {
          console.error("Error getting perspectives:", error)
          throw new Error("Failed to get perspectives. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error in handleSendClick:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [mode, newsUrl, query])

  const handleReset = () => {
    setIsMinimized(false)
    setShowSpectrum(false)
    setPerspectives(null)
    setQuery("")
    setNewsUrl("")
    setArticleData(null)
  }

  const handlePromptClick = (prompt: string) => {
    setMode("search")
    setQuery(prompt)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-neutral-950 dark">
      {/* Animated Title */}
      <AnimatedTitle />

      {/* Loading Overlay */}
      <LoadingOverlay isOpen={isLoading} onClose={() => setIsLoading(false)} />

      {/* Article/Split View */}
      <AnimatePresence>
        {articleData && (
          mode === "news" ? (
            <SplitView
              title={articleData.title}
              content={articleData.content}
              authorInfo={articleData.authorInfo}
              onClose={() => setArticleData(null)}
              rightPanel={
                perspectives && (
                  <ViewpointSpectrum 
                    viewpoints={perspectives}
                    onClose={() => setShowSpectrum(false)}
                  />
                )
              }
            />
          ) : (
            <ArticleView
              title={articleData.title}
              content={articleData.content}
              onClose={() => setArticleData(null)}
            />
          )
        )}
      </AnimatePresence>

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
                  {mode === "search" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <Card 
                        className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                        onClick={() => setNewsUrl("https://apnews.com/article/justice-department-special-counsel-trump-046ce32dbad712e72e500c32ecc20f2f")}
                      >
                        <div className="p-4 flex items-start space-x-3">
                          <Link className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                          <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                          Trump Justice Department says it has fired employees involved in prosecutions of the president
                          </p>
                        </div>
                      </Card>
                      <Card 
                        className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                        onClick={() => setNewsUrl("https://apnews.com/article/deepseek-ai-china-f4908eaca221d601e31e7e3368778030")}
                      >
                        <div className="p-4 flex items-start space-x-3">
                          <Link className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                          <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                          What is DeepSeek, the Chinese AI company upending the stock market?
                          </p>
                        </div>
                      </Card>
                      <Card 
                        className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                        onClick={() => setNewsUrl("https://apnews.com/article/colombia-immigration-deportation-flights-petro-trump-us-67870e41556c5d8791d22ec6767049fd")}
                      >
                        <div className="p-4 flex items-start space-x-3">
                          <Link className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                          <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                          White House says Colombia agrees to take deported migrants after Trump tariff showdown
                          </p>
                        </div>
                      </Card>
                      <Card 
                        className="group bg-black/50 border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:border-red-500/50"
                        onClick={() => setNewsUrl("https://apnews.com/article/south-korea-yoon-martial-law-rebellion-indictment-0474602c89f04f003e012f333c5d5e0d")}
                      >
                        <div className="p-4 flex items-start space-x-3">
                          <Link className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                          <p className="text-sm text-neutral-300 group-hover:text-neutral-200">
                          What to expect after South Korea's impeached president was indicted on rebellion charges
                          </p>
                        </div>
                      </Card>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Toggle and Input Area */}
          <motion.div
            layout
            className="space-y-4"
            animate={{
              marginTop: isMinimized ? "2rem" : undefined,
            }}
          >
            {/* Mode Toggle */}
            <div className="flex items-center mb-4">
              <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as "search" | "news")}>
                <ToggleGroupItem value="search">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Search
                </ToggleGroupItem>
                <ToggleGroupItem value="news">
                  <Link className="h-4 w-4 mr-2" />
                  Investigate the news
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Input Area */}
            <div className="relative">
              {mode === "search" ? (
                <Textarea
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
                  placeholder="Uncover all sides of the story..."
                  className="min-h-[100px] resize-none pr-24 bg-black/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-red-500 hover:border-neutral-700 transition-colors"
                />
              ) : (
                <Input
                  type="url"
                  value={newsUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewsUrl(e.target.value)}
                  placeholder="Paste a news article URL to analyze..."
                  className="h-[60px] pr-24 bg-black/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-red-500 hover:border-neutral-700 transition-colors"
                />
              )}
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
            {showSpectrum && perspectives && mode === "search" && (
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