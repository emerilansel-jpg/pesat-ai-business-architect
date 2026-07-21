import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const testDir = path.join(projectRoot, '.tmp-test-proxy');
fs.mkdirSync(testDir, { recursive: true });
process.env.ADVISOR_DATA_DIR = testDir;

// Copy proxy and helper to a directory without an ESM package.json so it runs as CommonJS
fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));
fs.copyFileSync(path.join(projectRoot, 'scripts', 'advisor-proxy.js'), path.join(testDir, 'advisor-proxy.js'));
fs.copyFileSync(path.join(projectRoot, 'server', 'configStore.cjs'), path.join(testDir, 'advisor-configStore.cjs'));

// Rewrite require path to local copy
let proxySource = fs.readFileSync(path.join(testDir, 'advisor-proxy.js'), 'utf8');
proxySource = proxySource.replace("require('../server/configStore.cjs')", "require('./advisor-configStore.cjs')");
fs.writeFileSync(path.join(testDir, 'advisor-proxy.js'), proxySource);

const proxy = spawn('node', ['advisor-proxy.js'], { cwd: testDir, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2000));

try {
  const res = await fetch('http://localhost:3002/config');
  console.assert(res.status === 200, 'GET /config should return 200');
  const body = await res.json();
  console.assert(body.textProvider === 'deepseek', 'default provider should be deepseek');
  console.assert(typeof body.hasOpenAiKey === 'boolean', 'hasOpenAiKey flag missing');

  const post = await fetch('http://localhost:3002/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', config: { textProvider: 'openai' } })
  });
  console.assert(post.status === 200, 'POST /config should succeed');

  const res2 = await fetch('http://localhost:3002/config');
  const body2 = await res2.json();
  console.assert(body2.textProvider === 'openai', 'config update should persist');

  const keysPost = await fetch('http://localhost:3002/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', keys: { DEEPSEEK_API_KEY: 'test' } })
  });
  console.assert(keysPost.status === 200, 'POST /keys should succeed');
} finally {
  proxy.kill();
  await new Promise((resolve) => proxy.on('exit', resolve));
  fs.rmSync(testDir, { recursive: true, force: true });
}
console.log('✅ proxy config endpoints tests passed');
