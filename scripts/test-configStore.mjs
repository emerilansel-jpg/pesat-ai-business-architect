import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const testDir = path.join(projectRoot, '.tmp-test-config');
fs.mkdirSync(testDir, { recursive: true });
process.env.ADVISOR_DATA_DIR = testDir;

const require = createRequire(import.meta.url);
const configStore = require(path.join(projectRoot, 'server', 'configStore.cjs'));

const cfg = configStore.loadConfig();
console.assert(cfg.textProvider === 'deepseek', 'default provider should be deepseek');
console.assert(cfg.imageProvider === 'openai-image', 'default imageProvider');

configStore.saveConfig({ textProvider: 'openai', openaiModel: 'gpt-5' });
const loaded = configStore.loadConfig();
console.assert(loaded.textProvider === 'openai', 'config should persist textProvider');
console.assert(loaded.openaiModel === 'gpt-5', 'config should persist model');

configStore.saveKeys({ OPENAI_API_KEY: 'test-openai', DEEPSEEK_API_KEY: 'test-deepseek' });
console.assert(configStore.hasKey('openai'), 'openai key should exist');
console.assert(configStore.hasKey('deepseek'), 'deepseek key should exist');
console.assert(configStore.getKey('openai') === 'test-openai', 'getKey should return openai key');

configStore.saveKeys({ OPENAI_API_KEY: '', TAVILY_API_KEY: 'test-tavily' });
console.assert(configStore.getKey('openai') === 'test-openai', 'empty string should not erase key');
console.assert(configStore.getKey('tavily') === 'test-tavily', 'new key should be saved');

fs.rmSync(testDir, { recursive: true, force: true });
console.log('✅ configStore tests passed');
