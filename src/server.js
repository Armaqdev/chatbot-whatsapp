// ========================================
// SERVIDOR PRINCIPAL DEL CHATBOT WHATSAPP
// ========================================
// Este archivo configura el servidor Express que maneja:
// 1. Webhooks de WhatsApp para recibir mensajes
// 2. Verificación del token de webhook
// 3. Procesamiento de mensajes con IA Gemini
// 4. Notificaciones a asesores
// 5. Sistema rotativo de asignación de asesores

import "dotenv/config"; // Carga las variables de entorno desde el archivo .env
import express from "express";
import { generateBotReply } from "./services/gemini.js"; // Servicio para generar respuestas con IA
import { sendWhatsAppText } from "./services/whatsapp.js"; // Servicio para enviar mensajes por WhatsApp

// ========================================
// CONFIGURACIÓN DE ASESORES Y NOTIFICACIONES
// ========================================

// Número donde llegan notificaciones generales (definido en .env)
const notifyNumber = process.env.WHATSAPP_NOTIFY_NUMBER?.trim();

// Lista de números de asesores para asignación rotativa (definidos en .env)
const advisorNumbers = (process.env.WHATSAPP_ADVISOR_QUEUE ?? "")
  .split(",") // Separa por comas
  .map((value) => value.trim()) // Quita espacios extras
  .filter(Boolean); // Filtra valores vacíos

// Índice para rotación de asesores (empieza en 0)
let advisorCursor = 0;

// ========================================
// FUNCIÓN PARA ASIGNACIÓN ROTATIVA DE ASESORES
// ========================================
// Selecciona el siguiente asesor en la lista de manera circular
const nextAdvisorNumber = () => {
  if (advisorNumbers.length === 0) {
    return null; // No hay asesores configurados
  }

  const advisor = advisorNumbers[advisorCursor]; // Obtiene el asesor actual
  advisorCursor = (advisorCursor + 1) % advisorNumbers.length; // Avanza al siguiente (circular)
  return advisor;
};

// ========================================
// CONFIGURACIÓN DEL SERVIDOR EXPRESS
// ========================================

const app = express();
const port = Number(process.env.PORT ?? 3000); // Puerto del servidor (por defecto 3000)
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN; // Token para verificar webhook

// Middleware para procesar JSON en las peticiones
app.use(express.json());

// ========================================
// ENDPOINT DE SALUD DEL SERVIDOR
// ========================================
// GET /health - Verifica que el servidor esté funcionando
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ========================================
// VERIFICACIÓN DEL WEBHOOK DE WHATSAPP
// ========================================
// GET /webhook - WhatsApp llama a este endpoint para verificar el webhook
// Debe devolver el challenge si el token es correcto
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"]; // Modo de verificación
  const token = req.query["hub.verify_token"]; // Token enviado por WhatsApp
  const challenge = req.query["hub.challenge"]; // Challenge que debemos devolver

  // Verifica que el modo sea 'subscribe' y el token coincida
  if (mode === "subscribe" && token === verifyToken) {
    return res.status(200).send(challenge); // Webhook verificado exitosamente
  }

  return res.sendStatus(403); // Token incorrecto o modo inválido
});

// ========================================
// PROCESAMIENTO DE MENSAJES DE WHATSAPP
// ========================================
// POST /webhook - WhatsApp envía aquí los mensajes recibidos
app.post("/webhook", async (req, res) => {
  const entries = req.body.entry ?? []; // Entradas del webhook
  
  // Procesa cada entrada del webhook
  for (const entry of entries) {
    const changes = entry.changes ?? []; // Cambios en la entrada
    
    // Procesa cada cambio
    for (const change of changes) {
      const value = change.value ?? {};
      const messages = value.messages ?? []; // Mensajes recibidos
      const contacts = value.contacts ?? []; // Información de contactos

      // Procesa cada mensaje
      for (const message of messages) {
        // Solo procesa mensajes de texto (ignora imágenes, audio, etc.)
        if (message.type !== "text") {
          continue;
        }

        // ========================================
        // EXTRACCIÓN DE DATOS DEL MENSAJE
        // ========================================
        const contact = contacts[0] ?? {};
        const contactName = contact.profile?.name ?? ""; // Nombre del contacto
        const waId = contact.wa_id ?? message.from; // Número de WhatsApp
        const text = message.text?.body ?? ""; // Contenido del mensaje
        const phoneNumberId = value.metadata?.phone_number_id; // ID del número de WhatsApp Business

        // ========================================
        // GENERACIÓN DE RESPUESTA CON IA
        // ========================================
        try {
          // Genera respuesta usando Gemini AI
          const reply = await generateBotReply(text);
          // Envía la respuesta al cliente
          await sendWhatsAppText({ to: waId, message: reply, phoneNumberId });
        } catch (error) {
          console.error("Failed to process message", error);
          
          // Mensaje de respaldo en caso de error
          const fallback =
            "En este momento no puedo responder. Un asesor humano dará seguimiento en breve.";
          
          try {
            await sendWhatsAppText({
              to: waId,
              message: fallback,
              phoneNumberId,
            });
          } catch (sendError) {
            console.error("Failed to send fallback response", sendError);
          }
        }

        // ========================================
        // NOTIFICACIÓN GENERAL (si está configurada)
        // ========================================
        if (notifyNumber) {
          // Crea mensaje de notificación con información del cliente
          const notification = [
            "Título: mensaje del chatbot",
            `Nombre del cliente: ${contactName}`,
            `Número de WhatsApp: ${waId}`,
            "Resumen de mensajes:",
            text || "(sin contenido)",
          ]
            .filter(Boolean)
            .join("\n");

          try {
            await sendWhatsAppText({
              to: notifyNumber,
              message: notification,
              phoneNumberId,
            });
          } catch (notifyError) {
            console.error("Failed to notify advisor pipeline", notifyError);
          }
        }

        // ========================================
        // ASIGNACIÓN ROTATIVA DE ASESORES
        // ========================================
        const assignedAdvisor = nextAdvisorNumber(); // Obtiene el siguiente asesor
        if (assignedAdvisor) {
          // Crea mensaje de asignación para el asesor
          const assignmentMessage = [
            "Título: asignación chatbot",
            `Asesor asignado: ${assignedAdvisor}`,
            `Nombre del cliente: ${contactName}`,
            `Número de WhatsApp: ${waId}`,
            "Resumen de mensajes:",
            text || "(sin contenido)",
          ].join("\n");

          try {
            // Envía notificación al asesor asignado
            await sendWhatsAppText({
              to: assignedAdvisor,
              message: assignmentMessage,
              phoneNumberId,
            });
          } catch (assignmentError) {
            console.error("Failed to notify rotating advisor", assignmentError);
          }
        }
      }
    }
  }

  // Responde con código 200 para confirmar recepción del webhook
  return res.sendStatus(200);
});

// ========================================
// INICIO DEL SERVIDOR
// ========================================
// Inicia el servidor en el puerto especificado
app.listen(port, () => {
  console.log(`WhatsApp Gemini bot listening on port ${port}`);
});

// Railway asigna un puerto automáticamente en la variable process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
