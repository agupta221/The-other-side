"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Newspaper } from "lucide-react"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={`relative flex w-full touch-none select-none items-center ${className}`}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-neutral-200 to-red-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative block h-8 w-8 rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
      <Newspaper className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-600" />
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider } 