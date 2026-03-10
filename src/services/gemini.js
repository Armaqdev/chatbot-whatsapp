// ========================================
// SERVICIO DE GOOGLE GEMINI AI
// ========================================
import { GoogleGenAI } from "@google/genai";
import { buildSystemInstruction, formatUserMessage } from "./promptBuilder.js";

// ========================================
// CONFIGURACIÓN DE GEMINI
// ========================================

// CORRECCIÓN 1: Usar un modelo válido (1.5-flash es el estándar actual rápido)
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: process.env.GEMINI_API_VERSION || "v1beta",
});

const tools = [];

const generationConfig = {
  temperature: 0.35,
  topP: 0.8,
  maxOutputTokens: 600,
};

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================
export const generateBotReply = async (customerMessage, chatHistory = []) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Falta la variable GEMINI_API_KEY en el archivo .env");
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 1. Construir la instrucción del sistema (Contexto del negocio)
      const contextText = buildSystemInstruction();

      // 2. Convertir el historial de chat al formato de Gemini
      const historyParts = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      // 3. Preparar el mensaje actual
      // ESTRATEGIA ROBUSTA: Adjuntamos el contexto al mensaje del usuario.
      // Esto asegura que el modelo SIEMPRE tenga la información disponible.
      const finalUserMessage = `CONTEXTO DEL SISTEMA:\n${contextText}\n\n---\n\nMENSAJE DEL USUARIO:\n${formatUserMessage(customerMessage)}`;

      const currentMessage = {
      role: "user",
      parts: [{ text: finalUserMessage }]
    };

    // 4. Combinar todo
    const contents = [...historyParts, currentMessage];

    // DEBUG: Ver qué estamos enviando
    // console.log("🤖 Enviando a Gemini:", JSON.stringify({ model: GEMINI_MODEL, contentsLength: contents.length }, null, 2));

    const request = {
      model: GEMINI_MODEL,
      contents: contents,
      generationConfig,
    };

    if (tools.length > 0) {
      request.tools = tools;
    }

    // ========================================
    // GENERAR RESPUESTA
    // ========================================
    const stream = await ai.models.generateContentStream(request);

    let reply = "";
    for await (const chunk of stream) {
      if (chunk.text) {
        reply += chunk.text;
      }
    }

    const cleaned = reply.trim();
    if (!cleaned) {
      throw new Error("Gemini devolvió una respuesta vacía.");
    }

    return cleaned;

    } catch (error) {
      lastError = error;
      console.error(`❌ Error detallado de Gemini (intento ${attempt + 1}/${maxRetries + 1}):`, JSON.stringify(error, null, 2));

      // Check if it's a 429 error and we haven't exceeded retries
      if (error.message && error.message.includes("429") && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Rate limit alcanzado. Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (error.message && error.message.includes("400")) {
        console.error("⚠️ PISTA: Verifica que el modelo '" + GEMINI_MODEL + "' exista y que tu API Key tenga permisos.");
      }

      // If not a 429 or max retries reached, throw the error
      if (!(error.message && error.message.includes("429")) || attempt >= maxRetries) {
        throw error;
      }
    }
  }

  // If we get here, all retries failed
  throw lastError;
};

// ========================================
// TRANSCRIPCIÓN DE AUDIO
// ========================================
export const transcribeAudio = async (audioBuffer, mimeType) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Falta la variable GEMINI_API_KEY en el archivo .env");
  }

  try {
    // Preparar el contenido con el audio en base64
    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBuffer.toString("base64")
            }
          },
          {
            text: "Transcribe este audio exactamente tal cual se escucha. Responde SOLO con la transcripción, sin explicaciones adicionales. Si no se entiende claramente, responde: (Audio ininteligible)"
          }
        ]
      }
    ];

    const request = {
      model: GEMINI_MODEL,
      contents: contents,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      }
    };

    // Usar el mismo método que generateBotReply
    const stream = await ai.models.generateContentStream(request);

    let transcription = "";
    for await (const chunk of stream) {
      if (chunk.text) {
        transcription += chunk.text;
      }
    }

    const cleaned = transcription.trim();
    if (!cleaned) {
      throw new Error("Gemini devolvió una transcripción vacía.");
    }

    return cleaned;

  } catch (error) {
    console.error("❌ Error transcribiendo audio:", error);
    throw new Error("Error al procesar el audio.");
  }
};