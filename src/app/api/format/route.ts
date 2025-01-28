import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    console.log("Attempting to format content with OpenAI...")
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at formatting articles for readability. Given an article's content:
1. Format it with proper markdown
2. Add appropriate headers for sections
3. Ensure paragraphs are properly spaced
4. Keep all factual content intact
5. Do not add or remove information
6. Use consistent header levels
7. Add line breaks between paragraphs for readability`
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })

    console.log("OpenAI API response received:", {
      status: response.choices[0]?.finish_reason,
      model: response.model,
      usage: response.usage
    })

    const formattedContent = response.choices[0]?.message?.content

    if (!formattedContent) {
      console.error("No content returned from OpenAI")
      throw new Error("Failed to format content - no content returned from API")
    }

    return NextResponse.json({ content: formattedContent })
  } catch (error) {
    console.error("Error formatting content:", error)
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI API Error details:", {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type
      })
      return NextResponse.json(
        { error: `OpenAI API Error: ${error.message}` },
        { status: error.status || 500 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to format content" },
      { status: 500 }
    )
  }
} 