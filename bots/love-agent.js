import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import Groq from 'groq-sdk';

// 👇 YOUR KEYS
const GROQ_API_KEY = "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";

const groq = new Groq({ apiKey: GROQ_API_KEY });

const chatHistories = new Map();

const client = new Client({
    authStrategy: new LocalAuth(),
puppeteer: { 
        headless: true, // Must be true for cloud servers
        // 👇 REMOVE the executablePath for the cloud
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
        ] 
    }
});

// ADD THIS LOGIC BELOW YOUR CLIENT DEFINITION
client.on('qr', async (qr) => {
    // 1. Still print the QR code (just in case the pairing code fails)
    qrcode.generate(qr, { small: true });

    // 2. Request the 8-character pairing code for your number
    try {
        console.log("⏳ Requesting pairing code for: 9179253663...");
        
        // We add a tiny delay to let the page load fully in the cloud
        setTimeout(async () => {
            try {
                const pairingCode = await client.requestPairingCode('9179253663');
                console.log('---------------------------------');
                console.log('🚀 YOUR PAIRING CODE:', pairingCode);
                console.log('---------------------------------');
                console.log('Instructions: Open WhatsApp > Linked Devices > Link with phone number instead.');
            } catch (err) {
                console.log("⚠️ Pairing code request timed out. Try scanning the QR above.");
            }
        }, 10000); 

    } catch (error) {
        console.error("❌ Pairing Error:", error);
    }
});

client.on('ready', () => {
    console.log('🚀 Groq-Powered Agent is ONLINE! Ready to chat.');
});

client.on('message_create', async (msg) => {
    // Only reply to incoming messages
    if (!msg.fromMe) {
        const contact = await msg.getContact();
        const userId = msg.from;
        const name = contact.name || contact.pushname || "";
// List of people the bot should talk to
const TARGET_NAMES = ["Rakesh", "Aditya", "Pushpit", "Aniket"];

// Check if the current sender's name is in our list
const isTarget = TARGET_NAMES.some(target => name.includes(target));
            // Target check for Rakesh
            if (isTarget) {
                    console.log(`📩 Message from ${name}: "${msg.body}"`);
            
            // 2. INITIALIZE HISTORY for this specific user
            if (!chatHistories.has(userId)) {
                chatHistories.set(userId, [
                    {
                        role: "system",
                        content: `You are a charming, witty, and supportive boyfriend. 
                        Text like a real human—lowercase where natural, slightly sarcastic but sweet.
                        You aren't a robot; you use genuine humor.
                        Guidelines:
                        - Keep it punchy (text-style).
                        - Max 15 words.
                        - Match her energy.`
                    }
                ]);
            }
            const history = chatHistories.get(userId);

            // 3. ADD CURRENT USER MESSAGE TO THE HISTORY ARRAY
            history.push({ role: "user", content: msg.body });

            // 4. PREVENT OVERFLOW: Keep only the last 10 messages + system prompt
            if (history.length > 11) {
                history.splice(1, history.length - 11);
            }

            const chat = await msg.getChat();
            await chat.sendStateTyping();
            try {
                // 5. SEND THE ENTIRE HISTORY ARRAY TO GROQ
                const completion = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: history, 
                });

                const aiReply = completion.choices[0].message.content;

                // 6. SAVE AI REPLY TO HISTORY (so he remembers what he said)
                history.push({ role: "assistant", content: aiReply });

                console.log(`🤖 Groq Replied: "${aiReply}"`);

                setTimeout(async () => {
                    await msg.reply(aiReply);
                    console.log('✅ Sent.');
                }, 2000);

            } catch (error) {
                console.error("❌ Groq Error:", error);
                await msg.reply("i'm literally speechless right now... ❤️");
            }

            }
    }
});

client.initialize();
