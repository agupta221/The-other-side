export type ViewpointType = "progressive" | "moderate" | "conservative"

export interface Topic {
  title: string
  description: string
  arguments: string[]
}

export interface ViewpointData {
  topics: Topic[]
} 