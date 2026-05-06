import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; // This function can run for up to 60 seconds

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return Response.json({ error: "No prompt provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Send the text prompt
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });
    
    const parts = result.response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        return Response.json({
          imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        });
      }
    }

    return Response.json({ error: "No image generated", debug: "parts: " + parts.length });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}