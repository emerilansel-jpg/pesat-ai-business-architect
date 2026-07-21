import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  host: '148.230.103.98',
  username: 'root',
  privateKeyPath: 'C:/Users/User/.ssh/pesat_deploy_rsa',
  remoteBackupBase: '/root/backups',
  // What to back up before any infra change
  paths: [
    '/opt/pesat-control-plane/caddy/Caddyfile',
    '/opt/pesat-control-plane/docker-compose.yml',
    '/var/lib/docker/volumes/pesat-control-plane_builds/_data',
    '/var/lib/docker/volumes/pesat-control-plane_caddy_data/_data',
  ],
};

const MODES = ['backup', 'list', 'restore'];

function printUsage() {
  console.log('Usage: node scripts/backup-vps.mjs [backup|list|restore <timestamp>]');
  console.log('  backup        Create a new backup of VPS config + builds');
  console.log('  list          List available backups');
  console.log('  restore <ts>  Restore from a backup (timestamp folder name)');
  process.exit(1);
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

async function createBackup() {
  const ssh = await connect();
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = `${CONFIG.remoteBackupBase}/pesat-vps-${timestamp}`;

    console.log(`Creating backup at ${backupDir} ...`);
    await ssh.execCommand(`mkdir -p ${backupDir}`);

    for (const p of CONFIG.paths) {
      const base = path.basename(p);
      const target = `${backupDir}/${base}`;
      const stat = await ssh.execCommand(`test -e ${p} && echo EXISTS || echo MISSING`);
      if (stat.stdout.trim() === 'MISSING') {
        console.log(`  SKIP (missing) ${p}`);
        continue;
      }
      console.log(`  BACKUP ${p} -> ${target}`);
      const isDir = await ssh.execCommand(`test -d ${p} && echo DIR || echo FILE`);
      if (isDir.stdout.trim() === 'DIR') {
        await ssh.execCommand(`cp -a ${p} ${target}`);
      } else {
        await ssh.execCommand(`cp -a ${p} ${target}`);
      }
    }

    // Save a manifest with the current date and versions
    const manifest = `${backupDir}/manifest.json`;
    const manifestData = {
      createdAt: timestamp,
      createdBy: 'backup-vps.mjs',
      paths: CONFIG.paths,
      hostname: CONFIG.host,
    };
    await ssh.execCommand(
      `cat > ${manifest} <<'EOF'\n${JSON.stringify(manifestData, null, 2)}\nEOF`
    );

    const ls = await ssh.execCommand(`ls -la ${backupDir}`);
    console.log('\nBackup created successfully. Contents:');
    console.log(ls.stdout);
    console.log(`\nTo restore later, run:\n  node scripts/backup-vps.mjs restore pesat-vps-${timestamp}`);
    return backupDir;
  } finally {
    ssh.dispose();
  }
}

async function listBackups() {
  const ssh = await connect();
  try {
    const result = await ssh.execCommand(`ls -1td ${CONFIG.remoteBackupBase}/pesat-vps-* 2>/dev/null || echo NONE`);
    if (result.stdout.trim() === 'NONE') {
      console.log('No backups found.');
      return;
    }
    const lines = result.stdout.trim().split('\n');
    console.log(`Found ${lines.length} backup(s):\n`);
    for (const line of lines) {
      const size = await ssh.execCommand(`du -sh ${line} | cut -f1`);
      const manifest = await ssh.execCommand(`test -f ${line}/manifest.json && cat ${line}/manifest.json || echo '{}'`);
      let m = {};
      try { m = JSON.parse(manifest.stdout); } catch {}
      console.log(`  ${path.basename(line)}  (${size.stdout.trim()})  ${m.createdAt || ''}`);
    }
  } finally {
    ssh.dispose();
  }
}

async function restoreBackup(timestamp) {
  const ssh = await connect();
  try {
    const backupDir = `${CONFIG.remoteBackupBase}/${timestamp}`;
    const check = await ssh.execCommand(`test -d ${backupDir} && echo EXISTS || echo MISSING`);
    if (check.stdout.trim() === 'MISSING') {
      throw new Error(`Backup ${backupDir} not found. Run 'list' to see available backups.`);
    }

    console.log(`WARNING: This will overwrite live VPS state from ${backupDir}`);
    // In a non-interactive environment, we require a --confirm flag or env var
    if (process.argv.includes('--confirm') || process.env.BACKUP_RESTORE_CONFIRM === 'yes') {
      console.log('Confirmation accepted. Restoring...');
    } else {
      console.log('Aborted. Add --confirm or set BACKUP_RESTORE_CONFIRM=yes to restore.');
      process.exit(1);
    }

    for (const p of CONFIG.paths) {
      const base = path.basename(p);
      const source = `${backupDir}/${base}`;
      const checkSource = await ssh.execCommand(`test -e ${source} && echo EXISTS || echo MISSING`);
      if (checkSource.stdout.trim() === 'MISSING') {
        console.log(`  SKIP (not in backup) ${source}`);
        continue;
      }
      console.log(`  RESTORE ${source} -> ${p}`);
      const isDir = await ssh.execCommand(`test -d ${source} && echo DIR || echo FILE`);
      if (isDir.stdout.trim() === 'DIR') {
        await ssh.execCommand(`rm -rf ${p} && cp -a ${source} ${p}`);
      } else {
        await ssh.execCommand(`cp -a ${source} ${p}`);
      }
    }

    console.log('\nRestore complete. Restarting Caddy...');
    await ssh.execCommand('docker restart pesat-control-plane-caddy-1');
    console.log('Caddy restarted. Verify URLs with: node scripts/health-check.mjs');
  } finally {
    ssh.dispose();
  }
}

async function main() {
  const mode = process.argv[2] || 'backup';
  if (!MODES.includes(mode)) {
    printUsage();
  }

  if (mode === 'backup') {
    await createBackup();
  } else if (mode === 'list') {
    await listBackups();
  } else if (mode === 'restore') {
    const timestamp = process.argv[3];
    if (!timestamp) printUsage();
    await restoreBackup(timestamp);
  }
}

main().catch((err) => {
  console.error('Backup operation failed:', err.message);
  process.exit(1);
});
