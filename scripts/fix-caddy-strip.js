import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function fix() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  const current = await ssh.execCommand('cat /opt/pesat-control-plane/caddy/Caddyfile');
  let content = current.stdout;

  // Replace wildcard blocks with handle_path for /api to strip prefix
  content = content.replace(
    '*.pesat.ai:80 {\n    root * /builds/{labels.2}\n    route {\n        handle /api* {\n            reverse_proxy 172.20.0.1:3002\n        }\n        try_files {path} /index.html\n        file_server\n    }\n}',
    '*.pesat.ai:80 {\n    root * /builds/{labels.2}\n    route {\n        handle_path /api* {\n            reverse_proxy 172.20.0.1:3002\n        }\n        try_files {path} /index.html\n        file_server\n    }\n}'
  );
  content = content.replace(
    '*.pesat.ai:443 {\n    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key\n    root * /builds/{labels.2}\n    route {\n        handle /api* {\n            reverse_proxy 172.20.0.1:3002\n        }\n        try_files {path} /index.html\n        file_server\n    }\n}',
    '*.pesat.ai:443 {\n    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key\n    root * /builds/{labels.2}\n    route {\n        handle_path /api* {\n            reverse_proxy 172.20.0.1:3002\n        }\n        try_files {path} /index.html\n        file_server\n    }\n}'
  );

  await ssh.execCommand(`cat > /opt/pesat-control-plane/caddy/Caddyfile <<'EOF'\n${content}\nEOF`);

  const validate = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile');
  console.log('Validate:', validate.stdout || validate.stderr);

  if (validate.exitCode === 0) {
    await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('Testing /api/health...');
  const health = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/api/health');
  console.log(health.stdout);

  console.log('Testing /api/chat...');
  const chat = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/api/health');
  console.log(chat.stdout);

  console.log('Testing /advisor/...');
  const test = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/advisor/ | head -5');
  console.log(test.stdout);

  ssh.dispose();
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
