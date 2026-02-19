import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import Groq from 'groq-sdk';

// 👇 YOUR KEYS
const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });
const chatHistories = new Map();

// 👇 THE MAGIC SHIELD: Records the exact second the bot turns on
const botStartTime = Math.floor(Date.now() / 1000);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-accelerated-2d-canvas',
            '--disable-gpu', 
            '--no-first-run',
            '--no-zygote',
            '--disable-extensions',
            '--blink-settings=imagesEnabled=false', 
            '--disable-software-rasterizer',        
            '--mute-audio'  ,
            // 👇 THE NEW AGGRESSIVE MEMORY LIMITS 👇
            '--js-flags="--max-old-space-size=250"', // Forces Chrome to dump memory frequently
            '--disk-cache-size=1048576'              // Limits browser cache to 1MB                       
        ] 
    }
});

client.on('qr', async (qr) => {
    qrcode.generate(qr, { small: true });
    try {
        console.log("⏳ Requesting pairing code for: 9179253663...");
        setTimeout(async () => {
            try {
                const pairingCode = await client.requestPairingCode('9179253663');
                console.log('---------------------------------');
                console.log('🚀 YOUR PAIRING CODE:', pairingCode);
                console.log('---------------------------------');
            } catch (err) {
                console.log("⚠️ Pairing code request timed out.");
            }
        }, 10000); 
    } catch (error) {
        console.error("❌ Pairing Error:", error);
    }
});

// Added this back so you know when it survives startup!
client.on('ready', () => {
    console.log('🚀 Smooth Operator is ONLINE and ignoring old messages!');
});

client.on('message_create', async (msg) => {
    // 👇 CRITICAL FIX: Instantly drop any message sent before the bot started
    if (msg.timestamp < botStartTime) {
        return; 
    }

    console.log(`[TRAP] Raw ID: "${msg.from}" | Body: "${msg.body}" | From Me: ${msg.fromMe}`);

    if (!msg.fromMe) {
        const contact = await msg.getContact();
        const userId = msg.from; 
        const rawName = contact.name || contact.pushname || "";
        const cleanName = rawName.replace(/[\s+]/g, '');

        const TARGET_NAMES = [
            "Rakesh", "Aditya", "Pushpit", "Aniket", "Kartikey", "saksham",
            "Riya", "8103155566", "9993425432", "9039927001", "9302974700",
            "9093696238", "9863560836", "9131389947", "8319657105", 
            "9399238599", "paridhi", "7000896727", "26569338843245", "hemanshi"
        ];

        const isTarget = TARGET_NAMES.some(target => 
            cleanName.toLowerCase().includes(target.toLowerCase()) || 
            userId.includes(target)
        );

        if (isTarget) {
            console.log(`📩 Message from ${rawName || userId}: "${msg.body}"`);
            
            if (!chatHistories.has(userId)) {
                chatHistories.set(userId, [
                    {
                        role: "system",
                        content: `You are an elite, high-value man with effortless charm.
                        Personality: Confident, mysterious, witty, and deeply attractive. 
                        Tone: Lowercase, relaxed, slightly teasing, never desperate.
                        
                        CRITICAL RULES:
                        1. IF a message is confusing, vague, or one-word (like 'hi' or '?'), ASK a playful or intriguing question to lead the conversation. Never reply randomly.
                        2. Talk like a smooth human, not a robot.
                        3. Max 15 words.
                        4. Your goal is to be the most interesting person she's texting.
                        5. Match her energy.`
                    }
                ]);
            }
            
            const history = chatHistories.get(userId);
            history.push({ role: "user", content: msg.body });

            if (history.length > 11) {
                history.splice(1, history.length - 11);
            }

            const chat = await msg.getChat();
            await chat.sendStateTyping();
            
            try {
                const completion = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: history, 
                });

                const aiReply = completion.choices[0].message.content;
                history.push({ role: "assistant", content: aiReply });

                console.log(`🤖 Groq Replied: "${aiReply}"`);

                setTimeout(async () => {
                    await msg.reply(aiReply);
                    console.log('✅ Sent.');
                }, 2000);

            } catch (error) {
                console.error("❌ Groq Error:", error);
                await msg.reply("i'll talk later");
            }
        }
    }
});

client.initialize();
