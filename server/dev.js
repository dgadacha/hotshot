import { spawn } from 'node:child_process';
import { createDuelServer } from './index.js';
const app = createDuelServer();
await app.listen();
console.log('HOTSHOT duel server ready on ws://localhost:3001');
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  child.kill('SIGTERM');
  await app.close();
  process.exit(code);
}
child.on('exit', (code) => stop(code || 0));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
