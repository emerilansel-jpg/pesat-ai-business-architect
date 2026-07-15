import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

const CADDY_BLOCK = `
# Manual deployment for apps.pesat.ai/advisor (legacy path)
apps.pesat.ai:80 {
    handle /api/* {
        reverse_proxy 127.0.0.1:3000
    }
    handle_path /advisor* {
        root * /var/www/advisor
        file_server
        try_files {path} /index.html
    }
    handle {
        respond "apps placeholder" 200
    }
}

apps.pesat.ai:443 {
    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key
    handle /api/* {
        reverse_proxy 127.0.0.1:3000
    }
    handle_path /advisor* {
        root * /var/www/advisor
        file_server
        try_files {path} /index.html
    }
    handle {
        respond "apps placeholder" 200
    }
}
`;

async function updateCaddy() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  // Read current Caddyfile and remove old manual block
  const current = await ssh.execCommand('cat /opt/pesat-control-plane/caddy/Caddyfile');
  let content = current.stdout;
  const marker = '# Manual deployment for apps.pesat.ai/advisor (legacy path)';
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    content = content.slice(0, idx).trimEnd();
  }
  content += '\n\n' + CADDY_BLOCK.trim();

  // Write new Caddyfile
  await ssh.execCommand(`cat > /opt/pesat-control-plane/caddy/Caddyfile <<'EOF'\n${content}\nEOF`);

  // Restart Caddy
  await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
  await new Promise(r => setTimeout(r, 3000));

  // Test
  const test = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/advisor/ | head -10');
  console.log('Test response:', test.stdout);

  ssh.dispose();
}

updateCaddy();
