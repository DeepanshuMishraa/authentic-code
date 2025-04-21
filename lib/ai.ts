import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyA9GWoYeSDKrDHjG1HzMq4cjVnN2bNdXFM",
});


export async function AnalyzeCode(code: any) {

  const propmt = `You are a highly specialized code authenticity auditor.

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

    CODE TO ANALYZE:
    ${code}
   `

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [{ text: propmt }]
      }
    ]
  });

  console.log(response.text);

  const result = response.text;
  return result;
}

