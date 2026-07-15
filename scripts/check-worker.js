import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  const ps = await ssh.execCommand('docker ps --filter name=pesat-control-plane --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
  console.log(ps.stdout);
  ssh.dispose();
}

check();
