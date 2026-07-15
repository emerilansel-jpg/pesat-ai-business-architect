import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function logs() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  const result = await ssh.execCommand('pm2 logs advisor-proxy --lines 50 --nostream');
  console.log(result.stdout);
  if (result.stderr) console.error('STDERR:', result.stderr);
  ssh.dispose();
}

logs();
