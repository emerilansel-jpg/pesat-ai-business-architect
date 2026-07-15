import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Caddy container mounts ===');
  const mounts = await ssh.execCommand('docker inspect -f "{{json .Mounts}}" pesat-control-plane-caddy-1');
  console.log(JSON.stringify(JSON.parse(mounts.stdout || '[]'), null, 2));
  console.log('\n=== Caddy container /builds/apps ===');
  const builds = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 ls -la /builds/apps/ 2>/dev/null');
  console.log(builds.stdout || builds.stderr);
  console.log('\n=== Caddy container /var/www ===');
  const www = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 ls -la /var/www/ 2>/dev/null');
  console.log(www.stdout || www.stderr);
  ssh.dispose();
}

check();
