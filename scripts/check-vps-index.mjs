import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
await ssh.connect({
  host: '148.230.103.98',
  username: 'root',
  privateKeyPath: 'C:/Users/User/.ssh/pesat_deploy_rsa',
});

const result = await ssh.execCommand(
  "grep -oE 'assets/index-[a-zA-Z0-9]+\\.js' /var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor/index.html"
);
console.log('VPS index.html bundle:', result.stdout.trim());
console.log('STDERR:', result.stderr.trim());

ssh.dispose();
