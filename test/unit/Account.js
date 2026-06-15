'use strict';

const assert = require('assert');
const { Account } = require('../../dist/cjs/Account');

describe('Account', function () {
  describe('#addCharacter', function () {
    it('should add a character to the list', function () {
      const account = new Account({ username: 'test' });
      account.addCharacter('Foo');
      assert.equal(account.characters.length, 1);
      assert.equal(account.characters[0].username, 'Foo');
      assert.equal(account.characters[0].deleted, false);
    });

    it('should allow multiple characters', function () {
      const account = new Account({ username: 'test' });
      account.addCharacter('Foo');
      account.addCharacter('Bar');
      assert.equal(account.characters.length, 2);
    });
  });

  describe('#hasCharacter', function () {
    it('should return true for existing character', function () {
      const account = new Account({ username: 'test' });
      account.addCharacter('Foo');
      assert.ok(account.hasCharacter('Foo'));
    });

    it('should return false for missing character', function () {
      const account = new Account({ username: 'test' });
      assert.ok(!account.hasCharacter('Foo'));
    });

    it('should find deleted character by name (deleted flag is separate)', function () {
      const account = new Account({ username: 'test' });
      account.addCharacter('Foo');
      account.deleteCharacter('Foo');
      assert.ok(account.hasCharacter('Foo'));
      assert.ok(account.characters[0].deleted);
    });
  });

  describe('#setPassword', function () {
    it('should hash the password', function () {
      const account = new Account({ username: 'test' });
      account.setPassword('secret123');
      assert.ok(account.password);
      assert.notEqual(account.password, 'secret123');
    });

    it('should call save()', function () {
      const account = new Account({ username: 'test' });
      let saved = false;
      account.save = () => { saved = true; };
      account.setPassword('secret123');
      assert.ok(saved);
    });
  });

  describe('#serialize', function () {
    it('should return account data object', function () {
      const account = new Account({
        username: 'TestUser',
        characters: [{ username: 'Foo', deleted: false }],
        password: 'hash',
        metadata: { email: 'a@b.com' },
        banned: false,
        deleted: false,
      });
      const data = account.serialize();
      assert.equal(data.username, 'TestUser');
      assert.equal(data.characters.length, 1);
      assert.equal(data.metadata.email, 'a@b.com');
      assert.equal(data.banned, false);
      assert.equal(data.deleted, false);
    });
  });

  describe('#save', function () {
    it('should not crash when __manager is undefined', function () {
      const account = new Account({ username: 'test' });
      account.addCharacter('Foo');
      account.save();  // should be a no-op, not throw
    });

    it('should call loader.update when __manager is set', function () {
      const account = new Account({ username: 'TestSave' });
      account.addCharacter('Foo');

      let calledId = null;
      let calledData = null;
      account.__manager = {
        loader: {
          update: (id, data) => {
            calledId = id;
            calledData = data;
          }
        }
      };

      account.save();
      assert.equal(calledId, 'TestSave');
      assert.equal(calledData.username, 'TestSave');
      assert.equal(calledData.characters.length, 1);
    });
  });
});
