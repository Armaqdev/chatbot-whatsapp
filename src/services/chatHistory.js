// ========================================
// SERVICIO DE HISTORIAL DE CHAT
// ========================================
// Gestiona la memoria de conversación en memoria.
// NOTA: Al reiniciar el servidor, se pierde el historial.

// Almacenamiento en memoria: Map<phoneNumber, Array<Message>>
const historyStore = new Map();

// Configuración
const MAX_HISTORY_LENGTH = 10; // Guardar solo los últimos 10 mensajes
const HISTORY_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

// Estructura de mensaje: { role: 'user' | 'model', text: string, timestamp: number }

/**
 * Obtiene el historial de un usuario
 * @param {string} phoneNumber - Número de teléfono del usuario
 * @returns {Array} Array de mensajes previos
 */
export const getHistory = (phoneNumber) => {
  const history = historyStore.get(phoneNumber) || [];
  
  // Limpieza opcional: filtrar mensajes muy viejos si se desea
  const now = Date.now();
  const activeHistory = history.filter(msg => (now - msg.timestamp) < HISTORY_TTL);
  
  if (activeHistory.length !== history.length) {
    historyStore.set(phoneNumber, activeHistory);
  }
  
  return activeHistory;
};

/**
 * Agrega un mensaje al historial
 * @param {string} phoneNumber - Número de teléfono
 * @param {'user' | 'model'} role - Quién envió el mensaje
 * @param {string} text - Contenido del mensaje
 */
export const addMessageToHistory = (phoneNumber, role, text) => {
  let history = getHistory(phoneNumber);
  
  const newMessage = {
    role,
    text,
    timestamp: Date.now()
  };
  
  history.push(newMessage);
  
  // Mantener solo los últimos N mensajes para ahorrar tokens
  if (history.length > MAX_HISTORY_LENGTH) {
    history = history.slice(-MAX_HISTORY_LENGTH);
  }
  
  historyStore.set(phoneNumber, history);
};

/**
 * Borra el historial de un usuario (útil para reiniciar conversación)
 * @param {string} phoneNumber 
 */
export const clearHistory = (phoneNumber) => {
  historyStore.delete(phoneNumber);
};
