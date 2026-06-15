'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { QuestFactory } = require('../dist/cjs/QuestFactory');

function makePlayer(level, opts = {}) {
  return {
    level,
    questTracker: {
      completedQuests: new Map(opts.completed || []),
      activeQuests: new Map(),
      isActive(ref) { return (opts.active || []).includes(ref); },
      isComplete(ref) { return (opts.completed || []).some(([k]) => k === ref); },
    },
  };
}

let factory;

before(() => {
  factory = new QuestFactory();
  factory.add('heragon', 'quest_a', {
    id: 'quest_a', title: 'Quest A', level: 1, rewards: [], goals: [],
  });
  factory.add('heragon', 'quest_b', {
    id: 'quest_b', title: 'Quest B', level: 1,
    requires: ['heragon:quest_a'], rewards: [], goals: [],
  });
  factory.add('heragon', 'quest_level_3', {
    id: 'quest_level_3', title: 'Quest Lv 3', level: 1,
    requires: ['heragon:quest_a', 'level:3'], rewards: [], goals: [],
  });
  factory.add('heragon', 'quest_level_5', {
    id: 'quest_level_5', title: 'Quest Lv 5', level: 1,
    requires: ['level:5'], rewards: [], goals: [],
  });
  factory.add('heragon', 'repeatable', {
    id: 'repeatable', title: 'Repeatable', level: 1,
    repeatable: true, rewards: [], goals: [],
  });
  factory.add('heragon', 'quest_no_req', {
    id: 'quest_no_req', title: 'No Req', level: 1, rewards: [], goals: [],
  });
});

// ---- Backward compatibility (senza level:) ----

describe('canStart — backward compatibility', () => {
  it('quest senza requires — start consentito', () => {
    const p = makePlayer(5);
    assert.ok(factory.canStart(p, 'heragon:quest_no_req'));
  });

  it('quest con requires quest completata — start consentito', () => {
    const p = makePlayer(5, { completed: [['heragon:quest_a', {}]] });
    assert.ok(factory.canStart(p, 'heragon:quest_b'));
  });

  it('quest con requires quest NON completata — start negato', () => {
    const p = makePlayer(5);
    assert.ok(!factory.canStart(p, 'heragon:quest_b'));
  });

  it('quest già completata (non repeatable) — start negato', () => {
    const p = makePlayer(5, { completed: [['heragon:quest_no_req', {}]] });
    assert.ok(!factory.canStart(p, 'heragon:quest_no_req'));
  });

  it('quest già attiva — start negato', () => {
    const p = makePlayer(5, { active: ['heragon:quest_no_req'] });
    assert.ok(!factory.canStart(p, 'heragon:quest_no_req'));
  });

  it('quest repeatable già completata — start consentito', () => {
    const p = makePlayer(5, { completed: [['heragon:repeatable', {}]] });
    assert.ok(factory.canStart(p, 'heragon:repeatable'));
  });
});

// ---- level: prefix ----

describe('canStart — level: prefix', () => {
  it('requires level:3, pg Lv 6 — start consentito', () => {
    const p = makePlayer(6, { completed: [['heragon:quest_a', {}]] });
    assert.ok(factory.canStart(p, 'heragon:quest_level_3'));
  });

  it('requires level:3, pg Lv 3 — start consentito (uguale)', () => {
    const p = makePlayer(3, { completed: [['heragon:quest_a', {}]] });
    assert.ok(factory.canStart(p, 'heragon:quest_level_3'));
  });

  it('requires level:3, pg Lv 2 — start negato', () => {
    const p = makePlayer(2, { completed: [['heragon:quest_a', {}]] });
    assert.ok(!factory.canStart(p, 'heragon:quest_level_3'));
  });

  it('requires solo level:5, pg Lv 5 — start consentito', () => {
    const p = makePlayer(5);
    assert.ok(factory.canStart(p, 'heragon:quest_level_5'));
  });

  it('requires solo level:5, pg Lv 4 — start negato', () => {
    const p = makePlayer(4);
    assert.ok(!factory.canStart(p, 'heragon:quest_level_5'));
  });

  it('requires quest + level:3, pg Lv 6 ma quest non completata — start negato', () => {
    const p = makePlayer(6);
    assert.ok(!factory.canStart(p, 'heragon:quest_level_3'));
  });
});
