import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function restart() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('PM2 status:');
  const status = await ssh.execCommand('pm2 status');
  console.log(status.stdout);
  console.log('Restarting advisor-proxy...');
  const restart = await ssh.execCommand('pm2 restart advisor-proxy');
  console.log(restart.stdout);
  if (restart.stderr) console.error(restart.stderr);
  console.log('Waiting for restart...');
  await new Promise(r => setTimeout(r, 2000));
  const health = await ssh.execCommand('curl -s http://localhost:3002/health');
  console.log('Health:', health.stdout);
  ssh.dispose();
}

restart();
