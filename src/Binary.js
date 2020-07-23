const lodash = require('lodash');
const KeyCoder = require('./coder/KeyCoder');
const DynamicCoder = require('./coder/DynamicCoder');

function compare(func, one, other) {
  if (Array.isArray(one) && Array.isArray(other)) {
    return lodash.every(lodash.zip(one, other), ([x, y]) => compare(func, x, y));
  } else {
    return other === undefined ? true : func(one, other);
  }
}

class Binary {
  constructor(kvStore, prefixBuffer, keySchema, valueSchema = null) {
    this.kvStore = kvStore;
    this.keyCoder = KeyCoder.from(prefixBuffer, keySchema);
    this.valueCoder = DynamicCoder.from(valueSchema);
  }

  // --------------------------------------------------------------------------
  set(key, value) {
    const keyBuffer = this.keyCoder.encode(key);
    const valueBuffer = this.valueCoder.encode(value);
    return this.kvStore.set(keyBuffer, valueBuffer);
  }

  del(key) {
    const keyBuffer = this.keyCoder.encode(key);
    return this.kvStore.del(keyBuffer);
  }

  remove(options) {
    return this.kvStore.clear(this.keyCoder.filter(options));
  }

  async removeInner(options) {
    const list = await this.listInner(options);

    await this.kvStore.batch(chain => {
      list.forEach(entry => {
        chain(this.kvStore.del(entry.path));
      });
    });

    return list;
  }

  // --------------------------------------------------------------------------
  async get(key) {
    const keyBuffer = this.keyCoder.encode(key);
    const valueBuffer = await this.kvStore.get(keyBuffer);
    return valueBuffer === undefined ? undefined : this.valueCoder.decode(valueBuffer);
  }

  async list(options) {
    const array = await this.kvStore.list(this.keyCoder.filter(options));

    return array.map(each => ({
      path: each.key,
      key: each.key.length ? this.keyCoder.decode(each.key) : undefined,
      value: each.value.length ? this.valueCoder.decode(each.value) : undefined,
    }));
  }

  async listInner({ min, max, limit = Infinity, ...rest } = {}) {
    const array = await this.list({ ...rest, min, max, keys: true });

    return array
      .filter(each => compare(lodash.gte, each.key, min) && compare(lodash.lte, each.key, max))
      .slice(0, limit);
  }
}

module.exports = Binary;
