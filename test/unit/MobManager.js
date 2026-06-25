'use strict';

const assert = require('assert');

// Mock helpers
function makeRoom(name) {
  const npcs = new Set();
  return {
    name,
    npcs,
    area: {
      removeNpc: () => {},
    },
    removeNpc(npc, removeSpawn = false) {
      this.npcs.delete(npc);
      if (removeSpawn && this.spawnedNpcs) this.spawnedNpcs.delete(npc);
      npc.room = null;
    },
  };
}

function makeNpc(sourceRoom, currentRoom) {
  return {
    sourceRoom,
    room: currentRoom,
    effects: { clear: () => {} },
    equipment: new Map(),
    inventory: { forEach: (fn) => {} },
    __pruned: false,
    removeAllListeners: () => {},
  };
}

describe('MobManager', () => {
  let MobManager;

  before(() => {
    MobManager = require('../../dist/cjs/MobManager').MobManager;
  });

  describe('#removeMob', () => {
    it('should remove NPC from both source and current room when they differ', () => {
      const sourceRoom = makeRoom('source');
      const currentRoom = makeRoom('current');
      const npc = makeNpc(sourceRoom, currentRoom);

      // Add NPC to both rooms
      sourceRoom.npcs.add(npc);
      currentRoom.npcs.add(npc);

      const mgr = new MobManager();

      mgr.removeMob(npc);

      assert.equal(sourceRoom.npcs.has(npc), false, 'NPC should be removed from sourceRoom');
      assert.equal(currentRoom.npcs.has(npc), false, 'NPC should be removed from currentRoom');
    });

    it('should remove NPC from source room when it is the same as current room', () => {
      const room = makeRoom('same');
      const npc = makeNpc(room, room);

      room.npcs.add(npc);

      const mgr = new MobManager();
      mgr.removeMob(npc);

      assert.equal(room.npcs.has(npc), false, 'NPC should be removed from room');
    });
  });
});
