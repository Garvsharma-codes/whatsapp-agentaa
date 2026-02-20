// ai.js
import Groq from 'groq-sdk';
import { GROQ_API_KEY, SYSTEM_PROMPT } from './config.js';

const groq = new Groq({ apiKey: GROQ_API_KEY });
const chatHistories = new Map();

export async function getAiResponse(userId, incomingMessage) {
    // 1. Initialize history if new person
    if (!chatHistories.has(userId)) {
        chatHistories.set(userId, [{ role: "system", content: SYSTEM_PROMPT }]);
    }
    
    const history = chatHistories.get(userId);
    
    // 2. Add user message
    history.push({ role: "user", content: incomingMessage });

    // 3. Keep memory short
    if (history.length > 11) {
        history.splice(1, history.length - 11);
    }

    try {
        // 4. Ask Groq
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: history, 
        });

        const aiReply = completion.choices[0].message.content;
        
        // 5. Save bot reply
        history.push({ role: "assistant", content: aiReply });
        
        return aiReply;

    } catch (error) {
        console.error("❌ Groq Error:", error);
        return "i'll talk later";
    }
}
