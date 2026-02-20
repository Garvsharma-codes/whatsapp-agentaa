// love-agent.js
import { makeWASocket, useMultiFileAuthState as getMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

// 👇 Import your clean new files!
import { PHONE_NUMBER, BROWSER, TARGET_NAMES } from './config.js';
import { getAiResponse } from './ai.js';

const botStartTime = Math.floor(Date.now() / 1000);

async function startBot() {
    const { state, saveCreds } = await getMultiFileAuthState('baileys_auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), 
        browser: BROWSER, 
        syncFullHistory: false 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting in 5 seconds...');
            if (shouldReconnect) setTimeout(startBot, 5000);
        } else if (connection === 'open') {
            console.log('🚀 Smooth Operator is ONLINE and ignoring old messages!');
        }
    });

    if (!sock.authState.creds.registered) {
         console.log(`⏳ Waiting for socket to stabilize before requesting code for ${PHONE_NUMBER}...`);
         setTimeout(async () => {
             try {
                 const code = await sock.requestPairingCode(PHONE_NUMBER); 
                 console.log(`\n🚀 YOUR PAIRING CODE: ${code}\n`);
             } catch (err) {
                 console.error("⚠️ Failed to request pairing code.", err?.message || err);
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

        let actualMessage = msg.message;
        let messageType = Object.keys(actualMessage)[0];

        if (messageType === 'ephemeralMessage') {
            actualMessage = msg.message.ephemeralMessage.message;
            messageType = Object.keys(actualMessage)[0];
        } else if (messageType === 'viewOnceMessage' || messageType === 'viewOnceMessageV2') {
            actualMessage = actualMessage[messageType].message;
            messageType = Object.keys(actualMessage)[0];
        }

        let body = actualMessage.conversation || actualMessage.extendedTextMessage?.text || "";

        if (!body) {
            if (messageType === 'stickerMessage') body = "*sent a sticker*";
            else if (messageType === 'imageMessage') body = "*sent a photo*";
            else if (messageType === 'videoMessage') body = "*sent a video*";
            else if (messageType === 'audioMessage') body = "*sent a voice note*";
            else return; 
        }

        const rawName = msg.pushName || "";
        const cleanName = rawName.replace(/[\s+]/g, '');
        const isTarget = TARGET_NAMES.some(target => cleanName.toLowerCase().includes(target.toLowerCase()) || userId.includes(target));

        if (isTarget) {
            console.log(`📩 Message from ${rawName || userId}: "${body}"`);
            
            // Human Simulation: Read Delay
            await delay(Math.floor(Math.random() * 1500) + 1500);
            await sock.readMessages([msg.key]);

            // Call the brain!
            const aiReply = await getAiResponse(userId, body);
            console.log(`🤖 Groq Replied: "${aiReply}"`);

            // Human Simulation: Typing Delay
         // Human Simulation: 60ms per letter. Min 1.5 seconds, Max 60 seconds.
            const typingTime = Math.min(Math.max(aiReply.length * 70, 2500), 60000);
            await sock.sendPresenceUpdate('composing', userId);
            await delay(typingTime);
            await sock.sendPresenceUpdate('paused', userId);
            
            // Send it
            await sock.sendMessage(userId, { text: aiReply });
            console.log('✅ Sent like a human.');
        }
    });
}

startBot();
