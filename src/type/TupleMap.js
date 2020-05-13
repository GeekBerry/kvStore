const lodash = require('lodash');

function compare(func, one, other) {
  if (Array.isArray(one) && Array.isArray(other)) {
    return lodash.every(lodash.zip(one, other), ([x, y]) => compare(func, x, y));
  } else {
    return other === undefined ? true : func(one, other);
  }
}

// ----------------------------------------------------------------------------
function intToHex(int) {
  if (Number.isSafeInteger(int)) {
    return int >= 0
      ? `0x${Number(int).toString(16).padStart(14, '0')}`
      : `-x${Number(-int).toString(16).padStart(14, '0')}`;
  }
  if (int === Infinity) {
    return '0x'.padEnd(2 + 14, 'f');
  }
  if (int === -Infinity) {
    return '-x'.padEnd(2 + 14, 'f');
  }
  throw new Error(`int must be safe integer, got "${int}"`);
}

function hexToInt(string) {
  if (string === undefined) {
    return 0;
  }
  return Number(string);
}

// ----------------------------------------------------------------------------
function compileFormat(type) {
  if (Array.isArray(type)) {
    const funcArray = type.map(compileFormat);
    return array => array.map((v, i) => funcArray[i](v)).join(',');
  }

  switch (type) {
    case null:
      return () => '';
    case String:
      return v => v;
    case Number:
      return intToHex;
    case Object:
      return v => JSON.stringify(v);
    default:
      throw new Error(`unexpect type "${type}"`);
  }
}

function compileParser(type) {
  if (Array.isArray(type)) {
    const funcArray = type.map(compileParser);
    return hex => {
      const array = hex !== undefined ? hex.split(',') : funcArray.map(() => undefined);
      return array.map((v, i) => funcArray[i](v));
    };
  }

  switch (type) {
    case null:
      return () => null;
    case Number:
      return hexToInt;
    case String:
      return v => v;
    case Object:
      return v => (v === undefined ? {} : JSON.parse(v));
    default:
      throw new Error(`unexpect type "${type}"`);
  }
}

// ============================================================================
class TupleMap {
  constructor(kvStore, keyType, valueType) {
    this.kvStore = kvStore;

    this.keyFormat = compileFormat(keyType);
    this.keyParse = compileParser(keyType);
    this.valueFormat = compileFormat(valueType);
    this.valueParse = compileParser(valueType);
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

  async keys(options) {
    const entries = await this.entries(options);
    return entries.map(v => v.key);
  }

  async values(options) {
    const entries = await this.entries(options);
    return entries.map(v => v.value);
  }

  async remove({ start, stop, reverse = false, limit = Infinity }) {
    const entries = await this.entries({ start, stop, reverse });

    const list = entries
      .filter(entry => compare(lodash.gte, entry.key, start) && compare(lodash.lte, entry.key, stop))
      .slice(0, limit);

    await this.kvStore.batch(chain => {
      list.forEach(entry => {
        chain(this.kvStore.del(entry._key)); // use unparsed key `_key`
      });
    });

    return list;
  }

  async clear() {
    await this.kvStore.remove({});
  }
}

module.exports = TupleMap;
