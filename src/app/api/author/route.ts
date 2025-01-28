import { NextResponse } from "next/server"

interface AuthorInfo {
  name: string
  background: string
  potentialBiases: string[]
  recentArticles: {
    title: string
    url: string
    date?: string
  }[]
  citations: {
    url: string
    title: string
  }[]
}

export async function POST(req: Request) {
  try {
    const { articleContent } = await req.json()

    if (!articleContent) {
      return NextResponse.json(
        { error: "Article content is required" },
        { status: 400 }
      )
    }

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
            content: `You are an expert at analyzing articles and finding information about authors. Given an article, identify the author and provide detailed background information.

Format the response as JSON with this structure:
{
  "name": "Author's full name",
  "background": "2-3 sentences about author's career, education, expertise",
  "potentialBiases": ["List of potential biases or conflicts of interest"],
  "recentArticles": [
    {
      "title": "Article title",
      "url": "Article URL",
      "date": "Publication date if available"
    }
  ],
  "citations": [
    {
      "url": "Source URL",
      "title": "Source title"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Analyze this article and provide information about its author:\n\n${articleContent}`
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

    const data = await response.json()
    console.log("Raw author analysis response:", JSON.stringify(data, null, 2))

    const responseContent = data.choices[0].message.content
    console.log("Raw content string:", responseContent)

    try {
      const parsedData = JSON.parse(responseContent.trim())
      console.log("Successfully parsed author data:", JSON.stringify(parsedData, null, 2))

      return NextResponse.json({
        authorInfo: {
          ...parsedData,
          citations: [
            ...(parsedData.citations || []),
            ...(data.citations || [])
          ].filter(citation => citation.title || citation.url)
        }
      })
    } catch (error) {
      console.error('Error parsing author analysis response:', error)
      throw new Error('Failed to parse author information')
    }
  } catch (error) {
    console.error("Error in author analysis:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze author" },
      { status: 500 }
    )
  }
} 