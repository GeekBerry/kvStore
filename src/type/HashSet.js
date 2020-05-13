/**
 * {string:object}
 */
class HashSet {
  constructor(kvStore, name) {
    this.kvStore = kvStore.Dir(name);
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
