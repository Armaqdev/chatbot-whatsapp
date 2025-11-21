# 🤖 WhatsApp Business Chatbot con Google Gemini AI

Chatbot inteligente para WhatsApp Business que utiliza Google Gemini AI para responder consultas de clientes, con soporte para audio, memoria conversacional y campañas programadas de imágenes.

## 📋 Características

### 🧠 Inteligencia Artificial
- **Google Gemini 1.5 Flash**: Respuestas contextuales y precisas
- **Memoria conversacional**: Recuerda el contexto de la conversación
- **Información del negocio**: Conocimiento completo de productos, servicios y políticas

### 🎤 Soporte Multimedia
- **Transcripción de audio**: Convierte notas de voz a texto automáticamente
- **Mensajes de voz (PTT)**: Soporte completo para mensajes de voz de WhatsApp
- **Envío de imágenes**: Capacidad de enviar imágenes a clientes

### 📅 Campañas Programadas
- **Envío automático**: Campañas programadas cada lunes a las 9am
- **Google Drive**: Sincronización automática con carpeta de imágenes
- **Envío manual**: Ejecuta campañas cuando lo necesites
- **Rate limiting**: Control de velocidad para evitar bloqueos

### 🔒 Seguridad
- **Variables de entorno**: Todas las credenciales en `.env`
- **Token de verificación**: Webhook seguro con WhatsApp
- **Validación de mensajes**: Filtrado de tipos de mensaje soportados

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ 
- Cuenta de WhatsApp Business API
- API Key de Google Gemini
- API Key de Google Drive (para campañas)
- Cuenta de Railway (para deployment)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Armaqdev/chatbot-whatsapp.git
cd chatbot-whatsapp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# WhatsApp Business API
WHATSAPP_TOKEN=tu_token_de_whatsapp
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WEBHOOK_VERIFY_TOKEN=tu_token_de_verificacion_secreto

# Google Gemini AI
GEMINI_API_KEY=tu_api_key_de_gemini
GEMINI_MODEL=gemini-1.5-flash

# Google Drive (para campañas)
GOOGLE_DRIVE_FOLDER_ID=id_de_tu_carpeta_publica
GOOGLE_API_KEY=tu_api_key_de_google

# Campañas (opcional)
CAMPAIGN_MESSAGE=¡Hola! Mira nuestras nuevas ofertas 🎉
CAMPAIGN_SCHEDULE=0 9 * * 1
CAMPAIGN_MAX_SENDS=100

# Notificaciones (opcional)
WHATSAPP_NOTIFY_NUMBER=numero_para_notificaciones
WHATSAPP_ADVISOR_QUEUE=numero1,numero2,numero3

# Servidor
PORT=3000
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

### 5. Ejecutar en producción

```bash
npm start
```

## 📁 Estructura del Proyecto

```
chatbot-whatsapp/
├── src/
│   ├── config/
│   │   └── promptSections.js      # Información del negocio
│   ├── data/
│   │   └── prospects.json         # Lista de clientes para campañas
│   ├── scripts/
│   │   └── sendCampaign.js        # Script manual de campaña
│   ├── services/
│   │   ├── campaignScheduler.js   # Programador de campañas
│   │   ├── chatHistory.js         # Gestión de memoria conversacional
│   │   ├── gemini.js              # Integración con Gemini AI
│   │   ├── googleDrive.js         # Integración con Google Drive
│   │   ├── promptBuilder.js       # Constructor de prompts
│   │   └── whatsapp.js            # Cliente de WhatsApp API
│   └── server.js                  # Servidor principal
├── .env.example                   # Plantilla de variables
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Configuración de WhatsApp Business

### 1. Crear aplicación en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. Agrega el producto "WhatsApp"
4. Obtén tu `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`

### 2. Configurar Webhook

1. URL del webhook: `https://tu-dominio.railway.app/webhook`
2. Token de verificación: El valor de `WEBHOOK_VERIFY_TOKEN`
3. Suscribirse a: `messages`

## 🤖 Configuración de Google Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una API Key
3. Copia el valor a `GEMINI_API_KEY`

## 📸 Configuración de Campañas (Google Drive)

### 1. Crear carpeta pública en Drive

1. Crea una carpeta en Google Drive
2. Sube las imágenes que quieres enviar
3. Click derecho → Compartir → "Cualquiera con el enlace puede ver"
4. Copia el ID de la carpeta de la URL: `https://drive.google.com/drive/folders/[ESTE_ES_EL_ID]`

### 2. Obtener API Key de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo
3. Habilita "Google Drive API"
4. Crea credenciales → API Key
5. Copia el valor a `GOOGLE_API_KEY`

### 3. Configurar lista de prospectos

Edita `src/data/prospects.json`:

```json
{
  "prospects": [
    "5219841234567",
    "5219847654321"
  ]
}
```

**Formato:** Número internacional sin `+` (ej: `5219841234567`)

## 📅 Uso de Campañas

### Campaña Automática

El sistema envía automáticamente las imágenes cada **lunes a las 9am**.

Para cambiar el horario, modifica `CAMPAIGN_SCHEDULE` en formato cron:
- `0 9 * * 1` = Lunes 9am
- `0 14 * * 5` = Viernes 2pm
- `0 10 * * *` = Todos los días 10am

### Campaña Manual

Ejecuta la campaña inmediatamente:

```bash
npm run send-campaign
```

O desde Railway:
1. Ve a tu proyecto
2. Settings → Deploy
3. Cambia temporalmente "Start Command" a: `npm run send-campaign`
4. Redespliega
5. Restaura "Start Command" a: `npm start`

## 🎨 Personalización del Bot

### Modificar información del negocio

Edita `src/config/promptSections.js`:

```javascript
export const promptSections = {
  businessProfile: {
    name: "Tu Empresa",
    description: "Descripción de tu negocio",
    // ... más configuración
  },
  products: [
    {
      name: "Producto 1",
      description: "Descripción del producto",
      // ...
    }
  ]
};
```

### Cambiar comportamiento del bot

Modifica las secciones en `promptSections.js`:
- `responseStyle`: Tono y estilo de respuestas
- `rules`: Reglas de comportamiento
- `fallback`: Mensaje cuando no puede responder

## 🚢 Deployment en Railway

### 1. Conectar repositorio

1. Ve a [Railway](https://railway.app/)
2. New Project → Deploy from GitHub
3. Selecciona el repositorio

### 2. Configurar variables de entorno

En Railway, ve a Variables y agrega todas las del archivo `.env`

### 3. Verificar deployment

El bot debería mostrar en los logs:
```
WhatsApp Gemini bot listening on port 8080
⏰ Programador de campañas iniciado
✅ Scheduler activo
```

## 📊 Monitoreo

### Logs importantes

```bash
# Mensaje recibido
📩 Mensaje recibido. Tipo: text

# Audio procesado
🎤 Recibido mensaje de audio/voz...
📝 Transcripción: "texto transcrito"

# Campaña ejecutada
🚀 Iniciando campaña de imágenes...
✅ Enviados: 22
```

### Errores comunes

**Error: Missing WEBHOOK_VERIFY_TOKEN**
- Solución: Agrega `WEBHOOK_VERIFY_TOKEN` en `.env`

**Error: 404 en Google Drive**
- Solución: Verifica que la carpeta sea pública y el ID correcto

**Bot no responde**
- Solución: Verifica que Railway esté ejecutando `npm start`, no `npm run send-campaign`

## 🔄 Actualización del Sistema

```bash
# Actualizar código
git pull origin main

# Reinstalar dependencias si hay cambios
npm install

# Reiniciar servidor
npm start
```

En Railway, el deployment es automático al hacer push a GitHub.

## 📝 Scripts Disponibles

```bash
npm start              # Inicia el servidor en producción
npm run dev            # Inicia en modo desarrollo con nodemon
npm run send-campaign  # Ejecuta campaña manual de imágenes
```

## 🛡️ Seguridad

### Archivos excluidos de Git

El `.gitignore` excluye:
- `.env` y `.env.example` (credenciales)
- `node_modules/` (dependencias)
- `.DS_Store` (archivos del sistema)

### Buenas prácticas

1. **Nunca** compartas tu `.env`
2. Usa tokens fuertes para `WEBHOOK_VERIFY_TOKEN`
3. Rota las API Keys periódicamente
4. Revisa los logs regularmente

## 🤝 Soporte

Para problemas o preguntas:
1. Revisa los logs en Railway
2. Verifica las variables de entorno
3. Consulta la documentación de [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## 📄 Licencia

Este proyecto es privado y propietario de ARMAQ.

---

**Desarrollado con ❤️ usando Google Gemini AI**
