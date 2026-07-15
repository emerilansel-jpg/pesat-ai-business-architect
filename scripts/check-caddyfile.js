import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== /opt/pesat-control-plane/caddy/Caddyfile ===');
  const caddyfile = await ssh.execCommand('cat /opt/pesat-control-plane/caddy/Caddyfile');
  console.log(caddyfile.stdout);
  console.log('\n=== ls /opt/pesat-control-plane ===');
  const ls = await ssh.execCommand('ls -la /opt/pesat-control-plane/');
  console.log(ls.stdout);
  ssh.dispose();
}

check();
