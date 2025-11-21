// ========================================
// SERVICIO DE WHATSAPP BUSINESS API
// ========================================
import fetch from "node-fetch";

// ========================================
// CONFIGURACIÓN DE LA API DE WHATSAPP
// ========================================
const graphUrl = (phoneNumberId) =>
  `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

const buildHeaders = () => {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) {
    throw new Error("Missing WHATSAPP_TOKEN environment variable");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// ========================================
// ENVÍO DE MENSAJES DE TEXTO
// ========================================
export const sendWhatsAppText = async ({ to, message, phoneNumberId }) => {
  const id = phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("Missing WhatsApp phone number ID");
  if (!to) throw new Error("Missing recipient number");

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  try {
    const response = await fetch(graphUrl(id), {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`WhatsApp API error (${response.status}): ${errorBody}`);
    }
  } catch (error) {
    throw error;
  }
};

// ========================================
// GESTIÓN DE ARCHIVOS MULTIMEDIA
// ========================================
export const getMediaUrl = async (mediaId) => {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("Missing WHATSAPP_TOKEN");

  const response = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Error getting media URL: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
};

export const downloadMedia = async (url) => {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("Missing WHATSAPP_TOKEN");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Error downloading media: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// ========================================
// ENVÍO DE IMÁGENES
// ========================================
export const sendWhatsAppImage = async ({ to, imageBuffer, mimeType, caption, phoneNumberId }) => {
  const id = phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("Missing WhatsApp phone number ID");
  if (!to) throw new Error("Missing recipient number");

  try {
    // Paso 1: Subir la imagen a WhatsApp
    const FormData = (await import('form-data')).default;
    const uploadUrl = `https://graph.facebook.com/v21.0/${id}/media`;
    const formData = new FormData();

    formData.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: mimeType
    });
    formData.append('messaging_product', 'whatsapp');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      throw new Error(`Error uploading image (${uploadResponse.status}): ${errorBody}`);
    }

    const uploadData = await uploadResponse.json();
    const mediaId = uploadData.id;

    // Paso 2: Enviar el mensaje con la imagen
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "image",
      image: {
        id: mediaId,
        caption: caption || ""
      }
    };

    const sendResponse = await fetch(graphUrl(id), {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!sendResponse.ok) {
      const errorBody = await sendResponse.text();
      throw new Error(`WhatsApp API error (${sendResponse.status}): ${errorBody}`);
    }

    console.log(`✅ Imagen enviada a ${to}`);

  } catch (error) {
    console.error(`❌ Error enviando imagen a ${to}:`, error.message);
    throw error;
  }
};
