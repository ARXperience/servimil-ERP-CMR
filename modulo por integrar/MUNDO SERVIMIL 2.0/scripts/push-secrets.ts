/**
 * Empuja las variables del .env.local como secrets a Cloudflare Pages.
 * Uso: npx tsx scripts/push-secrets.ts <project-name>
 *
 * Los valores se envían tal cual están en .env.local. El runtime
 * (googleAuth.ts) normaliza \n → \n para la private key.
 */
import { spawn } from "child_process";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

const PROJECT = process.argv[2] || "mundo-servimil";
const KEYS = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "SHEET_ID_CREDITOS",
  "SHEET_ID_NOMINA",
  "SHEETS_CACHE_TTL",
];

function putSecret(name: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["wrangler", "pages", "secret", "put", name, "--project-name", PROJECT],
      { stdio: ["pipe", "inherit", "inherit"], shell: process.platform === "win32" }
    );
    child.stdin.write(value);
    child.stdin.end();
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wrangler secret put ${name} exit ${code}`));
    });
  });
}

async function main() {
  for (const k of KEYS) {
    const v = process.env[k];
    if (!v) {
      console.error(`❌ ${k} no está en .env.local`);
      process.exit(1);
    }
    console.log(`→ subiendo ${k} (${v.length} chars)`);
    await putSecret(k, v);
    console.log(`✅ ${k} ok`);
  }
  console.log("\n🎉 secrets cargados en Cloudflare project:", PROJECT);
}
main().catch((e) => { console.error(e); process.exit(1); });
