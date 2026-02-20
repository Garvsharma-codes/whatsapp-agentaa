// love-agent.js
import { makeWASocket, useMultiFileAuthState as getMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STICKERS = {
    SMIRK:    join(__dirname, 'stickers', 'smirk.webp'),
    LAUGH:    join(__dirname, 'stickers', 'laugh.webp'),
    SIDE_EYE: join(__dirname, 'stickers', 'side_eye.webp'),
};

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
            await delay(Math.floor(Math.random() * 4500) + 1500);
            await sock.readMessages([msg.key]);

try {
                // Call the brain!
                const aiReply = await getAiResponse(userId, body);
                console.log(`🤖 Groq Replied: "${aiReply}"`);

                // Human Simulation: Typing Delay (60ms per letter. Max 60 seconds)
                const typingTime = Math.min(Math.max(aiReply.length * 100, 5500), 60000);
                await sock.sendPresenceUpdate('composing', userId);
                await delay(typingTime);
                await sock.sendPresenceUpdate('paused', userId);
                
                // 👇 THE STICKER INTERCEPTOR 👇
                let textToSend = aiReply;
                let stickerToSend = null;

                if (textToSend.includes('[SMIRK]')) {
                    stickerToSend = STICKERS.SMIRK;
                    textToSend = textToSend.replace('[SMIRK]', '').trim();
                } else if (textToSend.includes('[LAUGH]')) {
                    stickerToSend = STICKERS.LAUGH;
                    textToSend = textToSend.replace('[LAUGH]', '').trim();
                } else if (textToSend.includes('[SIDE_EYE]')) {
                    stickerToSend = STICKERS.SIDE_EYE;
                    textToSend = textToSend.replace('[SIDE_EYE]', '').trim();
                }

                // 1. Send the text (if there's any text left after removing the code)
                if (textToSend.length > 0) {
                    await sock.sendMessage(userId, { text: textToSend });
                }

                // 2. Send the sticker (if a secret code was triggered)
                if (stickerToSend) {
                    // Wait 0.8 seconds so the sticker drops naturally right after the text
                    await delay(5000); 
                    await sock.sendMessage(userId, { sticker: { url: stickerToSend } });
                    console.log(`🎯 Dropped a sticker: ${stickerToSend}`);
                }
                
                console.log('✅ Sent like a human.');

            } catch (error) {
                console.error("❌ Groq Error:", error);
                await sock.sendMessage(userId, { text: "i'll talk later" });
            }
        }
    });
}

startBot();
