// love-agent.js
import { makeWASocket, useMultiFileAuthState as getMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

import { PHONE_NUMBER, BROWSER, TARGET_NAMES } from './config.js';
import { getAiResponse } from './ai.js';

async function botStart(){
          const { state, saveCreds } = await getMultiFileAuthState('baileys_auth_info');

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }), 
            browser: BROWSER, 
            syncFullHistory: false 
        });

      sock.ev.on('creds.update', saveCreds);
      
      sock.ev.on('connection.update', async function (update){
           const { connection, lastDisconnect } = update;
                   if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting in 5 seconds...');
            if (shouldReconnect) setTimeout(startBot, 5000);
        } else if (connection === 'open') {
            console.log('🚀 Smooth Operator is ONLINE and ignoring old messages!');
        }
      });

}
botStart();
