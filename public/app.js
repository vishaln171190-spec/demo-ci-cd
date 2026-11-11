/* global Calculator */

// build-info.json is created by `npm run build` (same for dev and stage).
// deploy-info.json is written on the server at deploy time (differs per environment).
async function loadJson(file) {
  try {
    const res = await fetch(`${file}?t=${Date.now()}`, { cache: 'no-store' });
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

function setText(id, value) {
  document.getElementById(id).textContent = value || '-';
}

async function showInfo() {
  const [build, deploy] = await Promise.all([
    loadJson('build-info.json'),
    loadJson('deploy-info.json'),
  ]);
  const env = deploy.environment || 'local';

  const badge = document.getElementById('env-badge');
  badge.textContent = env;
  badge.classList.add(env);
  document.title = `CI/CD Demo - ${env}`;

  setText('version', build.version);
  setText('commit', (build.commit || '').slice(0, 7));
  setText('run', build.run ? `#${build.run}` : '');
  setText('built-at', build.builtAt);
  setText('deployed-at', deploy.deployedAt);
}

document.getElementById('calc').addEventListener('submit', (event) => {
  event.preventDefault();
  const a = Number(document.getElementById('a').value);
  const b = Number(document.getElementById('b').value);
  const op = document.getElementById('op').value;
  const result = document.getElementById('result');
  try {
    result.textContent = Calculator[op](a, b);
    result.classList.remove('error');
  } catch (err) {
    result.textContent = err.message;
    result.classList.add('error');
  }
});

showInfo();
