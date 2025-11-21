// ========================================
// SERVICIO DE GOOGLE DRIVE
// ========================================
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

/**
 * Lista todas las imágenes en la carpeta configurada (pública)
 * @returns {Promise<Array>} Array de archivos con {id, name, mimeType}
 */
export const listImagesFromDrive = async () => {
    try {
        console.log(`📂 Listando imágenes de carpeta pública: ${FOLDER_ID}`);

        // Para carpetas públicas con API Key
        const response = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/') and trashed=false`,
            fields: 'files(id, name, mimeType, webContentLink)',
            pageSize: 100,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = response.data.files || [];
        console.log(`✅ Encontradas ${files.length} imágenes`);

        if (files.length === 0) {
            console.log("⚠️ Verificar que:");
            console.log("   1. La carpeta sea pública (Cualquiera con el enlace puede ver)");
            console.log("   2. El FOLDER_ID sea correcto");
            console.log("   3. Haya imágenes en la carpeta");
        }

        return files;
    } catch (error) {
        console.error("❌ Error listando imágenes de Drive:", error.message);
        if (error.code === 404) {
            console.error("   La carpeta no existe o no es accesible");
        } else if (error.code === 403) {
            console.error("   Permisos insuficientes - verifica que la carpeta sea pública");
        }
        throw new Error(`Error accediendo a Google Drive: ${error.message}`);
    }
};

/**
 * Descarga una imagen de Drive como buffer
 * @param {string} fileId - ID del archivo en Drive
 * @returns {Promise<Buffer>} Buffer de la imagen
 */
export const downloadImageFromDrive = async (fileId) => {
    try {
        const response = await drive.files.get(
            { fileId, alt: 'media', supportsAllDrives: true },
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
            fields: 'id, name, mimeType, size',
            supportsAllDrives: true
        });

        return response.data;
    } catch (error) {
        console.error(`❌ Error obteniendo info de ${fileId}:`, error.message);
        throw error;
    }
};
