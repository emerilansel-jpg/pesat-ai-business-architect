import fs from 'fs';
import path from 'path';

const root = process.cwd();
const mdPath = path.join(root, 'VERSIONS.md');
const outPath = path.join(root, 'src', 'data', 'versions.ts');

const md = fs.readFileSync(mdPath, 'utf8');
const lines = md.split(/\r?\n/);

const versions = [];
let current = null;

for (const line of lines) {
  const header = line.match(/^##\s+v([\d.]+)\s+—\s+(.+?)\s+—\s+(\S+)\s*$/);
  if (header) {
    if (current) versions.push(current);
    current = {
      version: header[1],
      date: header[2].trim(),
      type: header[3].trim(),
      changes: [],
    };
    continue;
  }
  if (current && line.startsWith('- ')) {
    current.changes.push(line.replace(/^-\s+/, ''));
  }
}
if (current) versions.push(current);

versions.forEach((v, i) => {
  v.latest = i === 0;
});

let ts = `// Auto-generated from VERSIONS.md. Do not edit manually.\n`;
ts += `export interface VersionEntry {\n`;
ts += `  version: string;\n`;
ts += `  date: string;\n`;
ts += `  type: 'MAJOR' | 'FEATURE' | 'FIX' | string;\n`;
ts += `  changes: string[];\n`;
ts += `  latest?: boolean;\n`;
ts += `}\n\n`;
ts += `export const versions: VersionEntry[] = ${JSON.stringify(versions, null, 2)};\n`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, ts, 'utf8');
console.log(`Generated ${outPath} with ${versions.length} version entries.`);
