'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Broadcast } = require('../../dist/cjs/Broadcast');

const strip = s => s.replace(/<[^>]+>/g, '');

describe('Broadcast.progress', () => {
  it('produces correct visible width at 50%', () => {
    const result = Broadcast.progress(25, 50, 'green');
    assert.equal(strip(result).length, 25);
  });

  it('produces correct visible width at 0%', () => {
    const result = Broadcast.progress(25, 0, 'red');
    assert.equal(strip(result).length, 25);
  });

  it('produces correct visible width at 100%', () => {
    const result = Broadcast.progress(25, 100, 'green');
    assert.equal(strip(result).length, 25);
  });

  it('uses > as tip character at non-100%', () => {
    const result = Broadcast.progress(15, 50, 'green');
    const visible = strip(result);
    assert.ok(visible.includes('>'), 'tip > should be present');
  });

  it('has no tip character at 100%', () => {
    const result = Broadcast.progress(15, 100, 'green');
    const visible = strip(result);
    assert.ok(!visible.includes('>'), 'tip > should be absent at 100%');
  });

  it('renders full bar at 100%', () => {
    const result = Broadcast.progress(25, 100, 'green');
    const visible = strip(result);
    assert.equal(visible.length, 25);
    assert.equal(visible[0], '(');
    assert.equal(visible[visible.length - 1], ')');
    assert.ok(!visible.includes('>'));
    // All interior chars should be #
    for (let i = 1; i < visible.length - 1; i++) {
      assert.equal(visible[i], '#');
    }
  });

  it('renders empty bar at 0%', () => {
    const result = Broadcast.progress(25, 0, 'red');
    const visible = strip(result);
    assert.equal(visible.length, 25);
    assert.ok(visible.startsWith('(>'), 'should start with (> at 0%');
  });

  it('accepts custom delimiters', () => {
    const result = Broadcast.progress(15, 50, 'green', '#', ' ', '[]');
    assert.ok(result.includes('[<bold>'), 'should use [ as left delim');
    assert.ok(result.endsWith(']</green>'), 'should end with ]');
  });

  it('accepts custom tipChar', () => {
    const result = Broadcast.progress(15, 50, 'green', '#', ' ', '()', '*');
    const visible = strip(result);
    assert.ok(visible.includes('*'), 'custom tipChar * should be present');
    assert.ok(!visible.includes('>'), 'default > should be absent');
  });

  it('clamps negative percent to 0', () => {
    const result = Broadcast.progress(15, -10, 'red');
    const visible = strip(result);
    assert.equal(visible.length, 15);
    assert.ok(visible.startsWith('(>'), 'negative percent should behave like 0%');
  });

  it('wraps bar in color tags', () => {
    const result = Broadcast.progress(15, 50, 'cyan');
    assert.ok(result.startsWith('<cyan>'), 'should start with <cyan>');
    assert.ok(result.endsWith('</cyan>'), 'should end with </cyan>');
  });

  it('wraps filled portion in bold tags', () => {
    const result = Broadcast.progress(15, 50, 'green');
    assert.ok(result.includes('<bold>'), 'should have <bold>');
    assert.ok(result.includes('</bold>'), 'should have </bold>');
  });
});

describe('Broadcast.line', () => {
  it('creates repeated characters', () => {
    assert.equal(Broadcast.line(5, '#'), '#####');
  });

  it('defaults to dash', () => {
    assert.equal(Broadcast.line(3), '---');
  });

  it('wraps in color tags when specified', () => {
    assert.equal(Broadcast.line(3, '#', 'red'), '<red>###</red>');
  });
});
