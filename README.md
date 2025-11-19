🤖 WhatsApp Business Chatbot con Google Gemini (Node.js)
Este proyecto implementa un chatbot inteligente para WhatsApp Business utilizando Google Gemini AI. Está diseñado para ser desplegado fácilmente en la nube (Railway, Render, etc.) y cuenta con un sistema de atención al cliente híbrido (IA + Asesores Humanos).
✨ Características Principales
🧠 IA Avanzada: Respuestas naturales generadas por Google Gemini.
☁️ Cloud Ready: Configurado para despliegue en producción (Railway/Render).
🔄 Asignación Rotativa: Distribuye leads entre una lista de asesores humanos.
🔔 Notificaciones: Alerta a un supervisor y al asesor asignado.
🛡️ Seguro: Verificación de Webhook y manejo de variables de entorno.
📝 Personalizable: Catálogo y reglas de negocio editables en un solo archivo.
🔧 Requisitos Previos
Node.js 18+ (para desarrollo local).
Cuenta en Meta Developers con un número de WhatsApp Business configurado.
Clave API de Google AI Studio (Gemini).
Cuenta en GitHub (para subir el código).
Cuenta en Railway (u otro proveedor de hosting Node.js).
🚀 Despliegue en Railway (Producción)
Esta es la forma recomendada de usar el bot 24/7 sin mantener tu computadora encendida.
1. Preparar Repositorio
Sube este código a tu cuenta de GitHub (asegúrate de no subir el archivo .env ni la carpeta node_modules).
2. Crear Proyecto en Railway
Entra a railway.app y selecciona "Deploy from GitHub repo".
Selecciona tu repositorio.
Railway detectará automáticamente que es una app Node.js.
3. Configurar Variables de Entorno
En el panel de Railway, ve a la pestaña Variables y agrega las siguientes (usa los valores reales):
Variable	Descripción	Ejemplo
GEMINI_API_KEY	Tu clave de Google AI Studio	AIzaSyD...
WEBHOOK_VERIFY_TOKEN	Contraseña que tú inventas para verificar con Meta	mi_token_secreto
WHATSAPP_TOKEN	Token permanente (System User) de Meta	EAA...
WHATSAPP_PHONE_NUMBER_ID	ID del número de teléfono en Meta	100200300...
WHATSAPP_NOTIFY_NUMBER	Número del supervisor (con código de país)	529991234567
WHATSAPP_ADVISOR_QUEUE	Lista de asesores separados por coma	529991112222,529993334444
GEMINI_MODEL	(Opcional) Modelo a usar	gemini-2.5-flash
⚠️ IMPORTANTE: No agregues la variable PORT manualmente en Railway. Deja que la plataforma asigne su propio puerto automáticamente.
4. Generar Dominio Público
En Railway, ve a Settings > Networking.
Haz clic en Generate Domain.
Copia tu URL (ej: https://chatbot-production.up.railway.app).
5. Conectar con Meta (WhatsApp)
Ve a Meta Developers > WhatsApp > Configuración.
En Webhook, dale a Editar.
URL de devolución: Pega tu dominio de Railway agregando /webhook al final.
Ejemplo: https://chatbot-production.up.railway.app/webhook
Token de verificación: Escribe el mismo que pusiste en las variables (WEBHOOK_VERIFY_TOKEN).
Guarda y verifica.
IMPORTANTE: En "Campos de webhook", dale a Administrar y suscríbete a messages.
💻 Desarrollo Local
Si quieres probar cambios en tu computadora antes de subir a la nube:
Instalar dependencias:
code
Bash
npm install
Configurar .env:
Crea un archivo .env en la raíz basado en las variables de arriba.
Iniciar servidor:
code
Bash
npm run dev
Exponer a internet (Tunneling):
Para que Meta vea tu localhost, usa ngrok:
code
Bash
ngrok http 3000
Usa la URL que te da ngrok en el panel de Meta.
📁 Estructura del Proyecto
code
Code
├── 📄 .env                     # Variables (NO subir a GitHub)
├── 📄 package.json             # Dependencias
├── 📄 README.md                # Esta documentación
└── 📁 src/
    ├── 📄 server.js           # Servidor Express (Webhooks y Lógica)
    ├── 📁 config/
    │   └── 📄 promptSections.js # ⚙️ AQUÍ SE EDITA LA INFO DEL NEGOCIO
    └── 📁 services/
        ├── 📄 gemini.js       # Conexión con IA
        ├── 📄 promptBuilder.js # Construcción del contexto
        └── 📄 whatsapp.js     # Envío de mensajes API
🛠️ Personalización del Bot
Para cambiar precios, productos, horarios o el tono del bot, no necesitas tocar el código complicado.
Solo edita el archivo:
👉 src/config/promptSections.js
Ahí encontrarás secciones claras para:
businessProfile: Datos generales.
catalog: Tus productos.
pricingRules: Reglas de precios.
operationalPolicies: Garantías y envíos.
❓ Solución de Problemas Comunes
1. "Application failed to respond" en Railway
Asegúrate de que en server.js la línea de inicio sea: app.listen(PORT, '0.0.0.0', ...).
Verifica que no hayas definido una variable PORT fija en Railway (borrala para que sea dinámica).
2. Error (#131009) Parameter value is not valid (Número malformado)
Revisa las variables WHATSAPP_NOTIFY_NUMBER o WHATSAPP_ADVISOR_QUEUE.
Los números deben incluir el código de país sin símbolos + ni espacios.
Correcto (México): 529991234567
Incorrecto: 9991234567 o +52 999...
3. El bot no contesta aunque el Webhook está verificado
Ve a Meta Developers > WhatsApp > Configuración > Webhooks > Administrar.
Asegúrate de haber marcado Suscribirse (Subscribe) en la fila de messages.
📞 Soporte
Desarrollado para automatización de ventas y atención al cliente.
Si necesitas ayuda técnica, revisa los Logs en tu panel de Railway para ver el error exacto.
