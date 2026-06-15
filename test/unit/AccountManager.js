'use strict';

const assert = require('assert');
const { AccountManager } = require('../../dist/cjs/AccountManager');
const { Account } = require('../../dist/cjs/Account');

describe('AccountManager', function () {
  describe('#addAccount', function () {
    it('should add account to the map', function () {
      const manager = new AccountManager();
      const account = new Account({ username: 'test' });
      manager.addAccount(account);
      const stored = manager.accounts.get('test');
      assert.equal(stored, account);
    });

    it('should set __manager on the account', function () {
      const manager = new AccountManager();
      const account = new Account({ username: 'test' });
      manager.addAccount(account);
      assert.equal(account.__manager, manager);
    });
  });

  describe('#getAccount', function () {
    it('should return existing account', function () {
      const manager = new AccountManager();
      const account = new Account({ username: 'test' });
      manager.addAccount(account);
      assert.equal(manager.getAccount('test'), account);
    });

    it('should throw for missing account', function () {
      const manager = new AccountManager();
      assert.throws(() => manager.getAccount('nonexistent'), /can't find/);
    });
  });

  describe('#setLoader', function () {
    it('should store the loader reference', function () {
      const manager = new AccountManager();
      const loader = { fetch: () => {} };
      manager.setLoader(loader);
      assert.equal(manager.loader, loader);
    });
  });

  describe('#loadAccount', function () {
    it('should return cached account without fetching', async function () {
      const manager = new AccountManager();
      const account = new Account({ username: 'cached' });
      manager.accounts.set('cached', account);

      let fetched = false;
      manager.loader = { fetch: async () => { fetched = true; return {}; } };

      const result = await manager.loadAccount('cached');
      assert.equal(result, account);
      assert.ok(!fetched);
    });

    it('should fetch from loader when not cached', async function () {
      const manager = new AccountManager();
      let fetched = false;
      manager.loader = {
        fetch: async (username) => {
          fetched = true;
          return { username, metadata: {} };
        }
      };

      const result = await manager.loadAccount('newuser');
      assert.ok(fetched);
      assert.equal(result.username, 'newuser');
    });

    it('should add loaded account to the manager', async function () {
      const manager = new AccountManager();
      manager.loader = {
        fetch: async () => ({ username: 'loaded', metadata: {} })
      };

      const account = await manager.loadAccount('loaded');
      assert.equal(manager.accounts.get('loaded'), account);
    });

    it('should set __manager on loaded accounts', async function () {
      const manager = new AccountManager();
      manager.loader = {
        fetch: async () => ({ username: 'newbie', metadata: {} })
      };

      const account = await manager.loadAccount('newbie');
      assert.equal(account.__manager, manager);
    });

    it('should throw when no loader configured', async function () {
      const manager = new AccountManager();
      await assert.rejects(
        () => manager.loadAccount('any'),
        /No entity loader/
      );
    });
  });
});
