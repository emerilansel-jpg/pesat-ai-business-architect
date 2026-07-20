import { NodeSSH } from 'node-ssh';

const HOST = '148.230.103.98';
const USER = 'root';
const KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';

const BLOCK80 = `apps.pesat.ai:80 {
    handle /advisor/* {
        redir https://pesat.ai{uri} permanent
    }
    handle /advisor {
        redir https://pesat.ai/advisor/ permanent
    }
    root * /builds/apps
    handle_path /api/* {
        reverse_proxy 172.20.0.1:3002
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

`;

const BLOCK443 = `apps.pesat.ai:443 {
    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key
    handle /advisor/* {
        redir https://pesat.ai{uri} permanent
    }
    handle /advisor {
        redir https://pesat.ai/advisor/ permanent
    }
    root * /builds/apps
    handle_path /api/* {
        reverse_proxy 172.20.0.1:3002
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

`;

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: KEY });

  const current = await ssh.execCommand('cat /opt/pesat-control-plane/caddy/Caddyfile');
  let content = current.stdout;

  if (content.includes('apps.pesat.ai:80')) {
    console.log('apps.pesat.ai redirect block already exists');
    ssh.dispose();
    return;
  }

  content = content.replace('*.pesat.ai:80 {', BLOCK80 + '*.pesat.ai:80 {');
  content = content.replace('*.pesat.ai:443 {', BLOCK443 + '*.pesat.ai:443 {');

  await ssh.execCommand(`cat > /opt/pesat-control-plane/caddy/Caddyfile <<'EOF'\n${content}\nEOF`);

  const validate = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile');
  console.log(validate.stdout);
  if (validate.stderr) console.error(validate.stderr);

  await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
  console.log('Caddy restarted with apps.pesat.ai redirect');
  ssh.dispose();
}

main().catch(err => { console.error(err); process.exit(1); });
