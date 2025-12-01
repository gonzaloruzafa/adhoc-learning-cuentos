import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryRequest, StoryResponse } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// Internal interface for the text generation model response
interface StoryTextResponse {
  title: string;
  content: string;
  moralOrFact: string;
  imagePrompts: string[];
}

export const generateEducationalStory = async (request: StoryRequest): Promise<StoryResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // 1. Generate Story Text and Image Prompts
  const textPrompt = `
    Actúa como un profesor experto y cuentacuentos creativo.
    El objetivo es explicar el siguiente CONCEPTO ACADÉMICO: "${request.concept}".
    Debes explicarlo integrándolo en una historia basada en el siguiente INTERÉS DEL ALUMNO: "${request.interest}".
    
    Requisitos:
    1. La historia debe ser emocionante y utilizar los tropos, personajes o ambiente del tema de interés.
    2. La explicación del concepto debe ser precisa y didáctica, entretejida en la trama.
    3. El tono debe ser inspirador y adecuado para un estudiante.
    4. IMPORTANTE: Escribe el cuento en ESPAÑOL ARGENTINO (Rioplatense). Usa "vos" y conjugaciones locales. Usá expresiones coloquiales con moderación (evitá repetir "che" o "quilombo" en exceso). Mantené un tono amigable y natural apto para niños.
    5. Genera EXACTAMENTE 3 descripciones visuales detalladas (prompts) para generar imágenes que ilustren momentos clave de la historia.
    6. Devuelve el resultado en JSON.
  `;

  try {
    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Un título creativo para el cuento.",
            },
            content: {
              type: Type.STRING,
              description: "El contenido completo del cuento. Usa párrafos claros.",
            },
            moralOrFact: {
              type: Type.STRING,
              description: "Una breve conclusión didáctica o dato curioso resumido.",
            },
            imagePrompts: {
              type: Type.ARRAY,
              description: "3 descripciones detalladas para generar imágenes.",
              items: { type: Type.STRING }
            }
          },
          required: ["title", "content", "moralOrFact", "imagePrompts"],
        },
      },
    });

    const textData = JSON.parse(textResponse.text || '{}') as StoryTextResponse;
    if (!textData.content) {
      throw new Error("No story content generated.");
    }

    // 2. Generate Images using Nano Banana (gemini-2.5-flash-image)
    // We limit to 3 images as requested
    const promptsToGenerate = (textData.imagePrompts || []).slice(0, 3);
    
    const imagePromises = promptsToGenerate.map(async (prompt) => {
      try {
        // Adding style descriptors to ensure consistent aesthetic
        const enhancedPrompt = `${prompt}. Estilo ilustración digital moderna, colores vibrantes, amigable para niños, alta calidad.`;
        
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: enhancedPrompt }]
          },
          // Note: Nano banana models do not support responseMimeType or responseSchema
        });

        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        return null;
      } catch (e) {
        console.error("Error generating image for prompt:", prompt, e);
        return null; 
      }
    });

    const generatedImages = (await Promise.all(imagePromises)).filter((img): img is string => img !== null);

    return {
      title: textData.title,
      content: textData.content,
      moralOrFact: textData.moralOrFact,
      images: generatedImages
    };

  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateStoryAudio = async (text: string): Promise<string | null> => {
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck typically has a good storytelling timbre
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
};

export const generateShareMessage = async (concept: string, interest: string, title: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const prompt = `
    Creá un mensaje breve y directo para compartir en WhatsApp sobre un cuento educativo.
    
    El cuento enseña sobre: "${concept}"
    Y usa la temática de: "${interest}"
    El título del cuento es: "${title}"
    
    Requisitos:
    - Debe explicar CLARAMENTE qué concepto educativo se enseña y con qué temática
    - Formato: "Aprendé sobre [CONCEPTO] a través de [TEMÁTICA]"
    - Máximo 1 línea concisa
    - Usa español argentino neutro
    - NO uses comillas, asteriscos ni emojis
    - Devolvé SOLO el texto del mensaje, nada más
    
    Ejemplo: "Aprendé sobre cómo se extrae el petróleo a través de Bluey"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const messageText = response.text?.trim() || `Aprendé sobre ${concept} con la temática de ${interest}`;
    return messageText;
  } catch (error) {
    console.error("Error generating share message:", error);
    return `Aprendé sobre ${concept} con la temática de ${interest}`;
  }
};