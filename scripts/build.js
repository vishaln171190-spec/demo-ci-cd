// Builds the static site into dist/ (no dependencies needed).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function build(outDir = path.join(ROOT, 'dist')) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Static files (HTML, CSS, browser JS, .htaccess)
  fs.cpSync(path.join(ROOT, 'public'), outDir, { recursive: true });

  // 2. Shared logic used by the page
  fs.copyFileSync(path.join(ROOT, 'src', 'calculator.js'), path.join(outDir, 'calculator.js'));

  // 3. Build metadata: identical for dev and stage, proving the same build is promoted
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const info = {
    version: pkg.version,
    commit: process.env.GITHUB_SHA || 'local',
    run: process.env.GITHUB_RUN_NUMBER || '',
    builtAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');

  return info;
}

if (require.main === module) {
  const info = build();
  console.log(`Built version ${info.version} (${info.commit}) into dist/`);
}

module.exports = { build };
