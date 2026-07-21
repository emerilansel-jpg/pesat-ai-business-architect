import { NodeSSH } from 'node-ssh';

const HOST = '148.230.103.98';
const USER = 'root';
const KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST_IP = '172.20.0.1';

const caddyfile = `{
    auto_https off
}

apps.pesat.ai:80 {
    @root_apps_80 path_regexp ^/$
    handle @root_apps_80 {
        redir * https://pesat.ai/advisor/ permanent
    }
    handle /advisor/* {
        redir https://pesat.ai{uri} permanent
    }
    handle /advisor {
        redir https://pesat.ai/advisor/ permanent
    }
    root * /builds/apps
    handle_path /api/* {
        reverse_proxy ${HOST_IP}:3002
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

*.pesat.ai:80 {
    root * /builds/{labels.2}
    handle_path /api/* {
        reverse_proxy ${HOST_IP}:3002
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

apps.pesat.ai:443 {
    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key
    @root_apps_443 path_regexp ^/$
    handle @root_apps_443 {
        redir * https://pesat.ai/advisor/ permanent
    }
    handle /advisor/* {
        redir https://pesat.ai{uri} permanent
    }
    handle /advisor {
        redir https://pesat.ai/advisor/ permanent
    }
    root * /builds/apps
    handle_path /api/* {
        reverse_proxy ${HOST_IP}:3002
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

*.pesat.ai:443 {
    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key
    root * /builds/{labels.2}
    handle_path /api/* {
        reverse_proxy ${HOST_IP}:3002
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

control.pesat.ai:80 {
    @api_post {
        method POST
        path /
    }
    route @api_post {
        reverse_proxy api:3000
    }

    handle /deploy {
        reverse_proxy api:3000
    }
    handle /health {
        reverse_proxy api:3000
    }
    handle /status/* {
        reverse_proxy api:3000
    }
    handle /v1/* {
        reverse_proxy api:3000
    }
    handle /bootstrap {
        reverse_proxy api:3000
    }
    handle /index.html {
        root * /opt/pesat-control-plane/admin
        file_server
    }
    handle {
        root * /opt/pesat-control-plane/admin
        file_server
        try_files {path} /universal.html
    }
}

control.pesat.ai:443 {
    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key
    @api_post {
        method POST
        path /
    }
    route @api_post {
        reverse_proxy api:3000
    }

    handle /deploy {
        reverse_proxy api:3000
    }
    handle /health {
        reverse_proxy api:3000
    }
    handle /status/* {
        reverse_proxy api:3000
    }
    handle /v1/* {
        reverse_proxy api:3000
    }
    handle /bootstrap {
        reverse_proxy api:3000
    }
    handle /index.html {
        root * /opt/pesat-control-plane/admin
        file_server
    }
    handle {
        root * /opt/pesat-control-plane/admin
        file_server
        try_files {path} /universal.html
    }
}

pesat.ai:80 {
    @root_pesat_80 path_regexp ^/$
    handle @root_pesat_80 {
        redir * /advisor/ permanent
    }
    root * /builds/apps
    handle_path /api/* {
        reverse_proxy ${HOST_IP}:3002
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

pesat.ai:443 {
    tls /opt/pesat-control-plane/certs/origin.crt /opt/pesat-control-plane/certs/origin.key
    @root_pesat_443 path_regexp ^/$
    handle @root_pesat_443 {
        redir * /advisor/ permanent
    }
    root * /builds/apps
    handle_path /api/* {
        reverse_proxy ${HOST_IP}:3002
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

  await ssh.execCommand(`cat > /opt/pesat-control-plane/caddy/Caddyfile <<'EOF'\n${caddyfile}\nEOF`);

  const validate = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile');
  console.log(validate.stdout);
  if (validate.stderr) console.error(validate.stderr);
  if (validate.code !== 0) {
    throw new Error('Caddy validation failed');
  }

  await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
  console.log('Caddyfile rewritten with correct root redirects');
  ssh.dispose();
}

main().catch(err => { console.error(err); process.exit(1); });
