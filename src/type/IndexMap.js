const TupleMap = require('./TupleMap');

/**
 * {int:string}
 */
class IndexMap extends TupleMap {
  constructor(kvStore) {
    super(kvStore, Number, String);
  }
}

module.exports = IndexMap;
