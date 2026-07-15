import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Caddy container network ===');
  const network = await ssh.execCommand('docker inspect -f "{{json .NetworkSettings.Networks}}" pesat-control-plane-caddy-1');
  console.log(JSON.stringify(JSON.parse(network.stdout || '{}'), null, 2));
  console.log('\n=== Host IP from container ===');
  const ip = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 sh -c "ip route | grep default"');
  console.log(ip.stdout || ip.stderr);
  console.log('\n=== Test proxy from container ===');
  const test = await ssh.execCommand('docker exec pesat-control-plane-caddy-1 curl -s http://host.docker.internal:3000/health || docker exec pesat-control-plane-caddy-1 curl -s http://172.17.0.1:3000/health || echo "both failed"');
  console.log(test.stdout || test.stderr);
  ssh.dispose();
}

check();
