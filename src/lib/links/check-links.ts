import { checkLinks } from "./index";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Manual checks still work without a Safe Browsing key.
}

async function main(): Promise<void> {
  const text = process.argv.slice(2).join(" ");

  if (!text) {
    console.error('Usage: npm run check-links -- "<text>"');
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(await checkLinks(text), null, 2));
}

void main();
