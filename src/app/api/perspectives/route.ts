import { NextResponse } from "next/server"

interface PerplexityResponse {
  choices: [{
    message: {
      content: string
    }
  }]
  citations?: {
    url?: string
    title: string
    snippet?: string
  }[]
}

interface Argument {
  summary: string
  detail: string
}

interface ParsedResponse {
  title: string
  description: string
  arguments: Argument[]
  citations?: {
    url?: string
    title: string
  }[]
}

async function getViewpoint(query: string, viewpoint: string = "moderate") {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing topics from different perspectives. For the given query, provide a ${viewpoint} perspective with supporting evidence.

Format the response as JSON with this structure:
{
  "title": "Brief topic title",
  "description": "2-3 sentence overview",
  "arguments": [
    {
      "summary": "5-7 word summary of the point",
      "detail": "2-3 sentence explanation with citation [1]"
    }
  ],
  "citations": [
    {
      "url": "source URL",
      "title": "source title"
    }
  ]
}`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1024,
        presence_penalty: 0,
        frequency_penalty: 0.5,
        return_citations: true
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Perplexity API error details:", errorData)
      throw new Error(`Perplexity API error: ${response.statusText}`)
    }

    const data = (await response.json()) as PerplexityResponse
    console.log("Raw API response:", JSON.stringify(data, null, 2))
    
    const content = data.choices[0].message.content
    console.log("Raw content string:", content)
    
    try {
      // Try to clean the content string if needed
      const cleanContent = content.trim()
      console.log("Attempting to parse:", cleanContent)
      
      const parsedData = JSON.parse(cleanContent) as ParsedResponse
      console.log("Successfully parsed data:", JSON.stringify(parsedData, null, 2))
      
      // Validate the parsed data has the required structure
      if (!parsedData.title || !parsedData.description || !Array.isArray(parsedData.arguments)) {
        console.error("Invalid data structure:", parsedData)
        throw new Error("Missing required fields in response")
      }
      
      // Ensure the response has the required structure
      return {
        title: parsedData.title,
        description: parsedData.description,
        arguments: parsedData.arguments.map((arg: Argument) => ({
          summary: arg.summary || "",
          detail: arg.detail || ""
        })),
        citations: [
          ...(parsedData.citations || []),
          ...(data.citations || [])
        ].filter(citation => citation.title || citation.url),
        viewpoint
      }
    } catch (error: unknown) {
      console.error('Error parsing JSON response:', error)
      console.error('Content that failed to parse:', content)
      throw new Error(`Invalid response format from API: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } catch (error: unknown) {
    console.error("Error in getViewpoint:", error)
    throw error instanceof Error ? error : new Error('Unknown error in getViewpoint')
  }
}

export async function POST(req: Request) {
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
    console.error("Error in perspectives route:", error)
    return NextResponse.json(
      { error: "Failed to analyze content" },
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