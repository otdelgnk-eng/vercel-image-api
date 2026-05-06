import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return Response.json({ error: "No prompt provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent({
      contents: [{
        parts: [{ text: `Generate an image of: ${prompt}. Photorealistic, high quality.` }]
      }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"]
      }
    });

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];

    // Ищем изображение в ответе
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const imageData = part.inlineData.data;
        return Response.json({
          imageUrl: `data:${part.inlineData.mimeType};base64,${imageData}`
        });
      }
    }

    // Если нет картинки - пробуем получить URL из текста
    const text = parts.map(p => p.text).join(" ");
    return Response.json({ error: "No image in response", text: text.slice(0, 200) });

  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}