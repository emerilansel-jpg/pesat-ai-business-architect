import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function checkNginx() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Nginx config for apps.pesat.ai ===');
  const sites = await ssh.execCommand('grep -R "client_max_body_size\|apps.pesat.ai\|/api\|/advisor" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ /etc/nginx/nginx.conf 2>/dev/null');
  console.log(sites.stdout);
  console.log('\n=== Default client_max_body_size ===');
  const size = await ssh.execCommand('grep -R "client_max_body_size" /etc/nginx/ 2>/dev/null');
  console.log(size.stdout || '(not set, default 1MB)');
  ssh.dispose();
}

checkNginx();
