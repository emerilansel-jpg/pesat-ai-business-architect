import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function read() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  const doc = await ssh.execCommand('cat /opt/pesat-control-plane/AGENT_API.md');
  console.log(doc.stdout);
  ssh.dispose();
}

read();
