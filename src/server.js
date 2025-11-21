// ========================================
// SERVIDOR PRINCIPAL DEL CHATBOT WHATSAPP
// ========================================

import "dotenv/config";
import express from "express";
import { generateBotReply, transcribeAudio } from "./services/gemini.js";
import { sendWhatsAppText, getMediaUrl, downloadMedia } from "./services/whatsapp.js";
import { getHistory, addMessageToHistory } from "./services/chatHistory.js";
import { initCampaignScheduler } from "./services/campaignScheduler.js";

// ========================================
// CONFIGURACIÓN DE VARIABLES
// ========================================
const app = express();
const PORT = process.env.PORT || 3000;

// SEGURIDAD: Eliminar valor por defecto. Debe venir de .env
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
if (!VERIFY_TOKEN) {
  console.error("❌ ERROR CRÍTICO: Falta WEBHOOK_VERIFY_TOKEN en .env");
  process.exit(1);
}

// Configuración de asesores
const notifyNumber = process.env.WHATSAPP_NOTIFY_NUMBER?.trim();
const advisorNumbers = (process.env.WHATSAPP_ADVISOR_QUEUE ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

let advisorCursor = 0;

// ========================================
// FUNCIÓN PARA ROTACIÓN DE ASESORES
// ========================================
const nextAdvisorNumber = () => {
  if (advisorNumbers.length === 0) return null;
  const advisor = advisorNumbers[advisorCursor];
  advisorCursor = (advisorCursor + 1) % advisorNumbers.length;
  return advisor;
};

// Middleware
app.use(express.json());

// ========================================
// RUTAS DEL SERVIDOR (ENDPOINTS)
// ========================================

// 1. Salud del servidor
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// 2. VERIFICACIÓN DEL WEBHOOK (GET)
// Esta es la puerta que Meta toca para verificar que existes
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Log para depurar en Railway si algo falla
  console.log(`Intento de verificación: Mode=${mode}, Token=${token}, MiToken=${VERIFY_TOKEN}`);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFICADO");
    res.status(200).send(challenge);
  } else {
    console.log("❌ FALLO DE VERIFICACIÓN: El token no coincide.");
    res.sendStatus(403);
  }
});

// 3. RECEPCIÓN DE MENSAJES (POST)
app.post("/webhook", async (req, res) => {
  const entries = req.body.entry ?? [];

  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      const value = change.value ?? {};
      const messages = value.messages ?? [];
      const contacts = value.contacts ?? [];

      for (const message of messages) {
        console.log(`📩 Mensaje recibido. Tipo: ${message.type}`);

        // FILTRO: Solo procesamos texto, audio y notas de voz
        if (!["text", "audio", "voice"].includes(message.type)) {
          console.log(`⚠️ Tipo de mensaje no soportado: ${message.type}`);
          continue;
        }

        const contact = contacts[0] ?? {};
        const contactName = contact.profile?.name ?? "";
        const waId = contact.wa_id ?? message.from;
        const phoneNumberId = value.metadata?.phone_number_id;

        let text = "";

        // --- LOGICA DEL BOT ---
        try {
          // 1. PROCESAR EL MENSAJE (TEXTO O AUDIO)
          if (message.type === "text") {
            text = message.text?.body ?? "";
          } else if (message.type === "audio" || message.type === "voice") {
            console.log("🎤 Recibido mensaje de audio/voz...");

            // Enviar feedback inmediato
            await sendWhatsAppText({ to: waId, message: "🎧 Escuchando tu audio...", phoneNumberId });

            const mediaObj = message.type === "audio" ? message.audio : message.voice;
            const mediaId = mediaObj.id;
            // Limpiar mimeType (ej: 'audio/ogg; codecs=opus' -> 'audio/ogg')
            const mimeType = mediaObj.mime_type.split(";")[0].trim();

            console.log(`📥 Descargando media ID: ${mediaId} (Mime original: ${mediaObj.mime_type}, Usado: ${mimeType})`);

            try {
              // Descargar audio de WhatsApp
              const mediaUrl = await getMediaUrl(mediaId);
              const mediaBuffer = await downloadMedia(mediaUrl);
              console.log(`✅ Audio descargado (${mediaBuffer.length} bytes).`);

              // Transcribir con Gemini
              text = await transcribeAudio(mediaBuffer, mimeType);
              console.log(`📝 Transcripción: "${text}"`);

              if (!text || text.includes("(Audio ininteligible)")) {
                await sendWhatsAppText({ to: waId, message: "🙉 No pude entender el audio. ¿Podrías escribirlo?", phoneNumberId });
                continue;
              }

            } catch (audioError) {
              console.error("❌ Error procesando audio:", audioError);
              await sendWhatsAppText({ to: waId, message: "⚠️ Tuve un problema escuchando el audio. Por favor intenta con texto.", phoneNumberId });
              continue;
            }
          }

          if (!text) {
            console.log("⚠️ Mensaje vacío o no se pudo transcribir.");
            continue;
          }

          // 2. Obtener historial
          const history = getHistory(waId);

          // 3. Generar respuesta con contexto
          const reply = await generateBotReply(text, history);

          // 4. Enviar respuesta
          await sendWhatsAppText({ to: waId, message: reply, phoneNumberId });

          // 5. Actualizar historial (Guardar ambos mensajes)
          // Si fue audio, guardamos la transcripción para que el bot tenga contexto
          const userLog = message.type === "audio" || message.type === "voice" ? `[AUDIO TRANSCRITO]: ${text}` : text;
          addMessageToHistory(waId, "user", userLog);
          addMessageToHistory(waId, "model", reply);

        } catch (error) {
          console.error("Error procesando mensaje:", error);
          const fallback = "En este momento no puedo responder. Un asesor humano dará seguimiento en breve.";
          try {
            await sendWhatsAppText({ to: waId, message: fallback, phoneNumberId });
          } catch (e) { }
        }

        // --- NOTIFICACIONES ---
        if (notifyNumber) {
          const notification = `Chatbot Msg:\nCliente: ${contactName}\nTel: ${waId}\nMsg: ${text}`;
          try {
            await sendWhatsAppText({ to: notifyNumber, message: notification, phoneNumberId });
          } catch (e) { console.error("Error notificando pipeline", e); }
        }

        // --- ASESOR ROTATIVO ---
        const assignedAdvisor = nextAdvisorNumber();
        if (assignedAdvisor) {
          const assignMsg = `Asignación Chatbot:\nCliente: ${contactName}\nTel: ${waId}\nMsg: ${text}`;
          try {
            await sendWhatsAppText({ to: assignedAdvisor, message: assignMsg, phoneNumberId });
          } catch (e) { console.error("Error notificando asesor", e); }
        }
      }
    }
  }
  return res.sendStatus(200);
});

// ========================================
// INICIAR SERVIDOR
// ========================================
// Esto SIEMPRE debe ir al final del archivo

// ⚠️ CAMBIO IMPORTANTE AQUÍ: Agregamos '0.0.0.0'
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp Gemini bot listening on port ${PORT}`);

  // Inicializar programador de campañas
  try {
    initCampaignScheduler();
  } catch (error) {
    console.error("⚠️ Error iniciando scheduler de campañas:", error.message);
  }
});
