import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function checkDocker() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Docker containers ===');
  const ps = await ssh.execCommand('docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"');
  console.log(ps.stdout);
  console.log('\n=== Nginx container config ===');
  const nginx = await ssh.execCommand('docker exec $(docker ps -q -f name=nginx) cat /etc/nginx/conf.d/default.conf 2>/dev/null || docker exec $(docker ps -q -f name=nginx) cat /etc/nginx/nginx.conf 2>/dev/null');
  console.log(nginx.stdout);
  ssh.dispose();
}

checkDocker();
