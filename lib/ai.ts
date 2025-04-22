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
  })

  console.log("AI Response:", response.response.messages[0].content);

  return response.response.messages[0].content;
}

