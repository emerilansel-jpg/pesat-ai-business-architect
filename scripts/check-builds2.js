import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== /builds ===');
  const ls = await ssh.execCommand('ls -la /builds/ 2>/dev/null');
  console.log(ls.stdout);
  console.log('\n=== /builds/apps ===');
  const apps = await ssh.execCommand('ls -la /builds/apps/ 2>/dev/null');
  console.log(apps.stdout);
  console.log('\n=== /builds/apps/index.html ===');
  const idx = await ssh.execCommand('head -5 /builds/apps/index.html 2>/dev/null');
  console.log(idx.stdout || '(not found)');
  ssh.dispose();
}

check();
