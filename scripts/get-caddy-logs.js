import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function logs() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  const logs = await ssh.execCommand('docker logs --tail 30 pesat-control-plane-caddy-1');
  console.log(logs.stdout || logs.stderr);
  ssh.dispose();
}

logs();
