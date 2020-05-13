const IndexBase = require('./IndexBase');

/**
 * {int,string=>''}
 */
class IndexSet extends IndexBase {
  /**
   * @param index {number}
   * @param value {string|Infinity} string for value, `Infinity` for upper bound, `-Infinity` for lower bound.
   * @return {string}
   */
  _formatIndex(index, value) {
    switch (value) {
      case -Infinity:
        return `${super._formatIndex(index)},`;

      case Infinity:
        return `${super._formatIndex(index)}-`; // '-' is the next char of ',' in ascii code

      default:
        return `${super._formatIndex(index)},${value}`;
    }
  }

  _parse({ path, key }) {
    return {
      path,
      key: key.slice(0, IndexBase.INDEX_SIZE),
      value: key.slice(1 + IndexBase.INDEX_SIZE),
    };
  }

  set(index, value) {
    return this.kvStore.set(this._formatIndex(index, value), '');
  }

  del(index, value) {
    return this.kvStore.del(this._formatIndex(index, value));
  }

  async get(index, value) {
    const result = await this.kvStore.get(this._formatIndex(index, value));
    return result === undefined ? undefined : value;
  }

  async entries(options) {
    const entries = await super.entries(options);
    return entries.map(this._parse);
  }
}

module.exports = IndexSet;
