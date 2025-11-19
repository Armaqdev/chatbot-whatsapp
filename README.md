# 🤖 WhatsApp Business Chatbot con Google Gemini

## 📋 **Descripción del Proyecto**

Este proyecto implementa un chatbot inteligente para WhatsApp Business que utiliza **Google Gemini AI** para generar respuestas automáticas personalizadas. El bot puede:

- ✅ Responder preguntas sobre productos y servicios
- ✅ Proporcionar cotizaciones automáticas  
- ✅ Manejar consultas de clientes 24/7
- ✅ Notificar a asesores humanos cuando sea necesario
- ✅ Sistema de asignación rotativa de asesores
- ✅ Configuración completamente personalizable

---

## 🔧 **Requisitos Previos**

Antes de instalar, asegúrate de tener:

### **Software necesario:**
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **npm** (viene incluido con Node.js)

### **Cuentas y servicios necesarios:**
1. **WhatsApp Business API** - [Meta for Developers](https://developers.facebook.com/docs/whatsapp/cloud-api)
   - Número de WhatsApp Business verificado
   - Token de acceso permanente
   - ID del número de teléfono

2. **Google Gemini AI** - [AI Studio](https://ai.google.dev)
   - Cuenta de Google
   - Clave API gratuita de Gemini

3. **Webhook público** (para desarrollo)
   - [ngrok](https://ngrok.com) (recomendado para pruebas)
   - O servidor con SSL/HTTPS

---

## 🚀 **Instalación Paso a Paso**

### **1. Descargar el proyecto**
```bash
# Clona o descarga el repositorio
git clone [URL_DEL_REPOSITORIO]
cd whatsapp-gemini-chatbot
```

### **2. Instalar dependencias**
```bash
npm install
```

### **3. Configurar variables de entorno**
Copia el archivo `.env` y completa todas las variables:

**Archivo `.env` - Instrucciones detalladas:**

```env
# ========================================
# CLAVE API DE GOOGLE GEMINI (REQUERIDA)
# ========================================
# Obtén tu clave GRATIS en: https://aistudio.google.com/apikey
# 1. Ve al enlace anterior
# 2. Inicia sesión con tu cuenta Google  
# 3. Crea una nueva clave API
# 4. Copia y pega aquí (mantén el secreto)
GEMINI_API_KEY=

# Modelo de IA (deja este valor por defecto)
GEMINI_MODEL=gemini-2.5-flash

# ========================================
# CONFIGURACIÓN DE WHATSAPP BUSINESS
# ========================================
# Configura tu webhook en Meta for Developers:

# Token de verificación (TÚ LO INVENTAS - puede ser cualquier texto)
# Ejemplo: mi_token_secreto_123
# Este mismo token debes ponerlo en Meta for Developers
WHATSAPP_VERIFY_TOKEN=

# Token de acceso de WhatsApp Business API (desde Meta for Developers)
# 1. Ve a https://developers.facebook.com/apps/
# 2. Crea una app de "Business" 
# 3. Agrega el producto "WhatsApp"
# 4. Copia el token de acceso temporal o genera uno permanente
WHATSAPP_TOKEN=

# ID del número de teléfono de WhatsApp Business
# 1. En la consola de WhatsApp Business API
# 2. Ve a la sección de números de teléfono
# 3. Copia el "Phone number ID" (NOT el número de teléfono)
WHATSAPP_PHONE_NUMBER_ID=

# ========================================
# SISTEMA DE NOTIFICACIONES
# ========================================
# Número donde quieres recibir notificaciones cuando alguien escriba
# Formato: código país + número (ej: 521234567890 para México)
# Opcional: déjalo vacío si no quieres notificaciones
WHATSAPP_NOTIFY_NUMBER=

# Lista de números de asesores para asignación rotativa
# Formato: número1,número2,número3 (separados por comas, sin espacios)
# Ejemplo: 521234567890,521234567891,521234567892
WHATSAPP_ADVISOR_QUEUE=NUMERO_ASESOR_1,NUMERO_ASESOR_2,NUMERO_ASESOR_3

# ========================================
# CONFIGURACIÓN DEL SERVIDOR
# ========================================
# Puerto donde correrá tu servidor (3000 es el estándar)
PORT=3000
```

### **4. Personalizar información del negocio**
Edita el archivo `src/config/promptSections.js` con:
- ✏️ Información de tu empresa
- 🛍️ Catálogo de productos/servicios
- 💰 Precios y políticas
- 👥 Datos de contacto de asesores

---

## ⚙️ **Configuración de WhatsApp Business**

### **Paso 1: Configurar Webhook**
1. Ve a [Meta for Developers](https://developers.facebook.com/apps/)
2. Selecciona tu app de WhatsApp Business
3. Ve a **WhatsApp > Configuration**
4. En "Webhook":
   - **Webhook URL**: `https://tu-dominio.com/webhook`
   - **Verify Token**: El mismo que pusiste en `WHATSAPP_VERIFY_TOKEN`
5. Suscríbete a estos eventos: `messages`

### **Paso 2: Configurar ngrok (para desarrollo)**
```bash
# Instalar ngrok
npm install -g ngrok

# En una terminal separada
ngrok http 3000

# Copia la URL HTTPS que aparece (ej: https://abcd1234.ngrok.io)
# Úsala como Webhook URL en Meta for Developers
```

---

## 🏃‍♂️ **Ejecución**

### **Modo Desarrollo** (con recarga automática)
```bash
npm run dev
```

### **Modo Producción**
```bash
npm start
```

El servidor iniciará en: `http://localhost:3000`

### **Verificar que funciona:**
1. Ve a: `http://localhost:3000/health`
2. Deberías ver: `{"ok": true, "uptime": X}`

---

## 📱 **Cómo Probar**

1. **Envía un mensaje** al número de WhatsApp Business configurado
2. **El chatbot responderá** automáticamente usando la información que configuraste
3. **Recibirás notificaciones** en los números configurados
4. **Revisa los logs** en la consola para debugging

### **Mensajes de prueba sugeridos:**
- "Hola, ¿qué productos tienen?"
- "¿Cuánto cuesta [nombre de producto]?"
- "¿Cuáles son sus horarios?"
- "Necesito hablar con un asesor"

---

## 📁 **Estructura del Proyecto**

```
├── 📄 .env                     # Variables de entorno (TUS CLAVES SECRETAS)
├── 📄 package.json             # Dependencias y scripts
├── 📄 README.md               # Esta documentación
└── 📁 src/
    ├── 📄 server.js           # Servidor principal Express
    ├── 📁 config/
    │   └── 📄 promptSections.js # Configuración del negocio
    └── 📁 services/
        ├── 📄 gemini.js       # Integración con Gemini AI
        ├── 📄 promptBuilder.js # Constructor de prompts
        └── 📄 whatsapp.js     # Integración con WhatsApp API
```

---

## 🛠️ **Personalización**

### **Cambiar la información del negocio:**
Edita `src/config/promptSections.js`:

- **businessProfile**: Nombre, horarios, ubicación
- **catalog**: Productos y precios  
- **pricingRules**: Políticas de precios
- **operationalPolicies**: Contactos de asesores
- **responseStyle**: Cómo responde el bot

### **Ajustar el comportamiento de la IA:**
Edita `src/services/gemini.js`:
- **temperature**: Creatividad (0.0-1.0)
- **maxOutputTokens**: Longitud de respuestas
- **topP**: Diversidad de respuestas

---

## 🐛 **Resolución de Problemas**

### **Error: "Missing GEMINI_API_KEY"**
- ✅ Verifica que configuraste `GEMINI_API_KEY` en `.env`
- ✅ Asegúrate de que la clave API es válida

### **Error: "Missing WHATSAPP_TOKEN"**  
- ✅ Configura `WHATSAPP_TOKEN` en `.env`
- ✅ Verifica que el token no ha expirado

### **Webhook no funciona**
- ✅ Asegúrate de que la URL del webhook es HTTPS
- ✅ Verifica que `WHATSAPP_VERIFY_TOKEN` coincide en ambos lados
- ✅ Revisa que el servidor esté corriendo y accesible

### **No llegan mensajes**
- ✅ Verifica la configuración del webhook en Meta for Developers
- ✅ Revisa los logs del servidor
- ✅ Asegúrate de que el número está verificado en WhatsApp Business

---

## 📞 **Soporte**

Si tienes problemas:

1. **Revisa los logs** en la consola del servidor
2. **Verifica todas las variables** del archivo `.env`  
3. **Prueba el endpoint** `/health` para confirmar que el servidor funciona
4. **Revisa la documentación** de WhatsApp Business API y Gemini AI

---

## 🔒 **Seguridad**

- ⚠️ **NUNCA** subas tu archivo `.env` a repositorios públicos
- 🔐 Mantén tus tokens y claves API en secreto
- 🔄 Rota tus tokens periódicamente
- 🛡️ Usa HTTPS en producción

El servidor expone:
- `GET /health`: verificación sencilla de estado.
- `GET /webhook`: verificación inicial de Meta (usa `hub.verify_token`).
- `POST /webhook`: recepción de mensajes de WhatsApp.

## Flujo de mensajes

1. WhatsApp envía un webhook al recibir un mensaje.
2. `src/server.js` procesa el payload y extrae el texto.
3. `generateBotReply` (en `src/services/gemini.js`) construye el prompt dinámico con `buildPromptContents` y llama a Gemini.
4. El bot envía la respuesta a WhatsApp usando `sendWhatsAppText`.

### Ajustar prompts y reglas

- Añade o modifica productos en el arreglo `catalog`.
- Documenta políticas o FAQs en `pricingRules` y `operationalPolicies`.
- Ajusta el tono, formato y fallback en `responseStyle`.
- Usa `compliance` para bloquear promesas o definir cuándo escalar a un humano.

Cada vez que cambies las reglas en `promptSections`, el bot aplicará automáticamente la nueva lógica sin alterar el código.

## Exponer el webhook

Mientras desarrollas, puedes usar `ngrok` para exponer tu servidor local:
```bash
ngrok http 3000
```

Registra la URL pública generada dentro del panel de WhatsApp Cloud API como Webhook y selecciona los eventos de `messages` y `messages_status`.

## Pruebas

1. Envía un mensaje de WhatsApp al número configurado.
2. Verifica que el bot responde acorde a las reglas definidas.
3. Revisa la terminal para detectar errores de Gemini o de la API de WhatsApp.

## Siguientes pasos sugeridos

- Añadir almacenamiento de historial de conversaciones (por ejemplo, Redis o base de datos).
- Persistir cotizaciones o pedidos para seguimiento.
- Integrar autenticación de clientes recurrentes mediante identificador.
