import { writeFile } from 'node:fs/promises';
import { loadEnvConfig } from '@next/env';

async function main() {
  loadEnvConfig(process.cwd(), process.argv.includes('--development'));
  const { llmsIndex } = await import('../src/lib/discovery');
  await writeFile('public/LLM.txt', llmsIndex());
}
void main();
