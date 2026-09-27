const fs = require('fs');
const path = require('path');
const os = require('os');
const { buildSidebar } = require('../src/server');

describe('Server Auto Sidebar', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-server-'));
    
    // Setup nested structure
    const featuresDir = path.join(tmpDir, 'features');
    fs.mkdirSync(featuresDir, { recursive: true });
    
    fs.writeFileSync(path.join(tmpDir, 'overview.md'), '# Overview');
    fs.writeFileSync(path.join(featuresDir, 'user-login.md'), '# Login');
    fs.writeFileSync(path.join(tmpDir, '_template.md'), '# Skip this');
    fs.writeFileSync(path.join(tmpDir, '.hidden.md'), '# Skip this');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('buildSidebar generates correct markdown list', () => {
    const sidebar = buildSidebar(tmpDir, tmpDir);
    
    // Should skip _template.md and .hidden.md
    expect(sidebar).not.toContain('_template.md');
    expect(sidebar).not.toContain('.hidden.md');
    
    // Should contain directories and files properly indented
    expect(sidebar).toContain('* **Features**');
    expect(sidebar).toContain('  * [User login](/features/user-login.md)');
    expect(sidebar).toContain('* [Overview](/overview.md)');
  });
});
