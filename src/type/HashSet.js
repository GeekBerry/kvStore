/**
 * {string:object}
 */
class HashSet {
  constructor(kvStore) {
    this.kvStore = kvStore;
  }

  set(key) {
    return this.kvStore.set(key, '');
  }

  del(key) {
    return this.kvStore.del(key);
  }

  async get(key) {
    const value = await this.kvStore.get(key);
    return value !== undefined ? true : undefined;
  }

  async list(options) {
    const entries = await this.kvStore.entries(options);
    return entries.map(v => v.key);
  }

  async clear() {
    await this.kvStore.remove({});
  }
}

module.exports = HashSet;
