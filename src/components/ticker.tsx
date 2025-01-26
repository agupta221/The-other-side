"use client"

import { motion } from "framer-motion"

const tickerItems = [
  "Immigration",
  "Abortion",
  "Economy",
  "Global conflicts",
  "Debt ceiling",
  "National security",
  "Monetary policy",
  "Defence spending",
  "DEI",
  "Racial inequality",
  "Climate change",
  "Gun control",
  "Healthcare",
  "Education",
]

export function Ticker() {
  return (
    <div className="relative w-full overflow-hidden border-t border-neutral-800 bg-black/50 backdrop-blur-sm">
      <motion.div
        animate={{
          x: [0, -2000],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="flex whitespace-nowrap py-3"
      >
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <div
            key={i}
            className="mx-8 text-sm font-medium text-neutral-400"
          >
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  )
} 