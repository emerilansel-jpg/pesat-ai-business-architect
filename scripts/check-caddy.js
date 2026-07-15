import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function checkCaddy() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Caddy config ===');
  const config = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 cat /etc/caddy/Caddyfile 2>/dev/null');
  console.log(config.stdout);
  console.log('\n=== Caddy adapters ===');
  const adapters = await ssh.execCommand('find / -name "Caddyfile*" 2>/dev/null | head -20');
  console.log(adapters.stdout);
  ssh.dispose();
}

checkCaddy();
