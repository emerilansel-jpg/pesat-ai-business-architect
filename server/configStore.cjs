const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.ADVISOR_DATA_DIR || (fs.existsSync('/var/www') ? '/var/www' : '.');
const CONFIG_PATH = path.join(DATA_DIR, 'advisor-config.json');
const KEYS_PATH = path.join(DATA_DIR, 'advisor-keys.json');

const DEFAULT_CONFIG = {
  textProvider: 'deepseek',
  imageProvider: 'openai-image',
  openaiModel: 'gpt-4o',
  deepseekModel: 'deepseek-chat',
  autoImageGen: true,
  imageStyle: 'professional',
  maxImagesPerResponse: 1,
  webSearchEnabled: true,
  stepPrompts: [],
  promptVersion: 4,
  updatedAt: new Date().toISOString(),
};

function atomicWrite(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function ensureConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      saveConfig(DEFAULT_CONFIG);
    }
  } catch (e) {
    console.error('Failed to ensure config:', e);
  }
}

function saveConfig(config) {
  const next = { ...config, updatedAt: new Date().toISOString() };
  delete next.openaiKey;
  delete next.deepseekKey;
  delete next.tavilyKey;
  delete next.hasOpenAiKey;
  delete next.hasDeepseekKey;
  delete next.hasTavilyKey;
  atomicWrite(CONFIG_PATH, next);
  return next;
}

function loadKeys() {
  try {
    if (fs.existsSync(KEYS_PATH)) {
      return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load keys:', e);
  }
  return {};
}

function saveKeys(keys) {
  const existing = loadKeys();
  const next = { ...existing };
  for (const [k, v] of Object.entries(keys)) {
    if (v && typeof v === 'string') {
      next[k] = v;
    }
  }
  atomicWrite(KEYS_PATH, next);
  return next;
}

function keyNameFor(provider) {
  if (provider === 'deepseek') return 'DEEPSEEK_API_KEY';
  if (provider === 'tavily') return 'TAVILY_API_KEY';
  return 'OPENAI_API_KEY';
}

function hasKey(provider) {
  const keys = loadKeys();
  const name = keyNameFor(provider);
  return !!(keys[name] || process.env[name]);
}

function getKey(provider) {
  const keys = loadKeys();
  const name = keyNameFor(provider);
  return keys[name] || process.env[name];
}

function verifyAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || 'jdp123';
  return password === expected;
}

module.exports = {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  ensureConfig,
  loadKeys,
  saveKeys,
  hasKey,
  getKey,
  verifyAdminPassword,
};
