import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== /builds/apps/index.html content ===');
  const idx = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 cat /builds/apps/index.html');
  console.log(idx.stdout);
  console.log('\n=== /builds/apps directory ===');
  const ls = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 find /builds/apps -type f');
  console.log(ls.stdout);
  console.log('\n=== Host volume path ===');
  const vol = await ssh.execCommand('ls -la /var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/');
  console.log(vol.stdout);
  ssh.dispose();
}

check();
