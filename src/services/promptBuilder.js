// ========================================
// CONSTRUCTOR DE PROMPTS PARA GEMINI AI
// ========================================
// Este archivo construye el prompt completo que se envía a Gemini AI
// Combina la información del negocio con el mensaje del cliente
// Funciones principales:
// 1. Formatear catálogo de productos
// 2. Construir prompt completo con todas las secciones
// 3. Crear estructura de mensajes para Gemini

import { promptSections } from "../config/promptSections.js";

// ========================================
// FUNCIONES AUXILIARES DE FORMATO
// ========================================

// Convierte un array en lista numerada
const joinList = (items) => items.map((item, index) => `${index + 1}. ${item}`).join("\n");

// Formatea el catálogo de productos para el prompt
const formatCatalog = (catalog) =>
  catalog
    .map((item) => {
      const lines = [
        `• ${item.name} (${item.sku})`,
        `  Descripción: ${item.description}`,
        `  Precio unitario: ${item.unitPrice}`,
        // Solo agregar precio mayoreo si existe
        ...(item.bulkPrice ? [`  Precio mayoreo: ${item.bulkPrice}`] : []),
        `  Disponibilidad: ${item.availability}`,
      ];
      return lines.join("\n");
    })
    .join("\n\n");

// ========================================
// CONSTRUCTOR PRINCIPAL DEL PROMPT
// ========================================
// ========================================
// CONSTRUCTOR PRINCIPAL DEL PROMPT
// ========================================
// Esta función construye la "Instrucción del Sistema" (Contexto)
// y prepara el mensaje del usuario.
export const buildSystemInstruction = () => {
  // Extraer todas las secciones de configuración
  const {
    businessProfile,
    catalog,
    pricingRules,
    operationalPolicies,
    responseStyle,
    compliance,
  } = promptSections;

  // ========================================
  // CONSTRUCCIÓN DE SECCIONES DEL PROMPT
  // ========================================

  // Combinar toda la información en secciones organizadas
  const sections = [
    // SECCIÓN 1: Información básica del negocio
    `NEGOCIO: ${businessProfile.displayName}\n${businessProfile.tagline}\nUbicación: ${businessProfile.serviceArea}\nHorario: ${businessProfile.businessHours}\nContacto: ${businessProfile.contactChannels.join(", ")}`,

    // SECCIÓN 2: Catálogo de productos/servicios
    `CATÁLOGO:\n${formatCatalog(catalog)}`,

    // SECCIÓN 3: Reglas de precios y facturación
    `PRECIOS:\n${joinList(pricingRules)}`,

    // SECCIÓN 4: Políticas de operación y servicio
    `POLÍTICAS:\n${joinList(operationalPolicies)}`,

    // SECCIÓN 5: Cómo debe responder el chatbot
    `ESTILO:\n- Tono: ${responseStyle.tone}\n- Reglas: ${responseStyle.formatRules.join("; ")}\n- Fallback: ${responseStyle.fallback}`,

    // SECCIÓN 6: Restricciones y reglas de escalación
    `CUMPLIMIENTO:\n- Prohibido: ${compliance.prohibitedPromises.join("; ")}\n- Escalar si: ${compliance.escalationCriteria.join("; ")}`,
  ].join("\n\n");

  // ========================================
  // INSTRUCCIÓN PRINCIPAL PARA LA IA
  // ========================================
  return `Actúa como asistente virtual de ${businessProfile.displayName}. Usa la siguiente información oficial. Si no sabes algo, escala al humano.\n\n${sections}`;
};

// Función simple para formatear el mensaje del usuario si es necesario
export const formatUserMessage = (customerMessage) => {
  return customerMessage;
};
