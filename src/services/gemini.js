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
    console.error("❌ Error detallado de Gemini:", JSON.stringify(error, null, 2));
    if (error.message && error.message.includes("400")) {
      console.error("⚠️ PISTA: Verifica que el modelo '" + GEMINI_MODEL + "' exista y que tu API Key tenga permisos.");
    }
    throw error;
  }
};

// ========================================
// TRANSCRIPCIÓN DE AUDIO
// ========================================
export const transcribeAudio = async (audioBuffer, mimeType) => {
  try {
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBuffer.toString("base64")
        }
      },
      { text: "Transcribe este audio exactamente tal cual se escucha. No añadas explicaciones ni texto adicional. Si no se entiende, di '(Audio ininteligible)'." }
    ]);

    const response = await result.response;
    const text = response.text();
    return text.trim();

  } catch (error) {
    console.error("❌ Error transcribiendo audio:", error);
    throw new Error("Error al procesar el audio.");
  }
};