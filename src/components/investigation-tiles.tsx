"use client"

import { motion } from "framer-motion"
import { Compass, Users, User, HelpCircle } from "lucide-react"

interface InvestigationTilesProps {
  onTileClick: (action: string) => void
}

export function InvestigationTiles({ onTileClick }: InvestigationTilesProps) {
  const tiles = [
    {
      title: "Explore all sides",
      icon: Compass,
      action: "explore"
    },
    {
      title: "Who's involved?",
      icon: Users,
      action: "involved"
    },
    {
      title: "Learn about the author",
      icon: User,
      action: "author"
    },
    {
      title: "Ask me questions",
      icon: HelpCircle,
      action: "questions"
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {tiles.map((tile) => (
        <motion.button
          key={tile.action}
          onClick={() => onTileClick(tile.action)}
          className="aspect-square flex flex-col items-center justify-center p-6 rounded-lg bg-black/50 border border-neutral-800 hover:border-red-500/50 hover:bg-neutral-900/50 transition-all duration-300 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <tile.icon className="w-8 h-8 mb-3 text-red-400 group-hover:text-red-300 transition-colors" />
          <span className="text-sm text-neutral-300 group-hover:text-neutral-200 text-center transition-colors">
            {tile.title}
          </span>
        </motion.button>
      ))}
    </div>
  )
} 