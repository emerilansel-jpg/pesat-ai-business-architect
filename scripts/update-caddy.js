import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

const CADDY_ADDITION = `

# Manual deployment for apps.pesat.ai/advisor (legacy path)
apps.pesat.ai:80 {
    handle /api/* {
        reverse_proxy 127.0.0.1:3000
    }
    handle /advisor* {
        root * /var/www/advisor
        file_server
        try_files {path} /index.html
    }
    handle {
        root * /var/www/advisor
        file_server
        try_files {path} /index.html
    }
}

apps.pesat.ai:443 {
    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key
    handle /api/* {
        reverse_proxy 127.0.0.1:3000
    }
    handle /advisor* {
        root * /var/www/advisor
        file_server
        try_files {path} /index.html
    }
    handle {
        root * /var/www/advisor
        file_server
        try_files {path} /index.html
    }
}
`;

async function updateCaddy() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  // Backup current Caddyfile
  const backup = await ssh.execCommand('cp /opt/pesat-control-plane/caddy/Caddyfile /opt/pesat-control-plane/caddy/Caddyfile.bak.20260714');
  if (backup.stderr) console.log('Backup stderr:', backup.stderr);

  // Append the new config
  const append = await ssh.execCommand(`echo '${CADDY_ADDITION}' >> /opt/pesat-control-plane/caddy/Caddyfile`);
  if (append.stderr) console.log('Append stderr:', append.stderr);

  // Validate and reload Caddy
  const validate = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile');
  console.log('Validate:', validate.stdout, validate.stderr);

  if (validate.stdout.includes('valid') || validate.exitCode === 0) {
    const reload = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile');
    console.log('Reload:', reload.stdout, reload.stderr);
  }

  ssh.dispose();
}

updateCaddy();
