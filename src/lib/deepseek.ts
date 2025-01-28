const DEEPSEEK_API_KEY = "sk-6a7a95edc68c46568a580aef1eae9239"
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

interface DeepSeekResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function formatArticleContent(rawContent: string): Promise<string> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a professional article formatter. Your task is to:
1. Clean and format the provided article text
2. Properly identify and format headers, subheaders, and author names
3. Add appropriate spacing between paragraphs
4. Remove any unwanted elements like ads, navigation text, or footer content
5. Preserve important formatting like quotes, lists, and emphasis
6. Return the text in a clean, readable format with proper markdown styling
Do not add any additional content or modify the meaning of the text.`
          },
          {
            role: "user",
            content: `Please format this article content:\n\n${rawContent}`
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error("Failed to format article content")
    }

    const data: DeepSeekResponse = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("DeepSeek API error:", error)
    // Return the original content if formatting fails
    return rawContent
  }
} 