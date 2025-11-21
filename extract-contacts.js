import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el archivo CSV
const csvPath = path.join(__dirname, 'contacts.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Leer el archivo JSON actual
const jsonPath = path.join(__dirname, 'src', 'data', 'prospects.json');
const prospectsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Parsear el CSV
const lines = csvContent.split('\n');
const phoneNumbers = new Set();

// Agregar números existentes al Set
prospectsData.prospects.forEach(num => phoneNumbers.add(num));

// Procesar cada línea del CSV (saltando el header)
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Dividir por comas, pero respetando las comas dentro de comillas
    const columns = line.split(',');

    // La columna 18 (índice 18) contiene "Phone 1 - Value"
    if (columns.length > 18) {
        const phoneValue = columns[18].trim();

        if (phoneValue) {
            // Algunos contactos tienen múltiples números separados por " ::: "
            const phones = phoneValue.split(' ::: ');

            phones.forEach(phone => {
                // Limpiar el número: quitar espacios, +, y otros caracteres
                let cleanPhone = phone.trim()
                    .replace(/\+/g, '')
                    .replace(/\s/g, '')
                    .replace(/-/g, '');

                // Validar que sea un número válido (al menos 10 dígitos)
                if (cleanPhone && cleanPhone.length >= 10 && /^\d+$/.test(cleanPhone)) {
                    phoneNumbers.add(cleanPhone);
                }
            });
        }
    }
}

// Convertir el Set a array y ordenar
const sortedPhones = Array.from(phoneNumbers).sort();

// Actualizar el objeto de prospects
prospectsData.prospects = sortedPhones;

// Guardar el archivo JSON actualizado
fs.writeFileSync(jsonPath, JSON.stringify(prospectsData, null, 4), 'utf-8');

console.log(`✅ Se extrajeron ${sortedPhones.length} números de teléfono únicos`);
console.log(`📁 Archivo actualizado: ${jsonPath}`);
