const IndexBase = require('./IndexBase');

/**
 * {int:string}
 */
class IndexMap extends IndexBase {
  set(index, value) {
    return this.kvStore.set(this._formatIndex(index), value);
  }

  del(index) {
    return this.kvStore.del(this._formatIndex(index));
  }

  // XXX: cause `Stack` should have remove, not put `remove` to IndexBase
  async remove({ start, stop, reverse, limit }) {
    await this.kvStore.remove({
      start: start === undefined ? undefined : this._formatIndex(start),
      stop: stop === undefined ? undefined : this._formatIndex(stop),
      reverse,
      limit,
    });
  }
}

module.exports = IndexMap;
