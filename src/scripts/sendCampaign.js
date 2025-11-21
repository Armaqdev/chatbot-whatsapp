// ========================================
// SCRIPT MANUAL DE CAMPAÑA
// ========================================
// Ejecuta la campaña inmediatamente para pruebas
// Uso: npm run send-campaign

import 'dotenv/config';
import { runCampaign } from '../services/campaignScheduler.js';

console.log("🧪 Ejecutando campaña manualmente...\n");

runCampaign()
    .then(() => {
        console.log("\n✅ Campaña completada exitosamente");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Error en campaña:", error);
        process.exit(1);
    });
