const TupleMap = require('./TupleMap');

/**
 * [int:string, ...]
 */
class Stack extends TupleMap {
  constructor(kvStore) {
    super(kvStore, Number, String);

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

    await this.kvStore.batch(chain => {
      args.forEach(value => {
        chain(this.set(size, value));
        size += 1;
      });
      chain(this.sizeInteger.set(size));
    });

    return size;
  }

  async pop(count = 1) {
    let size = await this.size();

    const entries = await this.entries({ reverse: true, limit: count, start: 0, stop: size });

    await this.kvStore.batch(chain => {
      entries.forEach(({ key }) => {
        chain(this.del(key));
        size -= 1;
      });
      chain(this.sizeInteger.set(size));
    });

    return entries.map(v => v.value);
  }
}

module.exports = Stack;
