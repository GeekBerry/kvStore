const MIN = Buffer.from([0xfd]);
const MAX = Buffer.from([0xfe]);
const DIR = Buffer.from([0xff]);

class Text {
  /**
   * @param kvStore
   * @param buffer {Buffer}
   */
  constructor(kvStore, buffer) {
    this.kvStore = kvStore;
    this.buffer = buffer;
  }

  /**
   * @param buffer {Buffer}
   * @return {string}
   */
  _parseKey(buffer) {
    return buffer.slice(this.buffer.length + 1).toString();
  }

  /**
   * @param key {string}
   * @return {Buffer}
   */
  _formatKey(key = '') {
    if (key === Infinity) {
      return Buffer.concat([this.buffer, MAX]);
    }
    return Buffer.concat([this.buffer, MIN, Buffer.from(key)]);
  }

  _filter({ limit = Infinity, min, max = Infinity, reverse = false, values = true } = {}) {
    return {
      limit: limit === Infinity ? -1 : limit,
      gte: this._formatKey(min),
      lte: this._formatKey(max),
      reverse,
      values,
    };
  }

  // --------------------------------------------------------------------------
  set(key, value) {
    return this.kvStore.set(this._formatKey(key), value);
  }

  del(key) {
    return this.kvStore.del(this._formatKey(key));
  }

  remove(options) {
    return this.kvStore.clear(this._filter(options));
  }

  // --------------------------------------------------------------------------
  async get(key) {
    const value = await this.kvStore.get(this._formatKey(key));
    return value === undefined ? undefined : value.toString();
  }

  async list(options) {
    const array = await this.kvStore.list(this._filter(options));
    return array.map(({ key, value }) => ({ key: this._parseKey(key), value: value.toString() }));
  }

  // --------------------------------------------------------------------------
  Dir(name) {
    if (!name) {
      throw new Error('Dir name can not be empty');
    }
    return new this.constructor(this.kvStore, Buffer.concat([this.buffer, DIR, Buffer.from(name)]));
  }
}

module.exports = Text;
