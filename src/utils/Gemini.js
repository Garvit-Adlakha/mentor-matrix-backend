import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function Gemini({ content }) {
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
      contents: [{ parts: [{ text: content }] }],
    });

    if (!response) throw new Error("Empty response from Gemini");

    // Common shapes returned by various GenAI SDK versions
    if (typeof response === "string") return response;
    if (response.text && typeof response.text === "string") return response.text;

    if (Array.isArray(response.output) && response.output[0]?.content) {
      const contentParts = response.output[0].content;
      return contentParts.map(p => (p?.text ?? (typeof p === 'string' ? p : ''))).join('').trim();
    }

    if (Array.isArray(response.candidates) && response.candidates[0]?.content) {
      const cand = response.candidates[0].content;
      return cand.map(p => (p?.text ?? (typeof p === 'string' ? p : ''))).join('').trim();
    }

    if (response.candidates && response.candidates[0]?.message?.content) {
      const msg = response.candidates[0].message.content;
      if (Array.isArray(msg)) return msg.map(p => p?.text ?? '').join('').trim();
      if (typeof msg === 'string') return msg;
    }

    // Fallback: try to stringify helpful fields or the whole response
    if (response.result && typeof response.result === 'string') return response.result;

    return JSON.stringify(response);
  } catch (error) {
    console.error("Error generating content:", error);
    throw {
      message: error?.message || "Failed to generate content. Please try again.",
      originalError: error,
    };
  }
}

export default Gemini;