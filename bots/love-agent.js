import { makeWASocket, useMultiFileAuthState as getMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import Groq from 'groq-sdk';

// 👇 YOUR KEYS
const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });
const chatHistories = new Map();

const botStartTime = Math.floor(Date.now() / 1000);

// Use a more stable browser string to prevent random disconnects
const BROWSER = ["Ubuntu", "Chrome", "20.0.04"];
const PHONE_NUMBER = "919179253663"; // Your number with country code (91 for India)

async function startBot() {
    const { state, saveCreds } = await getMultiFileAuthState('baileys_auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // Hide the spammy logs
        browser: BROWSER, 
        syncFullHistory: false 
    });

    // Save login credentials whenever they update
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting in 5 seconds...');
            
            if (shouldReconnect) {
                setTimeout(startBot, 5000);
            }
        } else if (connection === 'open') {
            console.log('🚀 Smooth Operator is ONLINE and ignoring old messages!');
        }
    });

    // Request the code ONLY if not registered AND the code hasn't been requested yet
    if (!sock.authState.creds.registered) {
         console.log(`⏳ Waiting for socket to stabilize before requesting code for ${PHONE_NUMBER}...`);
         
         // Wait 10 seconds for a more stable connection before asking WhatsApp for a code
         setTimeout(async () => {
             try {
                 const code = await sock.requestPairingCode(PHONE_NUMBER); 
                 console.log('\n---------------------------------');
                 console.log(`🚀 YOUR PAIRING CODE: ${code}`);
                 console.log('---------------------------------\n');
                 console.log('Instructions: Open WhatsApp > Linked Devices > Link with phone number instead.');
             } catch (err) {
                 console.error("⚠️ Failed to request pairing code. Restart server.", err?.message || err);
             }
         }, 10000); 
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const msg = messages[0];
        
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;
        if (msg.messageTimestamp < botStartTime) return;

        const userId = msg.key.remoteJid; 
        if (userId.includes('@g.us')) return;

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (!body) return; 

        console.log(`[TRAP] Raw ID: "${userId}" | Body: "${body}"`);

        const rawName = msg.pushName || "";
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
            console.log(`📩 Message from ${rawName || userId}: "${body}"`);
            
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
            history.push({ role: "user", content: body });

            if (history.length > 11) {
                history.splice(1, history.length - 11);
            }

            await sock.sendPresenceUpdate('composing', userId);
            
            try {
                const completion = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: history, 
                });

                const aiReply = completion.choices[0].message.content;
                history.push({ role: "assistant", content: aiReply });

                console.log(`🤖 Groq Replied: "${aiReply}"`);

                setTimeout(async () => {
                    await sock.sendMessage(userId, { text: aiReply });
                    console.log('✅ Sent.');
                }, 2000);

            } catch (error) {
                console.error("❌ Groq Error:", error);
                await sock.sendMessage(userId, { text: "i'll talk later" });
            }
        }
    });
}

startBot();
