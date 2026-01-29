
import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, ScriptOutput } from "../types";

export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K"): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `High-contrast cinematic news aesthetic for: ${prompt}. Professional, photorealistic, futuristic lighting, 8k.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
      throw new Error("API_KEY_RESET");
    }
    return null;
  }
};

export const fetchNewsArticles = async (topic: string): Promise<NewsArticle[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';
  const prompt = `Find the 5-7 most significant news headlines from the last 24 hours regarding: "${topic}". 
  Provide news headlines, sources, and timestamps. Format as valid JSON array of objects with keys: title, source, timestamp, url.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            timestamp: { type: Type.STRING },
            url: { type: Type.STRING }
          },
          required: ["title", "source", "timestamp", "url"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse news", e);
    return [];
  }
};

export const summarizeArticles = async (articles: NewsArticle[]): Promise<NewsArticle[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';
  const prompt = `Summarize these ${articles.length} news items into 2 concise, factual sentences each:
  ${articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n')}
  Return a JSON array of strings.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    const summaries = JSON.parse(response.text || '[]');
    return articles.map((article, index) => ({
      ...article,
      summary: summaries[index] || "No data synthesized."
    }));
  } catch (e) {
    return articles;
  }
};

export const generateYouTubeScript = async (topic: string, summarizedArticles: NewsArticle[]): Promise<ScriptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-pro-preview';
  const prompt = `Create a professional YouTube news script for "${topic}".
  News: ${summarizedArticles.map((a, i) => `[${i + 1}] ${a.title}: ${a.summary}`).join('\n')}
  
  Format: JSON object { intro, newsSegments: [{title, script, transition}], outro }.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intro: { type: Type.STRING },
          newsSegments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                script: { type: Type.STRING },
                transition: { type: Type.STRING }
              },
              required: ["title", "script", "transition"]
            }
          },
          outro: { type: Type.STRING }
        },
        required: ["intro", "newsSegments", "outro"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
