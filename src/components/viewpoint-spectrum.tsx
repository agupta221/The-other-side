"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopicTile } from "@/components/topic-tile"
import { Slider } from "@/components/ui/slider"

type ViewpointType = "progressive" | "moderate" | "conservative"

interface Argument {
  summary: string;
  detail: string;
}

interface Viewpoint {
  title: string;
  description: string;
  arguments: Argument[];
  citations?: {
    url?: string;
    title: string;
    snippet?: string;
  }[];
}

interface ViewpointSpectrumProps {
  viewpoints: Record<ViewpointType, Viewpoint>;
  onClose: () => void;
}

const viewpointLabels: Record<ViewpointType, string> = {
  progressive: "Progressive",
  moderate: "Moderate",
  conservative: "Conservative",
}

export function ViewpointSpectrum({ onClose, viewpoints }: ViewpointSpectrumProps) {
  const [selectedViewpoint, setSelectedViewpoint] = useState<ViewpointType>("moderate")

  const handleSliderChange = (value: number[]) => {
    const viewpointMap: ViewpointType[] = ["progressive", "moderate", "conservative"]
    setSelectedViewpoint(viewpointMap[value[0]])
  }

  const getSliderValue = () => {
    const viewpointMap: ViewpointType[] = ["progressive", "moderate", "conservative"]
    return viewpointMap.indexOf(selectedViewpoint)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Explore all sides</h2>
          <span className="text-sm text-neutral-400">
            {viewpointLabels[selectedViewpoint]} Perspective
          </span>
        </div>
        <Slider
          defaultValue={[1]}
          max={2}
          step={1}
          value={[getSliderValue()]}
          onValueChange={handleSliderChange}
          className="py-4"
        />
      </div>

      <AnimatePresence mode="wait">
        <TopicTile
          key={selectedViewpoint}
          topic={viewpoints[selectedViewpoint]}
          selectedViewpoint={selectedViewpoint}
        />
      </AnimatePresence>
    </div>
  )
} 