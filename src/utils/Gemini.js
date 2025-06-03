import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function Gemini({content}) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ parts: [{ text: content }] }],
    });
    return response.text; // Return the generated text
    
  } catch (error) {
    console.error("Error generating content:", error);
    throw {
      message: error.message || "Failed to generate content. Please try again.",
      originalError: error,
    };
  }

}

export default Gemini