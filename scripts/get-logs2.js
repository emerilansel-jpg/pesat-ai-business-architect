import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function logs() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('Recent output logs:');
  const out = await ssh.execCommand('tail -n 50 /root/.pm2/logs/advisor-proxy-out.log');
  console.log(out.stdout || '(empty)');
  console.log('Recent error logs:');
  const err = await ssh.execCommand('tail -n 50 /root/.pm2/logs/advisor-proxy-error.log');
  console.log(err.stdout || '(empty)');
  console.log('Nginx error logs:');
  const nginx = await ssh.execCommand('tail -n 30 /var/log/nginx/error.log');
  console.log(nginx.stdout || '(empty)');
  ssh.dispose();
}

logs();
