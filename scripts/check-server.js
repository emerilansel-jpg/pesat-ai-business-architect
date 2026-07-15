import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Nginx process ===');
  const ps = await ssh.execCommand('ps aux | grep nginx');
  console.log(ps.stdout);
  console.log('=== Nginx binary ===');
  const which = await ssh.execCommand('which nginx');
  console.log(which.stdout);
  console.log('=== Nginx -t ===');
  const test = await ssh.execCommand('nginx -t 2>&1');
  console.log(test.stdout, test.stderr);
  console.log('=== Listen ports ===');
  const ports = await ssh.execCommand('ss -tlnp');
  console.log(ports.stdout);
  ssh.dispose();
}

check();
