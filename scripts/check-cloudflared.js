import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function check() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });
  console.log('=== Cloudflared process ===');
  const ps = await ssh.execCommand('ps aux | grep cloudflared');
  console.log(ps.stdout);
  console.log('\n=== Cloudflared tunnel info ===');
  const info = await ssh.execCommand('cloudflared tunnel info d55dadca-0c49-4fc3-8f8b-17dd5ec2197c 2>/dev/null || echo "command failed"');
  console.log(info.stdout || info.stderr);
  console.log('\n=== Cloudflared config ===');
  const config = await ssh.execCommand('find / -name "*.json" -path "*cloudflared*" 2>/dev/null | head -5');
  console.log(config.stdout);
  ssh.dispose();
}

check();
