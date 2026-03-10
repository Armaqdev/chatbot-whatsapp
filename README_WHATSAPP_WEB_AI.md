# Proyecto Bot WhatsApp Web con Agente de IA

Este documento sirve como **prompt/base** para crear un nuevo proyecto que integre WhatsApp Web (o WhatsApp Business Web) con un agente de inteligencia artificial. Es útil si quieres iniciar una aplicación independiente que funcione sobre la sesión de WhatsApp en un teléfono y, a la vez, ofrezca respuestas automáticas mediante un modelo de lenguaje.

---

## 🧠 Objetivo

Construir un bot que:
1. Se conecte a WhatsApp usando la interfaz de web (emulando un cliente con librería como `whatsapp-web.js`, `Baileys` u otra).
2. Escuche mensajes entrantes y los envíe a un servicio de IA (GPT, Gemini, etc.).
3. Envía las respuestas generadas de vuelta al usuario a través de la misma sesión de WhatsApp Web.
4. Permita que la aplicación móvil mantenga acceso al chat (la sesión es compartida con la misma cuenta QR).

> 🔒 Nota: este enfoque no es oficial y corre el riesgo de bloqueo por parte de WhatsApp.

---

## 💡 Prompt para el Generador de Código

```
Eres un desarrollador experto en bots de WhatsApp y automatización con IA.
Crea un proyecto Node.js que utilice whatsapp-web.js para conectarse a una cuenta
WhatsApp estándar (no API oficial) y un modelo de lenguaje (puede ser OpenAI
GPT-4, Google Gemini, etc.). El flujo debería ser:

1. Inicializa una sesión de WhatsApp Web usando `whatsapp-web.js`.
   - Escucha eventos `message` y `ready`.
   - Muestra en consola un texto cuando el QR está listo y cuando la sesión
     se ha autenticado.
2. Cuando llegue un mensaje de texto, envía el contenido al modelo de IA por
   medio de una función `queryAI(text)` que devuelve una cadena.
3. Devuelve la respuesta al remitente con `client.sendMessage(chatId, reply)`.
4. Incluye manejo básico de errores, reconexión y almacenamiento de la sesión en
   un archivo JSON para evitar escanear el QR cada vez.
5. Estructura el proyecto con carpetas `src/` e `index.js`.
6. Añade un README explicando cómo instalar, configurar (incluyendo API key de
   la IA) y ejecutar el bot.
7. El README debe advertir sobre los riesgos de usar WhatsApp Web para bots y
   no recomienda su uso en producción.

Genera además un archivo `package.json` con dependencias `whatsapp-web.js`,
`node-fetch` (u otra librería HTTP) y cualquier SDK de IA.
```

---

## 📁 Estructura sugerida

```
whatsapp-web-bot-ai/
├── src/
│   ├── index.js            # Entrada principal
│   ├── ai.js               # Abstracción del modelo de IA
│   ├── session.json        # Almacena credenciales de WhatsApp Web
│   └── utils.js            # Funciones auxiliares
├── .env.example            # Variables de entorno (API keys)
├── package.json
└── README.md               # Instrucciones de uso
```

---

## 🚀 Inicio rápido

1. Clona el repositorio generado.
2. `npm install` para dependencias.
3. Copia `.env.example` a `.env` y agrega tu API key de IA.
4. Ejecuta `node src/index.js` y escanea el QR con tu aplicación WhatsApp.
5. Empieza a mandar mensajes y observa cómo el bot responde usando IA.

---

¡Con este prompt tendrás una base para un nuevo proyecto alternativo usando WhatsApp Web junto a un agente de IA!"}