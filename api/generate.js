import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 90;

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return Response.json({ error: "No prompt provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Пробуем разные модели для генерации картинок
    const models = [
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash-preview",
      "gemini-2.0-flash-latest"
    ];
    
    let imageUrl = null;
    let lastError = null;
    
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.95,
            topK: 40
          }
        });
        
        const parts = result.response.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
        
        if (imageUrl) break;
        
      } catch (e) {
        lastError = e.message;
        console.log(`Model ${modelName} error:`, e.message.slice(0, 100));
      }
    }
    
    if (imageUrl) {
      return Response.json({ imageUrl });
    }
    
    return Response.json({ 
      error: "No image generated", 
      details: lastError 
    });

  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}