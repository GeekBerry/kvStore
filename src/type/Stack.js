const IndexBase = require('./IndexBase');

/**
 * [int:string, ...]
 */
class Stack extends IndexBase {
  constructor(kvStore, name) {
    super(kvStore, name);

    this.sizeInteger = this.kvStore.Integer('length');
  }

  async size() {
    return this.sizeInteger.get();
  }

  async entries({ limit, reverse = false, start = 0, stop, skip = 0 } = {}) {
    if (!reverse) {
      return super.entries({ limit, reverse, start: start + skip, stop });
    } else {
      if (stop === undefined) {
        stop = await this.size();
      }

      return super.entries({ limit, reverse, start, stop: stop - skip - 1 });
    }
  }

  async push(...args) {
    let size = await this.size();

    await this.kvStore.batch(func => {
      args.forEach(value => {
        func(this.kvStore.set(this._formatIndex(size), value));
        size += 1;
      });
      func(this.sizeInteger.set(size));
    });

    return size;
  }

  async pop(count = 1) {
    let size = await this.size();

    const entries = await this.entries({ reverse: true, limit: count, stop: size });

    await this.kvStore.batch(func => {
      entries.forEach(({ name }) => {
        func(this.kvStore.del(name));
        size -= 1;
      });
      func(this.sizeInteger.set(size));
    });

    return entries.map(v => v.value);
  }
}

module.exports = Stack;
