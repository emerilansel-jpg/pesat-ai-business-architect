import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  host: '148.230.103.98',
  username: 'root',
  privateKeyPath: 'C:/Users/User/.ssh/pesat_deploy_rsa',
  localProject: path.resolve(__dirname, '..'),
  localDist: path.resolve(__dirname, '..', 'dist'),
  localProxy: path.resolve(__dirname, 'advisor-proxy.js'),
  remoteBuildDir: '/var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor',
  remoteProxy: '/var/www/advisor-proxy.js',
  localConfigStore: path.resolve(__dirname, '..', 'server', 'configStore.cjs'),
  remoteConfigStore: '/var/www/advisor-configStore.cjs',
  apiPort: 3002,
  healthPaths: [
    { url: 'https://pesat.ai/advisor/', expected: 'Pesat AI Business Architect' },
    { url: 'https://pesat.ai/advisor/api/health', expected: '' },
  ],
};

function runCommand(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, ...options });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`Command failed with code ${code}`));
      else resolve();
    });
  });
}

async function backup() {
  console.log('Running pre-deploy backup...');
  const backupScript = path.join(__dirname, 'backup-vps.mjs');
  await runCommand('node', [`"${backupScript}"`, 'backup']);
}

async function connect() {
  const ssh = new NodeSSH();
  if (!fs.existsSync(CONFIG.privateKeyPath)) {
    throw new Error(`SSH key not found at ${CONFIG.privateKeyPath}`);
  }
  await ssh.connect({
    host: CONFIG.host,
    username: CONFIG.username,
    privateKeyPath: CONFIG.privateKeyPath,
  });
  return ssh;
}

async function detectDockerHostIp(ssh) {
  const result = await ssh.execCommand(
    "docker exec pesat-control-plane-caddy-1 ip route | awk '/default/ {print $3}'"
  );
  const ip = result.stdout.trim().split('/')[0].split(' ')[0] || '172.20.0.1';
  console.log('Docker host IP:', ip);
  return ip;
}

async function deployAdvisor() {
  // Optional: auto-build if dist is missing or stale
  if (!fs.existsSync(CONFIG.localDist)) {
    console.log('dist/ missing; running npm run build...');
    await runCommand('npm', ['run', 'build'], {
      cwd: CONFIG.localProject,
      env: { ...process.env, VITE_BASE_PATH: '/advisor/' },
    });
  }
  if (!fs.existsSync(CONFIG.localProxy)) {
    throw new Error(`Proxy file missing: ${CONFIG.localProxy}`);
  }

  await backup();

  const ssh = await connect();
  try {
    console.log('\n[1/5] Ensuring remote build directory exists...');
    await ssh.execCommand(`mkdir -p ${CONFIG.remoteBuildDir}`);

    console.log('[2/5] Uploading dist/ (only advisor folder)...');
    await ssh.putDirectory(CONFIG.localDist, CONFIG.remoteBuildDir, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => {
        const base = path.basename(itemPath);
        return base !== 'node_modules' && base !== '.git';
      },
    });

    console.log('[3/5] Uploading proxy...');
    const tempProxyPath = path.join(__dirname, '..', 'dist', 'advisor-proxy-prod.js');
    let proxySource = fs.readFileSync(CONFIG.localProxy, 'utf8');
    proxySource = proxySource.replace(
      "require('../server/configStore.cjs')",
      "require('./advisor-configStore.cjs')"
    );
    fs.writeFileSync(tempProxyPath, proxySource);
    await ssh.putFile(tempProxyPath, CONFIG.remoteProxy);
    fs.unlinkSync(tempProxyPath);
    console.log('  Proxy uploaded.');

    console.log('[3.5/5] Uploading config store helper...');
    await ssh.putFile(CONFIG.localConfigStore, CONFIG.remoteConfigStore);
    console.log('  Helper uploaded.');

    console.log('[4/5] Managing proxy service with PM2...');
    const pm2Status = await ssh.execCommand('pm2 describe advisor-proxy');
    if (pm2Status.stdout.toLowerCase().includes('online')) {
      await ssh.execCommand('pm2 restart advisor-proxy');
      console.log('  Proxy restarted.');
    } else {
      await ssh.execCommand(`pm2 start ${CONFIG.remoteProxy} --name advisor-proxy`);
      console.log('  Proxy started.');
    }
    await ssh.execCommand('pm2 save');

    console.log('[5/5] Verifying proxy health...');
    const hostIp = await detectDockerHostIp(ssh);
    const health = await ssh.execCommand(`curl -s http://${hostIp}:${CONFIG.apiPort}/health`);
    console.log('  Health:', health.stdout.trim() || health.stderr.trim());

    console.log('\nDeployment complete!');
    console.log('  App: https://pesat.ai/advisor/');
    console.log('  Admin: https://pesat.ai/advisor/admin');
    console.log('  Version: https://pesat.ai/advisor/version');
  } finally {
    ssh.dispose();
  }
}

async function verify() {
  console.log('\nRunning post-deploy health checks...');
  const results = [];
  for (const check of CONFIG.healthPaths) {
    try {
      const res = await fetch(check.url);
      const body = await res.text();
      const ok = check.expected ? body.includes(check.expected) : res.ok;
      results.push({ url: check.url, ok, status: res.status });
      console.log(`  ${ok ? '✅' : '❌'} ${check.url} (${res.status})`);
    } catch (err) {
      results.push({ url: check.url, ok: false, error: err.message });
      console.log(`  ❌ ${check.url} (${err.message})`);
    }
  }
  const allOk = results.every((r) => r.ok);
  if (!allOk) {
    throw new Error('One or more health checks failed. Check output above.');
  }
  console.log('All health checks passed.');
}

async function main() {
  await deployAdvisor();
  await verify();
}

main().catch((err) => {
  console.error('\nDeploy failed:', err.message);
  process.exit(1);
});
