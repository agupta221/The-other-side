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

async function getViewpoint(query: string, viewpoint: string) {
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
            content: `You are an expert at analyzing topics from different perspectives. For the given query, provide a detailed ${viewpoint} perspective with supporting evidence.

For each argument:
1. First provide a concise 5-7 word summary
2. Then provide a detailed explanation (2-3 sentences)
3. End with a citation reference [1], [2], etc.

Format the response as JSON with this structure:
{
  "title": "string",
  "description": "string",
  "arguments": [
    {
      "summary": "5-7 word summary here",
      "detail": "Detailed explanation with citation [1]"
    }
  ],
  "citations": [
    {
      "url": "string",
      "title": "string"
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
        frequency_penalty: 0.5
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Perplexity API error details:", errorData)
      throw new Error(`Perplexity API error: ${response.statusText}`)
    }

    const data = (await response.json()) as PerplexityResponse
    const content = data.choices[0].message.content
    
    try {
      const parsedData = JSON.parse(content)
      return {
        ...parsedData,
        viewpoint
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error)
      throw new Error('Invalid response format from API')
    }
  } catch (error) {
    console.error("Error in getViewpoint:", error)
    throw error
  }
}

export async function POST(request: Request) {
  if (!process.env.PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "Perplexity API key is not configured" },
      { status: 500 }
    )
  }

  try {
    const { query } = await request.json()

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    const [progressive, moderate, conservative] = await Promise.all([
      getViewpoint(query, "Progressive"),
      getViewpoint(query, "Moderate"),
      getViewpoint(query, "Conservative"),
    ])

    return NextResponse.json({
      perspectives: {
        progressive,
        moderate,
        conservative,
      },
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Failed to fetch perspectives" },
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