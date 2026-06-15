'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { Data } = require('../../dist/cjs/Data');

describe('Data.isScriptFile', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-test-'));
    fs.writeFileSync(path.join(tmpDir, 'test.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'test.ts'), '');
    fs.writeFileSync(path.join(tmpDir, 'test.txt'), '');
    fs.writeFileSync(path.join(tmpDir, 'test.yml'), '');
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return true for .js files', () => {
    assert.ok(Data.isScriptFile(path.join(tmpDir, 'test.js'), 'test.js'));
  });

  it('should return true for .ts files', () => {
    assert.ok(Data.isScriptFile(path.join(tmpDir, 'test.ts'), 'test.ts'));
  });

  it('should return false for non-script files (.txt)', () => {
    assert.ok(!Data.isScriptFile(path.join(tmpDir, 'test.txt'), 'test.txt'));
  });

  it('should return false for non-script files (.yml)', () => {
    assert.ok(!Data.isScriptFile(path.join(tmpDir, 'test.yml'), 'test.yml'));
  });

  it('should return false for directories', () => {
    assert.ok(!Data.isScriptFile(path.join(tmpDir, 'subdir'), 'subdir'));
  });
});
