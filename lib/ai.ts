import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY as string,
})



export async function AnalyzeCode(code: string) {
  const prompt = `You are a highly specialized code authenticity auditor analyzing a batch of files from a repository.

    Your mission is to detect subtle signs of AI-generated versus human-written code across multiple files.
    BE CONCISE. Limit your reasoning to 2-3 key observations.

    When analyzing the code batch, consider these key factors:
    - Consistency vs organic inconsistencies across files
    - Comment and naming convention patterns
    - Error handling and code organization
    - Project-wide patterns and relationships

    The input contains multiple files marked with "// FILE: filename" headers.
    Analyze them together as a cohesive unit.

    Return a JSON object in this format (BE CONCISE in reasoning, max 200 characters):
    {
      "authenticity_score": NUMBER, // 0-100, higher means more likely human-written
      "reasoning": "SHORT_TEXT",    // 2-3 key observations only
      "writing_style": "SHORT_TEXT", // Brief style description
      "confidence_level": "TEXT"    // High/Medium/Low
    }`;

  try {
    console.log("Analyzing batch of files...");
    const response = await generateText({
      model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: "user",
          content: code
        }
      ]
    });

    const content = response.response?.messages?.[0]?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    let result = typeof content === 'string' ? content : content[0]?.text || '';
    result = result.trim();

    // Try to extract JSON whether it's wrapped in markdown or not
    let jsonStr = result;
    const markdownMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonStr = markdownMatch[1].trim();
    }

    try {
      // First try direct parse
      const parsed = JSON.parse(jsonStr);
      return {
        authenticityScore: Number(parsed.authenticity_score) || 0,
        reasoning: parsed.reasoning || "No reasoning provided",
        writingStyle: parsed.writing_style || "Unknown",
        confidenceLevel: parsed.confidence_level || "Low"
      };
    } catch (error) {
      // If direct parse fails, try to extract JSON object
      const jsonRegex = /{[\s\S]*}/;
      const jsonMatch = result.match(jsonRegex);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return {
          authenticityScore: Number(extracted.authenticity_score) || 0,
          reasoning: extracted.reasoning || "No reasoning provided",
          writingStyle: extracted.writing_style || "Unknown",
          confidenceLevel: extracted.confidence_level || "Low"
        };
      }
      throw new Error("Could not parse AI response");
    }
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error(`AI analysis failed: ${error}`);
  }
}


