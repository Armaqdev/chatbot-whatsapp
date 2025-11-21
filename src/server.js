// ========================================
// SERVIDOR PRINCIPAL DEL CHATBOT WHATSAPP
// ========================================

import "dotenv/config";
import express from "express";
import { generateBotReply } from "./services/gemini.js";
import { sendWhatsAppText } from "./services/whatsapp.js";
import { getHistory, addMessageToHistory } from "./services/chatHistory.js";

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
        if (message.type !== "text") continue;

        const contact = contacts[0] ?? {};
        const contactName = contact.profile?.name ?? "";
        const waId = contact.wa_id ?? message.from;
        const text = message.text?.body ?? "";
        const phoneNumberId = value.metadata?.phone_number_id;

        // --- LOGICA DEL BOT ---
        try {
          // 1. Obtener historial
          const history = getHistory(waId);

          // 2. Generar respuesta con contexto
          const reply = await generateBotReply(text, history);

          // 3. Enviar respuesta
          await sendWhatsAppText({ to: waId, message: reply, phoneNumberId });

          // 4. Actualizar historial (Guardar ambos mensajes)
          addMessageToHistory(waId, "user", text);
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
});
