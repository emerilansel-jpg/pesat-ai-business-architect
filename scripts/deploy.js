import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ssh = new NodeSSH();

const LOCAL_PROJECT = path.resolve(__dirname, '..');
const LOCAL_DIST = path.join(LOCAL_PROJECT, 'dist');
const LOCAL_PROXY = path.join(LOCAL_PROJECT, 'scripts', 'advisor-proxy.js');
const REMOTE_DIR = '/var/www/advisor';
const REMOTE_PROXY = '/var/www/advisor-proxy.js';
const REMOTE_KEY = 'C:/Users/User/.ssh/pesat_deploy_rsa';
const HOST = '148.230.103.98';
const USER = 'root';

async function deploy() {
  try {
    if (!fs.existsSync(LOCAL_DIST)) {
      throw new Error(`dist folder not found at ${LOCAL_DIST}. Run npm run build first.`);
    }
    if (!fs.existsSync(LOCAL_PROXY)) {
      throw new Error(`proxy file not found at ${LOCAL_PROXY}`);
    }
    if (!fs.existsSync(REMOTE_KEY)) {
      throw new Error(`SSH key not found at ${REMOTE_KEY}`);
    }

    console.log(`Connecting to ${HOST} as ${USER}...`);
    await ssh.connect({
      host: HOST,
      username: USER,
      privateKeyPath: REMOTE_KEY,
    });

    console.log('Uploading dist/ to', REMOTE_DIR, '...');
    await ssh.putDirectory(LOCAL_DIST, REMOTE_DIR, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => {
        const baseName = path.basename(itemPath);
        return baseName !== 'node_modules' && baseName !== '.git';
      },
    });

    console.log('Uploading proxy to', REMOTE_PROXY, '...');
    await ssh.putFile(LOCAL_PROXY, REMOTE_PROXY);

    console.log('Checking proxy status...');
    const pm2Status = await ssh.execCommand('pm2 describe advisor-proxy');
    if (pm2Status.stdout.toLowerCase().includes('online')) {
      console.log('Restarting advisor-proxy via PM2...');
      await ssh.execCommand('pm2 restart advisor-proxy');
    } else {
      console.log('Starting advisor-proxy via PM2...');
      await ssh.execCommand(`pm2 start ${REMOTE_PROXY} --name advisor-proxy`);
    }

    console.log('Saving PM2 process list...');
    await ssh.execCommand('pm2 save');

    console.log('Verifying health endpoint...');
    const health = await ssh.execCommand('curl -s http://localhost:3002/health');
    console.log('Health:', health.stdout.trim() || health.stderr);

    console.log('\nDeployment complete!');
    console.log('Production URL: https://apps.pesat.ai/advisor/');
    console.log('Admin URL: https://apps.pesat.ai/advisor/admin');
  } catch (err) {
    console.error('Deployment failed:', err.message);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deploy();
