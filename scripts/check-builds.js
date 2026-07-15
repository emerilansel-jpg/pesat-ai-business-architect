import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== /builds/apps ===');
  const builds = await ssh.execCommand('ls -la /builds/apps/ 2>/dev/null');
  console.log(builds.stdout || builds.stderr);
  console.log('\n=== /var/www/advisor ===');
  const www = await ssh.execCommand('ls -la /var/www/advisor/ 2>/dev/null');
  console.log(www.stdout || www.stderr);
  console.log('\n=== Caddy config reload ===');
  const caddy = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 caddy list-modules 2>/dev/null | head -5');
  console.log(caddy.stdout || caddy.stderr);
  ssh.dispose();
}

check();
