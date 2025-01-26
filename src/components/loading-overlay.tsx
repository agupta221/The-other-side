"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadingOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const phrases = [
  "See Beyond the Divide",
  "More Than One Truth. More Than One Side.",
  "All Sides of the Story, All in One Place",
  "Find Truth in the Tension",
]

export function LoadingOverlay({ isOpen, onClose }: LoadingOverlayProps) {
  const [binaryMatrix, setBinaryMatrix] = useState<string[][]>([])
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const rows = 10
  const cols = 20

  // Generate random binary numbers
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        const newMatrix = Array(rows)
          .fill(0)
          .map(() =>
            Array(cols)
              .fill(0)
              .map(() => (Math.random() > 0.5 ? "1" : "0")),
          )
        setBinaryMatrix(newMatrix)
      }, 100) // Update every 100ms

      return () => clearInterval(interval)
    }
  }, [isOpen])

  // Cycle through phrases
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
      }, 2000) // Change phrase every 2 seconds

      return () => clearInterval(interval)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <div className="flex flex-col items-center space-y-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-96 h-96 bg-black/60 border-2 border-red-500/40 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-sm"
            >
              {/* Binary Matrix */}
              <div className="absolute inset-0 grid place-items-center">
                <div className="font-mono text-xs tracking-wider leading-relaxed">
                  {binaryMatrix.map((row, i) => (
                    <div key={i} className="flex justify-center">
                      {row.map((digit, j) => (
                        <motion.span
                          key={`${i}-${j}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: digit === "1" ? 0.4 : 0.2 }}
                          transition={{ duration: 0.2 }}
                          className="w-4 text-center text-red-500/80"
                        >
                          {digit}
                        </motion.span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Cycling Phrases */}
            <div className="relative h-20 w-[600px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhraseIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center space-y-4">
                    <motion.div
                      animate={{
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="text-2xl font-light tracking-[0.2em] text-white"
                    >
                      {phrases[currentPhraseIndex]}
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 