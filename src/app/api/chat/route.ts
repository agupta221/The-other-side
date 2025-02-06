import { NextResponse } from "next/server"
import OpenAI from 'openai'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Source {
  title: string
  url: string
}

interface GeneratedQueries {
  mainQuery: string
  followUpQueries: string[]
}

const extractSourcesFromResponse = (text: string): { content: string, sources: Source[] } => {
  const sourcesMatch = text.match(/SOURCES:\s*([\s\S]*?)$/i)
  if (!sourcesMatch) {
    return { content: text, sources: [] }
  }

  const content = text.replace(/SOURCES:\s*([\s\S]*?)$/i, "").trim()
  const sourcesText = sourcesMatch[1]

  const sources: Source[] = sourcesText
    .split("\n")
    .filter(line => line.trim())
    .map(line => {
      const [title, url] = line.split(" - ").map(s => s.trim())
      return { title, url }
    })
    .filter(source => source.title && source.url)

  return { content, sources }
}

async function generateQueries(
  articleTitle: string,
  articleContent: string,
  messages: Message[],
  currentQuestion: string
): Promise<GeneratedQueries> {
  const prompt = `Given the following context about an article and a user's question, generate 4 detailed queries.

Article Title: "${articleTitle}"

Article Content:
${articleContent}

Chat History:
${messages
  .slice(0, -1)
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}

Current Question: "${currentQuestion}"

Please generate:
1. A detailed, consolidated query that precisely captures what the user is asking about the topic (this will be used to search for a comprehensive answer)
2. Three potential follow-up queries that the user might have after getting an answer to their current question

Format your response exactly as follows:
MAIN QUERY:
[Your consolidated query here]

FOLLOW UP QUERIES:
1. [First follow-up query]
2. [Second follow-up query]
3. [Third follow-up query]`

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a query optimization expert who helps formulate detailed and precise queries based on user questions and context."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7
  })

  const output = response.choices[0].message.content || ""
  const mainQueryMatch = output.match(/MAIN QUERY:\s*([^\n]+)/)
  const followUpQueriesMatch = output.match(/FOLLOW UP QUERIES:\s*([\s\S]+)$/)

  const mainQuery = mainQueryMatch ? mainQueryMatch[1].trim() : currentQuestion
  const followUpQueries = followUpQueriesMatch
    ? followUpQueriesMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
    : []

  return {
    mainQuery,
    followUpQueries
  }
}

export async function POST(req: Request) {
  if (!PERPLEXITY_API_KEY || !OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "API keys not configured" },
      { status: 500 }
    )
  }

  try {
    const { messages, articleContent, articleTitle } = await req.json()
    const userQuestion = messages[messages.length - 1].content

    // First, generate optimized queries using OpenAI
    const { mainQuery, followUpQueries } = await generateQueries(
      articleTitle,
      articleContent,
      messages,
      userQuestion
    )

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        // Send the follow-up queries first
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: "follow_up_queries",
              content: followUpQueries 
            })}\n\n`
          )
        )

        // Prepare the system message for Perplexity
        const systemMessage = `You are a helpful AI assistant analyzing the article titled "${articleTitle}". 
        Use the following article content as context for answering questions but if the answer is not in the article, search other sources to provide a nuanced perspective on the question:
        
        ${articleContent}
        
        When providing answers:
        1. Be concise and accurate
        2. Use information directly from the article when possible otherwise search other sources to provide a nuanced perspective on the question
        3. If you need to make assumptions or provide additional context, clearly state so
        4. Format your response with proper spacing and structure:
           - Use double line breaks between paragraphs
           - For lists or bullet points, use proper markdown formatting:
             * Use numbers (1., 2., etc.) for sequential items
             * Use hyphens (-) or asterisks (*) for bullet points
             * Add a line break before and after lists
           - Keep sentences properly spaced
           - Use appropriate formatting for emphasis when needed
        
        Previous conversation context:
        ${messages
          .slice(0, -1)
          .map((m: Message) => `${m.role}: ${m.content}`)
          .join("\n")}
        `

        const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: mainQuery }
            ],
            stream: true
          })
        })

        if (!perplexityResponse.ok) {
          throw new Error("Perplexity API request failed")
        }

        const reader = perplexityResponse.body?.getReader()
        if (!reader) throw new Error("No reader available")

        let buffer = ""
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine || trimmedLine === "data: [DONE]") continue

              if (trimmedLine.startsWith("data: ")) {
                try {
                  const data = JSON.parse(trimmedLine.slice(6))
                  if (data.choices?.[0]?.delta?.content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ 
                          type: "answer",
                          content: data.choices[0].delta.content 
                        })}\n\n`
                      )
                    )
                  }
                } catch (e) {
                  console.error("Error parsing line:", trimmedLine)
                }
              }
            }
          }

          // Handle any remaining buffer content
          if (buffer) {
            const trimmedLine = buffer.trim()
            if (trimmedLine && !trimmedLine.includes("[DONE]") && trimmedLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmedLine.slice(6))
                if (data.choices?.[0]?.delta?.content) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ 
                        type: "answer",
                        content: data.choices[0].delta.content 
                      })}\n\n`
                    )
                  )
                }
              } catch (e) {
                console.error("Error parsing final buffer:", trimmedLine)
              }
            }
          }
        } catch (error) {
          console.error("Error processing stream:", error)
        } finally {
          controller.close()
          reader.releaseLock()
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
} 
