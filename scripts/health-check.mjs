import https from 'https';

const CHECKS = [
  {
    name: 'Homepage',
    url: 'https://pesat.ai/',
    expected: 'Pesat.AI | Buktikan Sendiri dalam 5 Menit',
    status: 200,
  },
  {
    name: 'Advisor app (canonical user-facing URL)',
    url: 'https://pesat.ai/advisor/',
    expected: 'Pesat AI Business Architect',
    status: 200,
  },
  {
    name: 'Advisor redirect (no trailing slash)',
    url: 'https://pesat.ai/advisor',
    expected: null,
    status: 301,
    followRedirect: false,
  },
  {
    name: 'Advisor version page',
    url: 'https://pesat.ai/advisor/version',
    expected: 'Pesat AI Business Architect',
    status: 200,
  },
  // apps.pesat.ai/advisor/ is the Worker proxy backend, so it must return 200.
  // It is not user-facing; users should land on pesat.ai/advisor/ instead.
  {
    name: 'apps.pesat.ai/advisor (Worker proxy backend)',
    url: 'https://apps.pesat.ai/advisor/',
    expected: 'Pesat AI Business Architect',
    status: 200,
  },
  // apps.pesat.ai/ is intended for ninjago/friends content.
  // Currently it is still Business Architect because ninjago files are missing.
  {
    name: 'apps.pesat.ai/ (ninjago placeholder)',
    url: 'https://apps.pesat.ai/',
    expected: null,
    status: 200,
  },
];

function fetchUrl(url, followRedirect = true) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { method: 'GET' }, (res) => {
        if (followRedirect && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          return fetchUrl(res.headers.location, followRedirect).then(resolve).catch(reject);
        }
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });
}

async function checkOne(check) {
  try {
    const { status, body } = await fetchUrl(check.url, check.followRedirect !== false);
    const statusOk = check.status ? status === check.status : status === 200;
    const bodyOk = check.expected ? body.includes(check.expected) : true;
    const ok = statusOk && bodyOk;

    return {
      name: check.name,
      url: check.url,
      ok,
      status,
      bodyPreview: body ? body.slice(0, 120).replace(/\s+/g, ' ') : '',
    };
  } catch (err) {
    return {
      name: check.name,
      url: check.url,
      ok: false,
      error: err.message,
    };
  }
}

async function main() {
  console.log('Running Pesat health checks...\n');
  const results = await Promise.all(CHECKS.map(checkOne));
  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.ok) {
      console.log(`✅ ${r.name} — ${r.status || 'OK'}`);
      passed++;
    } else {
      console.log(`❌ ${r.name} — ${r.status || r.error || 'FAIL'}`);
      if (r.bodyPreview) console.log(`   Preview: ${r.bodyPreview}`);
      failed++;
    }
  }

  console.log(`\n${passed}/${results.length} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});
