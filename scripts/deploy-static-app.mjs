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
  // Caddy volume path on host
  remoteBuildsBase: '/var/lib/docker/volumes/pesat-control-plane_builds/_data',
};

function printUsage() {
  console.log('Usage: node scripts/deploy-static-app.mjs <app-name> <local-folder> [domain]');
  console.log('  app-name      Unique app identifier (e.g. ninjago, games, landing)');
  console.log('  local-folder  Path to the built static files on this machine');
  console.log('  domain        Optional: subdomain to serve on (default: apps.pesat.ai)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/deploy-static-app.mjs ninjago D:/projects/ninjago/dist');
  console.log('  node scripts/deploy-static-app.mjs landing D:/projects/landing/dist apps.pesat.ai');
  process.exit(1);
}

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
  await runCommand('node', [path.join(__dirname, 'backup-vps.mjs'), 'backup']);
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

async function deployStaticApp(appName, localFolder, domain) {
  if (!appName || !localFolder) {
    printUsage();
  }
  const absLocalFolder = path.resolve(localFolder);
  if (!fs.existsSync(absLocalFolder)) {
    throw new Error(`Local folder not found: ${absLocalFolder}`);
  }
  const stat = fs.statSync(absLocalFolder);
  if (!stat.isDirectory()) {
    throw new Error(`Local path is not a directory: ${absLocalFolder}`);
  }

  // Determine remote folder
  // For apps.pesat.ai/<appName>/ -> /builds/apps/<appName>/
  // For subdomain -> /builds/<appName>/
  const isSubdomain = domain && domain !== 'apps.pesat.ai';
  const remoteFolder = isSubdomain
    ? `${CONFIG.remoteBuildsBase}/${appName}`
    : `${CONFIG.remoteBuildsBase}/apps/${appName}`;

  await backup();

  const ssh = await connect();
  try {
    console.log(`\nDeploying '${appName}' from ${absLocalFolder} -> ${remoteFolder}`);
    await ssh.execCommand(`mkdir -p ${remoteFolder}`);

    await ssh.putDirectory(absLocalFolder, remoteFolder, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => {
        const base = path.basename(itemPath);
        return base !== 'node_modules' && base !== '.git';
      },
    });

    console.log('Upload complete.');

    if (isSubdomain) {
      console.log(`\nServed at: https://${domain}/`);
    } else {
      console.log(`\nServed at: https://apps.pesat.ai/${appName}/`);
      // If this is the landing page for apps.pesat.ai, also copy index.html to /builds/apps/
      if (appName === 'landing') {
        console.log('App is named "landing"; copying index.html to /builds/apps/index.html as apps root.');
        await ssh.execCommand(`cp ${remoteFolder}/index.html ${CONFIG.remoteBuildsBase}/apps/index.html`);
      }
    }
  } finally {
    ssh.dispose();
  }
}

async function main() {
  const [appName, localFolder, domain] = process.argv.slice(2);
  await deployStaticApp(appName, localFolder, domain);
}

main().catch((err) => {
  console.error('\nDeploy failed:', err.message);
  process.exit(1);
});
