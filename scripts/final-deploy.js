import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function deploy() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  // 1. Upload updated proxy
  console.log('Uploading proxy...');
  await ssh.putFile(
    'D:/Claude Cowork/Pesat ai business architect/pesat-ai-business-architect/scripts/advisor-proxy.js',
    '/var/www/advisor-proxy.js'
  );

  // 2. Upload .env if it exists
  const LOCAL_ENV = 'D:/Claude Cowork/Pesat ai business architect/pesat-ai-business-architect/.env';
  const REMOTE_ENV = '/var/www/advisor/.env';
  if (fs.existsSync(LOCAL_ENV)) {
    console.log('Uploading .env to', REMOTE_ENV, '...');
    await ssh.putFile(LOCAL_ENV, REMOTE_ENV);
  } else {
    console.log('No local .env found; proxy must rely on env vars already on server.');
  }

  // 3. Start proxy on port 3002 with PM2, sourcing .env
  console.log('Starting proxy with PM2...');
  await ssh.execCommand(
    "bash -c 'set -a; source /var/www/advisor/.env; set +a; pm2 delete advisor-proxy 2>/dev/null || true; pm2 start /var/www/advisor-proxy.js --name advisor-proxy; pm2 save'"
  );

  // 4. Replace placeholder index.html with app index.html
  console.log('Replacing placeholder index.html...');
  await ssh.execCommand('cp /var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor/index.html /var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/index.html');

  // 5. Update Caddy config to reverse proxy /api to host:3002
  console.log('Detecting Docker host IP...');
  const ipResult = await ssh.execCommand(
    'docker exec pesat-control-plane-caddy-1 sh -c "ip route | awk \'\/default\/ {print $3}\'"'
  );
  const hostIp = ipResult.stdout.trim() || '172.20.0.1';
  console.log('Using host IP:', hostIp);

  console.log('Updating Caddy config...');
  const current = await ssh.execCommand('cat /opt/pesat-control-plane/caddy/Caddyfile');
  let content = current.stdout;
  content = content.replace(
    /handle_path\s+\/api\/\*\s*\{\s*reverse_proxy\s+[^}]+\}/g,
    `handle_path /api/* {\n        reverse_proxy ${hostIp}:3002\n    }`
  );
  content = content.replace(
    /handle\s+\/api\/\*\s*\{\s*reverse_proxy\s+[^}]+\}/g,
    `handle_path /api/* {\n        reverse_proxy ${hostIp}:3002\n    }`
  );
  content = content.replace(/127\.0\.0\.1:3000/g, `${hostIp}:3002`);
  content = content.replace(/172\.20\.0\.1:3002/g, `${hostIp}:3002`);

  await ssh.execCommand(`cat > /opt/pesat-control-plane/caddy/Caddyfile <<'EOF'\n${content}\nEOF`);

  console.log('Validating Caddy config...');
  const validate = await ssh.execCommand(
    'docker exec pesat-control-plane-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile'
  );
  console.log(validate.stdout);
  if (validate.stderr) console.error(validate.stderr);

  console.log('Restarting Caddy...');
  await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
  await new Promise((r) => setTimeout(r, 3000));

  // 6. Test
  console.log('Testing /advisor/...');
  const test = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/advisor/ | head -5');
  console.log(test.stdout);

  console.log('Testing /api/health...');
  const health = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/api/health');
  console.log(health.stdout);

  ssh.dispose();
}

deploy().catch(err => {
  console.error('Deploy failed:', err);
  process.exit(1);
});
