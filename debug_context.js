import { buildSystemInstruction } from './src/services/promptBuilder.js';
import { generateBotReply } from './src/services/gemini.js';
import dotenv from 'dotenv';
dotenv.config();

console.log("🔍 Debugging Context Issue...\n");

// 1. Check System Instruction
console.log("--- 1. Checking System Instruction Generation ---");
try {
    const instruction = buildSystemInstruction();
    console.log("Length:", instruction.length);
    console.log("Preview (first 200 chars):", instruction.substring(0, 200));

    if (instruction.includes("ARMAQ Maquinaria Ligera")) {
        console.log("✅ Business Name found in instruction.");
    } else {
        console.error("❌ Business Name NOT found in instruction!");
    }
} catch (e) {
    console.error("❌ Error building instruction:", e);
}

// 2. Test Gemini Call (Dry Run / Mock)
// We want to see if the API accepts the systemInstruction parameter.
// Since we can't easily intercept the network call without a proxy, we'll rely on the console.log I added in gemini.js earlier (if it's still there) or add a new one.

console.log("\n--- 2. Testing Gemini Response (Real Call) ---");
try {
    // We ask a question that REQUIRES context to answer
    const question = "¿Qué horario tienen?";
    console.log(`User Question: "${question}"`);

    const reply = await generateBotReply(question);
    console.log(`Bot Reply: "${reply}"`);

    if (reply.includes("8:00") || reply.includes("18:00")) {
        console.log("✅ Bot answered with correct schedule (Context working).");
    } else {
        console.error("❌ Bot did NOT answer with schedule. Context might be missing.");
    }
} catch (e) {
    console.error("❌ Error calling Gemini:", e);
}
