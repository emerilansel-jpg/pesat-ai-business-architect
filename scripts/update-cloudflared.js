import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function update() {
  await ssh.connect({ host: HOST, username: USER, privateKeyPath: REMOTE_KEY });

  const config = `tunnel: 8028f70d-58c4-4d80-87bb-0cd24d5a045a
credentials-file: /root/.cloudflared/8028f70d-58c4-4d80-87bb-0cd24d5a045a.json

ingress:
  - hostname: apps.pesat.ai
    service: http://127.0.0.1:80
  - hostname: tracelinker.com
    service: http://127.0.0.1:8080
  - hostname: www.tracelinker.com
    service: http://127.0.0.1:8080
  - service: http_status:404
`;

  await ssh.execCommand(`cat > /root/.cloudflared/config.yml <<'EOF'\n${config}EOF`);

  // Restart cloudflared using systemctl or pkill
  await ssh.execCommand('pkill -f "cloudflared tunnel" || true');
  await new Promise(r => setTimeout(r, 2000));
  await ssh.execCommand('nohup /usr/local/bin/cloudflared tunnel --config /root/.cloudflared/config.yml run 8028f70d-58c4-4d80-87bb-0cd24d5a045a > /var/log/cloudflared.log 2>&1 &');
  await new Promise(r => setTimeout(r, 5000));

  // Check
  const ps = await ssh.execCommand('ps aux | grep cloudflared');
  console.log(ps.stdout);

  ssh.dispose();
}

update();
