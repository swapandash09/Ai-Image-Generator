import { GoogleGenAI } from "@google/genai";

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  model?: string;
}

export async function generateImage({
  prompt,
  aspectRatio = "1:1",
  model = "gemini-2.5-flash-image",
}: ImageGenerationOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepend a directive for short or conversational prompts to ensure image generation
  const enhancedPrompt = prompt.length < 30 
    ? `Create a stunning, detailed, high-quality artistic image based on: ${prompt}` 
    : prompt;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          text: enhancedPrompt,
        },
      ],
    },
    config: {
      systemInstruction: "You are a professional AI image generator. Your ONLY task is to generate high-quality images based on user prompts. Do not engage in conversation. If a prompt is short or conversational (like 'hello' or 'flowers'), interpret it as a request for a visually stunning, creative, and detailed image related to that topic. Never ask for clarification; always generate an image.",
      imageConfig: {
        aspectRatio,
      },
    },
  });

  // Find the image part in the response
  const parts = response.candidates?.[0]?.content?.parts || [];
  let textResponse = "";

  for (const part of parts) {
    if (part.inlineData) {
      const base64Data = part.inlineData.data;
      return `data:image/png;base64,${base64Data}`;
    }
    if (part.text) {
      textResponse += part.text;
    }
  }

  if (textResponse) {
    throw new Error(`AI Response: ${textResponse}`);
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY") {
    throw new Error("The request was blocked by safety filters. Please try a different prompt.");
  }

  throw new Error(`No image data found. Finish reason: ${finishReason || "Unknown"}`);
}
