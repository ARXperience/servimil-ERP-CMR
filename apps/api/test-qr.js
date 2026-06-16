// Quick test to see if baileys generates QR codes
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function testQR() {
  const authDir = path.join(__dirname, 'whatsapp-auth', 'test-qr-session');
  
  // Clean previous test
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
  }
  fs.mkdirSync(authDir, { recursive: true });

  console.log('[1] Auth dir created:', authDir);

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  console.log('[2] Auth state loaded');

  let version;
  try {
    const result = await fetchLatestBaileysVersion();
    version = result.version;
    console.log('[3] Version fetched:', version);
  } catch (e) {
    version = [2, 3000, 1015901307];
    console.log('[3] Version fetch failed, using default:', version, 'Error:', e.message);
  }

  console.log('[4] Creating socket...');
  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ['SERVIMIL', 'Chrome', '10.0'],
  });

  console.log('[5] Socket created, listening for events...');

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', async (update) => {
    console.log('[EVENT] connection.update:', JSON.stringify({
      connection: update.connection,
      hasQr: !!update.qr,
      qrLength: update.qr?.length,
      lastDisconnectCode: update.lastDisconnect?.error?.output?.statusCode,
    }));

    if (update.qr) {
      try {
        const qrDataUrl = await QRCode.toDataURL(update.qr);
        console.log('[QR] Generated data URL, length:', qrDataUrl.length);
        console.log('[QR] First 100 chars:', qrDataUrl.substring(0, 100));
      } catch (e) {
        console.log('[QR] ERROR generating data URL:', e.message);
      }
    }

    if (update.connection === 'open') {
      console.log('[CONNECTED] Session is now connected!');
    }

    if (update.connection === 'close') {
      console.log('[CLOSED] Session closed. Exiting in 3s...');
      setTimeout(() => process.exit(0), 3000);
    }
  });

  // Wait max 30 seconds for QR
  setTimeout(() => {
    console.log('[TIMEOUT] 30s passed without QR or connection. Exiting.');
    process.exit(1);
  }, 30000);
}

testQR().catch(e => {
  console.error('[FATAL]', e);
  process.exit(1);
});
