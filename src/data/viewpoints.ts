import type { ViewpointType, ViewpointData } from "@/types/viewpoints"

export const viewpointsData: Record<ViewpointType, ViewpointData> = {
  progressive: {
    topics: [
      {
        title: "Social Programs",
        description: "Government's role in providing social services",
        arguments: [
          "Universal healthcare is a fundamental human right",
          "Expanded social safety net reduces inequality",
          "Public education should be free through college",
        ],
      },
      {
        title: "Climate Change",
        description: "Environmental policy and regulations",
        arguments: [
          "Immediate action required through strict regulations",
          "Green New Deal to transform economy",
          "Carbon tax to reduce emissions",
        ],
      },
    ],
  },
  moderate: {
    topics: [
      {
        title: "Social Programs",
        description: "Government's role in providing social services",
        arguments: [
          "Mixed public-private healthcare system",
          "Targeted social programs with means testing",
          "Affordable education through reforms",
        ],
      },
      {
        title: "Climate Change",
        description: "Environmental policy and regulations",
        arguments: [
          "Market-based solutions with government oversight",
          "Gradual transition to renewable energy",
          "Balance environmental and economic concerns",
        ],
      },
    ],
  },
  conservative: {
    topics: [
      {
        title: "Social Programs",
        description: "Government's role in providing social services",
        arguments: [
          "Free market healthcare solutions",
          "Limited government involvement",
          "Private sector education options",
        ],
      },
      {
        title: "Climate Change",
        description: "Environmental policy and regulations",
        arguments: [
          "Focus on innovation and technology",
          "Voluntary industry initiatives",
          "Protect energy independence",
        ],
      },
    ],
  },
} 