import { NextResponse } from "next/server"

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

interface PerplexityResponse {
  choices: [{
    message: {
      content: string
    }
  }]
}

type ViewpointType = "progressive" | "moderate" | "conservative"

interface Viewpoint {
  summary: string
  arguments: {
    summary: string
    detail: string
  }[]
  citations?: {
    title: string
    url: string
    snippet?: string
  }[]
}

async function getViewpoint(prompt: string, perspective: ViewpointType): Promise<Viewpoint> {
  try {
    const systemMessage = `You are an expert at analyzing topics from a ${perspective} perspective. 
    Your task is to provide a balanced and factual analysis from this viewpoint. Focus on really understanding the root cause of the topic and provide a detailed analysis.
    
    Format your response in exactly this JSON structure:
    {
      "summary": "A concise overview of the ${perspective} perspective",
      "arguments": [
        {
          "summary": "First main point",
          "detail": "Detailed explanation of the first point"
        },
        {
          "summary": "Second main point",
          "detail": "Detailed explanation of the second point"
        }
      ],
      "citations": [
        {
          "title": "Source Title",
          "url": "https://source-url.com",
          "snippet": "Optional relevant quote or context from the source"
        }
      ]
    }
    
    Guidelines:
    1. Be objective and factual
    2. Avoid extreme or inflammatory language
    3. Focus on mainstream ${perspective} viewpoints
    4. Support arguments with reasoning
    5. Keep the summary under 100 words
    6. Provide atleast 3-4 main arguments but where appropriate provide more
    7. The arguments you provide should be extremely detailed, nuanced and thoughtful 
    8. For each detailed argument, provide verifiable examples, data, quotes, etc. 
    9. Include relevant sources with proper citations
    10. IMPORTANT: Ensure your response is valid JSON
    11. For each argument, try to provide at least one credible source
    12. Sources should be real and verifiable`

    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      // Clean the response to ensure it's valid JSON
      const cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim()
      const parsedContent = JSON.parse(cleanedContent)

      // Validate the structure
      if (!parsedContent.summary || !Array.isArray(parsedContent.arguments)) {
        throw new Error("Response missing required fields")
      }

      // Ensure citations is always an array
      if (!Array.isArray(parsedContent.citations)) {
        parsedContent.citations = []
      }

      // Filter out invalid citations
      parsedContent.citations = parsedContent.citations.filter(
        (citation: any) => citation && citation.title && citation.url
      )

      return parsedContent
    } catch (error) {
      console.error('Error parsing JSON response:', error)
      console.error('Content that failed to parse:', content)
      
      // Attempt to extract information from non-JSON response
      const fallbackResponse: Viewpoint = {
        summary: "Unable to parse perspective",
        arguments: [
          {
            summary: "Error Processing Response",
            detail: "The system encountered an error while processing this perspective. Please try again."
          }
        ],
        citations: []
      }

      return fallbackResponse
    }
  } catch (error: unknown) {
    console.error("Error in getViewpoint:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to get viewpoint")
  }
}

export async function POST(req: Request) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "Perplexity API key not configured" },
      { status: 500 }
    )
  }

  try {
    const { query, mode, articleContent } = await req.json()

    if (mode === "news" && !articleContent) {
      return NextResponse.json(
        { error: "Article content is required for news analysis" },
        { status: 400 }
      )
    }

    if (mode === "search" && !query) {
      return NextResponse.json(
        { error: "Query is required for search" },
        { status: 400 }
      )
    }

    // For news mode, analyze the article content
    const prompt = mode === "news" 
      ? `Analyze this article and provide different perspectives on the topic. Focus on identifying and explaining various viewpoints, potential biases, and alternative interpretations. Here's the article content:\n\n${articleContent}`
      : query

    try {
      // Get all perspectives in parallel
      const [progressive, moderate, conservative] = await Promise.all([
        getViewpoint(prompt, "progressive"),
        getViewpoint(prompt, "moderate"),
        getViewpoint(prompt, "conservative")
      ])

      return NextResponse.json({
        perspectives: {
          progressive,
          moderate,
          conservative
        }
      })
    } catch (error: unknown) {
      console.error("Error getting perspectives:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to get perspectives" },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error("Error in POST handler:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

const parseResponse = (data: PerplexityResponse) => {
  try {
    const content = data.choices[0].message.content;
    const parsedData = JSON.parse(content);
    return parsedData.viewpoints;
  } catch (error) {
    console.error('Error parsing response:', error);
    throw new Error('Failed to parse response');
  }
}; 