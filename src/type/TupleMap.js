const lodash = require('lodash');
const util = require('./util');

function gte(one, other) {
  if (Array.isArray(one) && Array.isArray(other)) {
    return lodash.every(lodash.zip(one, other), ([x, y]) => lodash.gte(x, y));
  } else {
    return lodash.gte(one, other);
  }
}

class TupleMap {
  constructor(kvStore, keyType, valueType) {
    this.kvStore = kvStore;

    this.keyFormat = util.compileFormat(keyType);
    this.keyParse = util.compileParser(keyType);
    this.valueFormat = util.compileFormat(valueType);
    this.valueParse = util.compileParser(valueType);
  }

  _filter({ start, stop, ...options }) {
    if (start !== undefined) {
      options.start = this.keyFormat(start);
    }

    if (stop !== undefined) {
      options.stop = this.keyFormat(stop);
    }

    return options;
  }

  set(key, value) {
    return this.kvStore.set(this.keyFormat(key), this.valueFormat(value));
  }

  del(key) {
    return this.kvStore.del(this.keyFormat(key));
  }

  async get(key) {
    const value = await this.kvStore.get(this.keyFormat(key));
    return this.valueParse(value);
  }

  async entries(options = {}) {
    const entries = await this.kvStore.entries(this._filter(options));
    entries.forEach(entry => {
      entry._key = entry.key; // set unparsed `key` as `_key`
      entry._value = entry.value; // set unparsed `value` as `_value`
      entry.key = this.keyParse(entry.key);
      entry.value = this.valueParse(entry.value);
    });
    return entries;
  }

  async popTail(start) {
    const entries = await this.entries({ start });

    const list = entries.filter(entry => gte(entry.key, start)).reverse();
    await this.kvStore.batch(chain => {
      list.forEach(entry => {
        chain(this.kvStore.del(entry._key)); // use unparsed `_key`
      });
    });
    return list;
  }
}

module.exports = TupleMap;
