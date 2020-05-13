const TupleMap = require('./TupleMap');

/**
 * {int,string=>''}
 */
class IndexSet extends TupleMap {
  constructor(kvStore) {
    super(kvStore, [Number, String], null);
  }

  set(index, value) {
    return super.set([index, value]);
  }

  del(index, value) {
    return super.del([index, value]);
  }

  get(index, value) {
    return super.get([index, value]);
  }

  async entries({ start, stop, ...options }) {
    if (start !== undefined) {
      options.start = [start, ''];
    }

    if (stop !== undefined) {
      options.stop = [stop + 1];
    }

    const entries = await super.entries(options);
    return entries.map(({ path, key: [key, value] = [] }) => ({ path, key, value }));
  }
}

module.exports = IndexSet;
