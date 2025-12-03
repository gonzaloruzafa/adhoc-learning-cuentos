import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Rate limiting: almacena timestamps de requests por IP
const requestCounts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests por minuto

interface StoryRequest {
  concept: string;
  interest: string;
}

interface StoryTextResponse {
  title: string;
  content: string;
  moralOrFact: string;
  imagePrompts: string[];
}

interface StoryResponse {
  title: string;
  content: string;
  moralOrFact: string;
  images: string[];
}

// Función auxiliar para rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestCounts.get(ip) || [];
  
  // Filtrar timestamps dentro de la ventana
  const recentRequests = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Agregar el timestamp actual
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  
  return true;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener IP del cliente
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || 
             req.headers['x-real-ip']?.toString() || 
             'unknown';

  // Verificar rate limit
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ 
      error: 'Demasiadas solicitudes. Por favor, esperá un momento.' 
    });
  }

  // Validar origen (opcional pero recomendado)
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'https://adhoc-learning-cuentos-educativos.vercel.app' // Ajustar a tu dominio
  ].filter(Boolean);

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`Request from unauthorized origin: ${origin} (IP: ${ip})`);
    // No bloquear, solo loguear por ahora
  }

  // Validar API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'Servicio no configurado correctamente' });
  }

  // Validar request body
  const { concept, interest } = req.body as StoryRequest;
  
  if (!concept || !interest || typeof concept !== 'string' || typeof interest !== 'string') {
    return res.status(400).json({ 
      error: 'Se requieren los campos "concept" e "interest" como strings' 
    });
  }

  // Validar longitud para prevenir abuse
  if (concept.length > 500 || interest.length > 500) {
    return res.status(400).json({ 
      error: 'Los campos son demasiado largos' 
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Generar Story Text y Image Prompts
    const textPrompt = `
    Actúa como un profesor experto y cuentacuentos creativo responsable.
    
    IMPORTANTE - POLÍTICAS DE SEGURIDAD:
    - NO generes contenido sobre violencia, armas, explosivos, o actividades peligrosas
    - NO generes contenido sexual explícito o inapropiado para menores
    - NO generes contenido que promueva odio, discriminación o acoso
    - Si el tema solicitado viola estas políticas, RECHAZALO y responde con un JSON vacío con solo el campo "error": "Contenido no permitido por razones de seguridad"
    
    El objetivo es explicar el siguiente CONCEPTO ACADÉMICO: "${concept}".
    Debes explicarlo integrándolo en una historia basada en el siguiente INTERÉS DEL ALUMNO: "${interest}".
    
    Requisitos:
    1. La historia debe ser emocionante y utilizar los tropos, personajes o ambiente del tema de interés.
    2. La explicación del concepto debe ser precisa y didáctica, entretejida en la trama.
    3. El tono debe ser inspirador y adecuado para un estudiante.
    4. IMPORTANTE: Escribe el cuento en ESPAÑOL ARGENTINO (Rioplatense). Usa "vos" y conjugaciones locales. Usá expresiones coloquiales con moderación (evitá repetir "che" o "quilombo" en exceso). Mantené un tono amigable y natural apto para niños.
    5. CRÍTICO: El cuento debe tener un MÍNIMO ABSOLUTO de 500 palabras. Contá las palabras antes de responder. Si tenés menos de 500 palabras, agregá más desarrollo, diálogos y detalles hasta alcanzar el mínimo. NO entregues cuentos cortos bajo ninguna circunstancia.
    6. Estructura obligatoria: Introducción (100+ palabras), Desarrollo con explicación del concepto (300+ palabras), Conclusión (100+ palabras).
    7. Genera EXACTAMENTE 3 descripciones visuales detalladas (prompts) para generar imágenes que ilustren momentos clave de la historia.
    8. Devuelve el resultado en JSON.
  `;

    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: textPrompt,
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
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

    const storyData: StoryTextResponse = JSON.parse(textResponse.text || '{}');

    // Verificar si el contenido fue rechazado por políticas
    if ('error' in storyData) {
      console.warn(`Content rejected for concept: "${concept}", interest: "${interest}" (IP: ${ip})`);
      return res.status(400).json({ 
        error: (storyData as any).error || 'Contenido no permitido' 
      });
    }

    // Validar que se generaron los prompts de imagen
    if (!storyData.imagePrompts || storyData.imagePrompts.length !== 3) {
      throw new Error("No se generaron los prompts de imagen correctamente");
    }

    // Generar las 3 imágenes en paralelo
    const imagePromises = storyData.imagePrompts.map(async (prompt: string) => {
      try {
        const enhancedPrompt = `${prompt}. Estilo ilustración digital moderna, colores vibrantes, amigable para niños, alta calidad.`;
        
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: enhancedPrompt }]
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
          config: {}
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

    const images = (await Promise.all(imagePromises)).filter((img): img is string => img !== null);

    const response: StoryResponse = {
      title: storyData.title,
      content: storyData.content,
      moralOrFact: storyData.moralOrFact,
      images
    };

    // Log exitoso (sin datos sensibles)
    console.log(`Story generated successfully for IP: ${ip}, concept length: ${concept.length}`);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error generating story:', error);
    
    // No exponer detalles internos del error
    return res.status(500).json({ 
      error: 'Error al generar el cuento. Por favor, intentá de nuevo.' 
    });
  }
}
