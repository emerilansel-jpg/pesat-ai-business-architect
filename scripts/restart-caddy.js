import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function restart() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('Restarting Caddy...');
  const restart = await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
  console.log(restart.stdout, restart.stderr);
  await new Promise(r => setTimeout(r, 3000));
  const test = await ssh.execCommand('curl -s -H "Host: apps.pesat.ai" http://148.230.103.98/advisor/ | head -5');
  console.log('Test response:', test.stdout);
  ssh.dispose();
}

restart();
