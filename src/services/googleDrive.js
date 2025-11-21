// ========================================
// SERVICIO DE GOOGLE DRIVE
// ========================================
// Este archivo maneja la conexión con Google Drive para obtener imágenes

import { google } from 'googleapis';

// ========================================
// CONFIGURACIÓN
// ========================================
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const API_KEY = process.env.GOOGLE_API_KEY;

if (!FOLDER_ID || !API_KEY) {
    console.warn("⚠️ ADVERTENCIA: Faltan variables GOOGLE_DRIVE_FOLDER_ID o GOOGLE_API_KEY");
}

// Inicializar Drive API con API Key
const drive = google.drive({
    version: 'v3',
    auth: API_KEY
});

// ========================================
// FUNCIONES PRINCIPALES
// ========================================
 */
export const downloadImageFromDrive = async (fileId) => {
    try {
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        return Buffer.from(response.data);
    } catch (error) {
        console.error(`❌ Error descargando imagen ${fileId}:`, error.message);
        throw new Error(`Error descargando imagen: ${error.message}`);
    }
};

/**
 * Obtiene información de un archivo
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Object>} Metadata del archivo
 */
export const getFileInfo = async (fileId) => {
    try {
        const response = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size'
        });

        return response.data;
    } catch (error) {
        console.error(`❌ Error obteniendo info de ${fileId}:`, error.message);
        throw error;
    }
};
