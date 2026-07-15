import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Caddy running config ===');
  const config = await ssh.execCommand('curl -s http://localhost:2019/config/');
  console.log(config.stdout.slice(0, 5000));
  ssh.dispose();
}

check();
