// ========================================
// PROGRAMADOR DE CAMPAÑAS
// ========================================
// Este archivo programa el envío automático de imágenes

import cron from 'node-cron';
import { listImagesFromDrive, downloadImageFromDrive } from './googleDrive.js';
import { sendWhatsAppImage } from './whatsapp.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ========================================
// CONFIGURACIÓN
// ========================================
const CAMPAIGN_MESSAGE = process.env.CAMPAIGN_MESSAGE || "¡Hola! Mira nuestras nuevas ofertas 🎉";
const CAMPAIGN_SCHEDULE = process.env.CAMPAIGN_SCHEDULE || "0 9 * * 1"; // Lunes 9am
const MAX_SENDS = parseInt(process.env.CAMPAIGN_MAX_SENDS || "100");
const DELAY_BETWEEN_SENDS = 2000; // 2 segundos

// ========================================
// FUNCIÓN PRINCIPAL DE CAMPAÑA
// ========================================
export const runCampaign = async () => {
    console.log("🚀 Iniciando campaña de imágenes...");

    try {
        // 1. Leer lista de prospectos
        const prospectsPath = join(__dirname, '../data/prospects.json');
        const prospectsData = await readFile(prospectsPath, 'utf-8');
        const { prospects } = JSON.parse(prospectsData);

        if (!prospects || prospects.length === 0) {
            console.log("⚠️ No hay prospectos en la lista");
            return;
        }

        console.log(`📋 Encontrados ${prospects.length} prospectos`);

        // 2. Obtener imágenes de Drive
        const images = await listImagesFromDrive();

        if (!images || images.length === 0) {
            console.log("⚠️ No hay imágenes en la carpeta de Drive");
            return;
        }

        console.log(`🖼️ Encontradas ${images.length} imágenes en Drive`);

        // 3. Enviar imágenes
        let sentCount = 0;
        let errorCount = 0;

        for (const image of images) {
            if (sentCount >= MAX_SENDS) {
                console.log(`⚠️ Alcanzado límite de ${MAX_SENDS} envíos`);
                break;
            }

            console.log(`\n📤 Procesando imagen: ${image.name}`);

            // Descargar imagen
            const imageBuffer = await downloadImageFromDrive(image.id);

            // Enviar a cada prospecto
            for (const phoneNumber of prospects) {
                if (sentCount >= MAX_SENDS) break;

                try {
                    await sendWhatsAppImage({
                        to: phoneNumber,
                        imageBuffer,
                        mimeType: image.mimeType,
                        caption: CAMPAIGN_MESSAGE
                    });

                    sentCount++;
                    console.log(`✅ Enviado ${sentCount}/${prospects.length * images.length}: ${image.name} → ${phoneNumber}`);

                    // Delay para evitar rate limiting
                    if (sentCount < MAX_SENDS) {
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SENDS));
                    }

                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error enviando a ${phoneNumber}:`, error.message);
                }
            }
        }

        console.log(`\n📊 Campaña completada:`);
        console.log(`   ✅ Enviados: ${sentCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);

    } catch (error) {
        console.error("❌ Error en campaña:", error);
        throw error;
    }
};

// ========================================
// PROGRAMADOR
// ========================================
export const initCampaignScheduler = () => {
    console.log(`⏰ Programador de campañas iniciado`);
    console.log(`   Horario: ${CAMPAIGN_SCHEDULE} (Lunes 9am por defecto)`);
    console.log(`   Mensaje: "${CAMPAIGN_MESSAGE}"`);

    // Programar tarea con cron
    cron.schedule(CAMPAIGN_SCHEDULE, async () => {
        console.log(`\n🔔 Ejecutando campaña programada - ${new Date().toLocaleString()}`);
        try {
            await runCampaign();
        } catch (error) {
            console.error("❌ Error en campaña programada:", error);
        }
    });

    console.log("✅ Scheduler activo");
};
