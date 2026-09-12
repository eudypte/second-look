import { checkMessage } from "./check";

async function main(): Promise<void> {
  const text = process.argv.slice(2).join(" ").trim();

  if (text === "") {
    throw new Error('Usage: npm run smoke -- "<text>"');
  }

  const verdict = await checkMessage(text);

  console.log(JSON.stringify(verdict, null, 2));
}

void main();
