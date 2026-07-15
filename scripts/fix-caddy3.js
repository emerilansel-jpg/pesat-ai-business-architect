import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function fix() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  // Read current Caddyfile
  const current = await ssh.execCommand('cat /opt/pesat-control-plane/caddy/Caddyfile');
  let content = current.stdout;

  // Remove the API reverse proxy addition I added
  const marker = '# API reverse proxy for *.pesat.ai';
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    content = content.slice(0, idx).trimEnd();
  }

  // Update the wildcard blocks to add /api reverse proxy inside them
  content = content.replace(
    '*.pesat.ai:80 {\n    root * /builds/{labels.2}\n    file_server\n    try_files {path} /index.html\n}',
    '*.pesat.ai:80 {\n    handle /api/* {\n        reverse_proxy 127.0.0.1:3000\n    }\n    root * /builds/{labels.2}\n    file_server\n    try_files {path} /index.html\n}'
  );
  content = content.replace(
    '*.pesat.ai:443 {\n    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key\n    root * /builds/{labels.2}\n    file_server\n    try_files {path} /index.html\n}',
    '*.pesat.ai:443 {\n    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key\n    handle /api/* {\n        reverse_proxy 127.0.0.1:3000\n    }\n    root * /builds/{labels.2}\n    file_server\n    try_files {path} /index.html\n}'
  );

  await ssh.execCommand(`cat > /opt/pesat-control-plane/caddy/Caddyfile <<'EOF'\n${content}\nEOF`);

  // Start Caddy container
  await ssh.execCommand('docker start pesat-control-plane-caddy-1');
  await new Promise(r => setTimeout(r, 3000));

  // Test
  console.log('Testing /advisor/...');
  const test = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/advisor/ | head -10');
  console.log(test.stdout || '(empty)');

  console.log('Testing /api/health...');
  const health = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/api/health');
  console.log(health.stdout || '(empty)');

  ssh.dispose();
}

fix();
