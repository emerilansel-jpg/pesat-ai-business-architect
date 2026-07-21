import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const testDir = path.join(projectRoot, '.tmp-test-api');
fs.mkdirSync(testDir, { recursive: true });
process.env.ADVISOR_DATA_DIR = testDir;

const server = spawn('node', ['--import', 'tsx', 'server/index.ts'], { cwd: projectRoot, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 3000));

try {
  const res = await fetch('http://localhost:3001/api/config');
  console.assert(res.status === 200, 'GET /api/config should return 200');
  const body = await res.json();
  console.assert(body.textProvider === 'deepseek', 'default provider should be deepseek');
  console.assert(typeof body.hasOpenAiKey === 'boolean', 'hasOpenAiKey flag missing');
  console.assert(typeof body.hasDeepseekKey === 'boolean', 'hasDeepseekKey flag missing');

  const post = await fetch('http://localhost:3001/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', config: { textProvider: 'openai' } })
  });
  console.assert(post.status === 200, 'POST /api/config should succeed');

  const res2 = await fetch('http://localhost:3001/api/config');
  const body2 = await res2.json();
  console.assert(body2.textProvider === 'openai', 'config update should persist');

  const postBad = await fetch('http://localhost:3001/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'wrong', config: { textProvider: 'deepseek' } })
  });
  console.assert(postBad.status === 401, 'wrong password should 401');

  const keysPost = await fetch('http://localhost:3001/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', keys: { OPENAI_API_KEY: 'test-key' } })
  });
  console.assert(keysPost.status === 200, 'POST /api/keys should succeed');

  const res3 = await fetch('http://localhost:3001/api/config');
  const body3 = await res3.json();
  console.assert(body3.hasOpenAiKey === true, 'hasOpenAiKey should be true after saving key');
} finally {
  server.kill();
  fs.rmSync(testDir, { recursive: true, force: true });
}
console.log('✅ API config endpoints tests passed');
