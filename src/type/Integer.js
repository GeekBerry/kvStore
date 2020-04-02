const assert = require('assert');

class Integer {
  constructor(kvStore, name) {
    this.kvStore = kvStore.Dir(name);
    this.name = name;
  }

  set(value, delIfZero = true) {
    assert(Number.isInteger(value), 'must be int');

    if (delIfZero && value === 0) {
      return this.kvStore.del('');
    } else {
      return this.kvStore.set('', value.toString());
    }
  }

  del() {
    return this.kvStore.del('');
  }

  async get() {
    const value = await this.kvStore.get('');
    return value === undefined ? 0 : parseInt(value, 10);
  }

  async inc(value = 1) {
    assert(Number.isInteger(value), 'must be int');

    let int = await this.get();
    int += value;
    await this.set(int);
    return int;
  }

  async dec(value = 1) {
    assert(Number.isInteger(value), 'must be int');

    let int = await this.get();
    int -= value;
    await this.set(int);
    return int;
  }
}

module.exports = Integer;
