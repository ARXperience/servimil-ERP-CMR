const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const row = await p.systemConfig.findUnique({ where: { key: 'gemini_api_key' } });
  console.log('DB row:', JSON.stringify(row, null, 2));
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
