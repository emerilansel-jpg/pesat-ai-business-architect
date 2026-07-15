import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Caddy container inspect ===');
  const inspect = await ssh.execCommand('docker inspect pesat-control-plane-caddy-1 --format "{{json .Config}}"');
  const config = JSON.parse(inspect.stdout || '{}');
  console.log('Cmd:', config.Cmd);
  console.log('Volumes:', JSON.stringify(config.Volumes, null, 2));
  console.log('HostConfig Binds:', JSON.stringify(config.HostConfig?.Binds, null, 2));
  console.log('\n=== Caddyfile path ===');
  const find = await ssh.execCommand('find / -name "Caddyfile" 2>/dev/null');
  console.log(find.stdout);
  console.log('\n=== Caddy container logs ===');
  const logs = await ssh.execCommand('docker logs --tail 20 pesat-control-plane-caddy-1');
  console.log(logs.stdout);
  ssh.dispose();
}

check();
