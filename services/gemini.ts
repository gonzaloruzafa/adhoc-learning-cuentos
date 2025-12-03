import { StoryRequest, StoryResponse } from "../types";

// Ahora llamamos a nuestra API serverless en lugar de Gemini directamente
export const generateEducationalStory = async (request: StoryRequest): Promise<StoryResponse> => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api/generate-story';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concept: request.concept,
        interest: request.interest,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    const data: StoryResponse = await response.json();
    return data;

  } catch (error: any) {
    console.error("Error calling story generation API:", error);
    throw new Error(error.message || 'Error al generar el cuento. Por favor, intentá de nuevo.');
  }
};

// Funciones de audio y share message se pueden mantener en el cliente ya que son menos críticas
// O también moverlas al servidor si querés proteger esas funcionalidades
export const generateStoryAudio = async (text: string): Promise<string | null> => {
  // Esta función se puede remover o mover al servidor según necesites
  console.warn("generateStoryAudio: Esta función requiere API key en el cliente. Considerar mover al servidor.");
  return null;
};

export const generateShareMessage = async (concept: string, interest: string, title: string): Promise<string> => {
  // Fallback simple sin usar API
  return `Aprendé sobre ${concept} con la temática de ${interest}`;
};