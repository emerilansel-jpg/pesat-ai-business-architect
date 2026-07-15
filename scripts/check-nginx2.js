import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function checkNginx() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Nginx directory listing ===');
  const list = await ssh.execCommand('ls -la /etc/nginx/ /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null');
  console.log(list.stdout);
  console.log('\n=== Full nginx config files ===');
  const cat = await ssh.execCommand('find /etc/nginx/ -type f -name "*.conf" -exec echo "--- {} ---" \; -exec cat {} \;');
  console.log(cat.stdout);
  ssh.dispose();
}

checkNginx();
