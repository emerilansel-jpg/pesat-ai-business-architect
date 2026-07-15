import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function update() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  // 1. Copy dist files to /builds/apps/advisor/
  console.log('Copying dist to /builds/apps/advisor/...');
  await ssh.execCommand('mkdir -p /var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor');
  await ssh.execCommand('cp -r /var/www/advisor/* /var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor/');

  // 2. Read current Caddyfile, remove old manual block, and update wildcard blocks
  const current = await ssh.execCommand('cat /opt/pesat-control-plane/caddy/Caddyfile');
  let content = current.stdout;
  const marker = '# Manual deployment for apps.pesat.ai/advisor (legacy path)';
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    content = content.slice(0, idx).trimEnd();
  }

  // Add /api reverse proxy to wildcard blocks
  const addition = `\n\n# API reverse proxy for *.pesat.ai\n*.pesat.ai:80 {\n    handle /api/* {\n        reverse_proxy 127.0.0.1:3000\n    }\n}\n\n*.pesat.ai:443 {\n    handle /api/* {\n        reverse_proxy 127.0.0.1:3000\n    }\n}`;
  content += addition;

  await ssh.execCommand(`cat > /opt/pesat-control-plane/caddy/Caddyfile <<'EOF'\n${content}\nEOF`);

  // 3. Restart Caddy
  await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
  await new Promise(r => setTimeout(r, 3000));

  // 4. Test
  console.log('Testing /advisor/...');
  const test = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/advisor/ | head -10');
  console.log(test.stdout);

  console.log('Testing /api/health...');
  const health = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/api/health');
  console.log(health.stdout);

  ssh.dispose();
}

update();
