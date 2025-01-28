import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

// Helper function to validate URL
const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString)
    return true
  } catch (err) {
    return false
  }
}

// Helper function to extract main article content
const extractArticleContent = ($: cheerio.CheerioAPI) => {
  // Common article content selectors
  const selectors = [
    "article",
    '[role="article"]',
    ".article-content",
    ".post-content",
    ".story-content",
    "main",
  ]

  let content = ""
  let articleElement = null

  // Try each selector until we find content
  for (const selector of selectors) {
    articleElement = $(selector)
    if (articleElement.length > 0) {
      // Remove unwanted elements
      articleElement.find("script, style, nav, header, footer, .ad, .advertisement, .social-share").remove()
      content = articleElement.text().trim()
      if (content) break
    }
  }

  // If no content found with specific selectors, try paragraphs
  if (!content) {
    const paragraphs = $("p")
    content = paragraphs
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 50) // Filter out short paragraphs
      .join("\n\n")
  }

  return content
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }

    const response = await fetch(url)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch the article" },
        { status: response.status }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Get article title
    const title = $("h1").first().text().trim() || $("title").text().trim()

    // Get article content
    const content = extractArticleContent($)

    if (!content) {
      return NextResponse.json(
        { error: "Could not extract article content" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      title,
      content,
    })

  } catch (error) {
    console.error("Article scraping error:", error)
    return NextResponse.json(
      { error: "Failed to process the article" },
      { status: 500 }
    )
  }
} 