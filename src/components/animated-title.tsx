"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function AnimatedTitle() {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const [bits, setBits] = useState<string[]>(Array(60).fill('0'))
  const title = "The Other Side"

  useEffect(() => {
    // Generate initial random bits
    setBits(Array(60).fill(0).map(() => Math.random() > 0.5 ? "1" : "0"))

    // Set up interval to update bits
    const bitsInterval = setInterval(() => {
      setBits(prev => prev.map(() => Math.random() > 0.5 ? "1" : "0"))
    }, 100)

    // Set up timer for completion
    const timer = setTimeout(() => {
      clearInterval(bitsInterval)
      setIsAnimationComplete(true)
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearInterval(bitsInterval)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 z-50">
      <div className="relative h-[64px]">
        <AnimatePresence>
          {!isAnimationComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="absolute top-0 left-0 m-6 p-3 bg-black/20 backdrop-blur-sm border border-red-500/20 rounded-lg overflow-hidden"
            >
              <div className="flex flex-wrap w-[160px] gap-[2px]">
                {bits.map((bit, index) => (
                  <motion.span
                    key={index}
                    animate={{
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                      delay: (index % 10) * 0.05,
                    }}
                    className="font-mono text-[10px] font-thin text-red-500/80 w-[14px] text-center"
                  >
                    {bit}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isAnimationComplete ? 1 : 0,
          }}
          transition={{ 
            duration: 1,
            ease: "easeOut",
          }}
          className="absolute top-5 left-8 text-2xl font-extralight tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600"
        >
          {title}
        </motion.h1>
      </div>
    </div>
  )
} 