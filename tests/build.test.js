const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../scripts/build');
const pkg = require('../package.json');

describe('build', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cicd-demo-'));
  let info;

  beforeAll(() => {
    info = build(outDir);
  });

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  test.each(['index.html', 'app.js', 'calculator.js', 'style.css', '.htaccess', 'build-info.json'])(
    'outputs %s',
    (file) => {
      expect(fs.existsSync(path.join(outDir, file))).toBe(true);
    }
  );

  test('build-info.json has the package version', () => {
    const written = JSON.parse(fs.readFileSync(path.join(outDir, 'build-info.json'), 'utf8'));
    expect(written.version).toBe(pkg.version);
    expect(written).toEqual(info);
  });

  test('index.html loads the scripts', () => {
    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('src="calculator.js"');
    expect(html).toContain('src="app.js"');
  });
});
