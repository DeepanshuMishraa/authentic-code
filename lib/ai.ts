import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY as string,
})

export async function AnalyzeCode(code: any) {

  const prompt = `You are a highly specialized code authenticity auditor.

    Your mission is to detect subtle signs of AI-generated versus human-written code.

    When analyzing the code, consider:
    - Commenting style (AI often uses overly formal or generic comments).
    - Code structure (AI-generated code tends to be too clean, uniform, repetitive).
    - Variable naming (AI may use generic names like "data","info","input" etc. repetitively).
    - Error handling (human code often has incomplete or inconsistent error handling).
    - Creativity and shortcuts (humans often use creative, imperfect solutions).
    - Redundancy (AI code sometimes includes unnecessary helper functions or boilerplate).

    Your output should be a JSON object only:

    {
      "authenticity_score": [0-100],
      "reasoning": "Brief explanation (1-2 lines only).",
      "writing_style": "Summary of detected writing style (human-like, AI-like, hybrid).",
      "confidence_level": "High, Medium, or Low"
    }
   `

  try {
    console.log("Sending code to AI...");
    const response = await generateText({
      model: groq('gemma2-9b-it'),
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
    let result: string;
    if (Array.isArray(content)) {
      result = content[0]?.text || '';
    } else {
      result = content;
    }

    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      console.log("Parsed JSON from markdown:", parsed);
      return {
        authenticityScore: Number(parsed.authenticity_score) || 0,
        reasoning: parsed.reasoning || "No reasoning provided",
        writingStyle: parsed.writing_style || "Unknown",
        confidenceLevel: parsed.confidence_level || "Low"
      };
    }

    try {
      const parsed = JSON.parse(result);
      console.log("Parsed JSON:", parsed);
      return {
        authenticityScore: Number(parsed.authenticity_score) || 0,
        reasoning: parsed.reasoning || "No reasoning provided",
        writingStyle: parsed.writing_style || "Unknown",
        confidenceLevel: parsed.confidence_level || "Low"
      };
    } catch (error) {
      console.error("Failed to parse response:", error);
      throw new Error("Could not parse AI response");
    }

  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error(`AI analysis failed: ${error}`);
  }
}


