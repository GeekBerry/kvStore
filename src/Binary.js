const assert = require('assert');
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

  remove({ skip, limit = Infinity, min = -Infinity, max = Infinity, reverse = false } = {}) {
    assert(skip === undefined, `remove not support skip, got ${skip}`);

    return this.kvStore.clear({
      ...this.keyCoder.filter(min, max),
      limit,
      reverse,
    });
  }

  async removeInner({ skip, ...rest } = {}) {
    assert(skip === undefined, `removeInner not support skip, got ${skip}`);

    const array = await this.listInner(rest);
    await this.kvStore.batch(chain => {
      array.forEach(entry => {
        chain(this.kvStore.del(entry.path));
      });
    });

    return array;
  }

  // --------------------------------------------------------------------------
  async get(key) {
    const keyBuffer = this.keyCoder.encode(key);
    const valueBuffer = await this.kvStore.get(keyBuffer);
    return valueBuffer === undefined ? undefined : this.valueCoder.decode(valueBuffer);
  }

  async list({ skip = 0, limit = Infinity, min = -Infinity, max = Infinity, reverse = false, keys = true, values = true } = {}) {
    assert(skip >= 0, `skip must >= 0, got ${skip}`);
    assert(limit >= 0, `limit must >= 0, got ${limit}`);

    const array = await this.kvStore.list({
      ...this.keyCoder.filter(min, max),
      limit: skip + limit,
      reverse,
      keys,
      values,
    });

    return array
      .slice(skip, skip + limit)
      .map(each => ({
        path: each.key,
        key: each.key.length ? this.keyCoder.decode(each.key) : undefined,
        value: each.value.length ? this.valueCoder.decode(each.value) : undefined,
      }));
  }

  async listInner({ skip = 0, limit = Infinity, min, max, ...rest } = {}) {
    assert(skip >= 0, `skip must >= 0, got ${skip}`);
    assert(limit >= 0, `limit must >= 0, got ${limit}`);

    const array = await this.list({ min, max, ...rest, keys: true }); // key is required

    return array
      .filter(each => compare(lodash.gte, each.key, min) && compare(lodash.lte, each.key, max))
      .slice(skip, skip + limit);
  }
}

module.exports = Binary;
