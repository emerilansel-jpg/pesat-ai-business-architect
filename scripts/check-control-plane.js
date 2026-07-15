import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== .env ===');
  const env = await ssh.execCommand('cat /opt/pesat-control-plane/.env');
  console.log(env.stdout);
  console.log('\n=== DB projects ===');
  const projects = await ssh.execCommand('docker exec pesat-control-plane-postgres-1 psql -U postgres -c "SELECT * FROM projects;" 2>/dev/null');
  console.log(projects.stdout || projects.stderr);
  ssh.dispose();
}

check();
