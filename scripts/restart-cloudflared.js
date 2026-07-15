import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function restart() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  // Kill all cloudflared
  await ssh.execCommand('pkill -9 -f cloudflared || true');
  await new Promise(r => setTimeout(r, 3000));

  // Route DNS
  const route = await ssh.execCommand('cloudflared tunnel route dns 8028f70d-58c4-4d80-87bb-0cd24d5a045a apps.pesat.ai 2>&1 || true');
  console.log('Route DNS:', route.stdout || route.stderr);

  // Start fresh
  await ssh.execCommand('nohup /usr/local/bin/cloudflared tunnel --config /root/.cloudflared/config.yml run 8028f70d-58c4-4d80-87bb-0cd24d5a045a > /var/log/cloudflared.log 2>&1 &');
  await new Promise(r => setTimeout(r, 5000));

  const logs = await ssh.execCommand('tail -n 30 /var/log/cloudflared.log');
  console.log(logs.stdout);

  ssh.dispose();
}

restart();
