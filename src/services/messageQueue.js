// ========================================
// SISTEMA DE COLA DE MENSAJES
// ========================================
// Procesa mensajes secuencialmente para evitar rate limits

class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      // Pausa entre solicitudes para respetar rate limits de Google Gemini
      // 2 segundos = ~30 solicitudes/minuto (debajo del límite usual)
      await new Promise(r => setTimeout(r, 2000));
    }

    this.processing = false;
  }
}

export const messageQueueService = new MessageQueue();
