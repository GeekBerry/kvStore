class IndexBase {
  static get INDEX_SIZE() {
    // (13 hex char = 52 bit) < (MAX_SAFE_INTEGER = 53 bit)
    return 13;
  }

  constructor(kvStore, name) {
    this.kvStore = kvStore.Dir(name);
    this.name = name;
  }

  _formatIndex(index) {
    if (!Number.isSafeInteger(index) || !(index >= 0)) {
      throw new Error(`Invalid index ${index}`);
    }
    return index.toString(16).padStart(IndexBase.INDEX_SIZE, '0');
  }

  _parseIndex(name = '0') {
    return parseInt(name, 16);
  }

  get(index) {
    return this.kvStore.get(this._formatIndex(index));
  }

  /**
   * @param start {number}
   * @param stop {number}
   * @param reverse {boolean}
   * @param limit {number}
   * @return {Promise<*[]|*>}
   */
  async entries({ start, stop, reverse, limit = Infinity } = {}) {
    if (stop < 0 || limit <= 0) {
      return [];
    }

    return this.kvStore.entries({
      start: start === undefined ? undefined : this._formatIndex(start, -Infinity),
      stop: stop === undefined ? undefined : this._formatIndex(stop, Infinity),
      reverse,
      limit,
    });
  }

  async values(options) {
    const entries = await this.entries(options);
    return entries.map(v => v.value);
  }

  async keys(options) {
    const entries = await this.entries(options);
    return entries.map(v => this._parseIndex(v.key));
  }

  async clear() {
    await this.kvStore.remove({});
  }
}

module.exports = IndexBase;
