const LevelDB = require('@geekberry/leveldb');
const KVStoreBase = require('./KVStoreBase');
const Integer = require('./type/Integer');
const BigInteger = require('./type/BigInteger');
const Json = require('./type/Json');
const Schema = require('./type/Schema');
const IndexMap = require('./type/IndexMap');
const IndexSet = require('./type/IndexSet');
const Stack = require('./type/Stack');
const HashSet = require('./type/HashSet');
const TupleMap = require('./type/TupleMap');

class KVStore extends KVStoreBase {
  constructor(options, path) {
    if (options instanceof LevelDB.Interface) {
      super(options, path);
    } else if (options.location) {
      super(new LevelDB(options), path);
    } else {
      super(new LevelDB.Client(options), path);
    }
  }

  /*
   * @param options {object}
   * @param options.readOnly {boolean}
   * @param options.host {string}
   * @param options.port {number}
   */
  async listen(options = {}) {
    if (this.server) {
      await this.server.close();
    }

    this.server = new LevelDB.Server({ ...options, database: this.database });
  }

  async clear() {
    await this.database.clear();
  }

  async close() {
    await this.database.close();
    if (this.server) {
      await this.server.close();
    }
  }

  // ==========================================================================
  Integer(name) {
    return new Integer(this.Dir(name));
  }

  BigInteger(name) {
    return new BigInteger(this.Dir(name));
  }

  Json(name) {
    return new Json(this.Dir(name));
  }

  Schema(name, schema) {
    return new Schema(this.Dir(name), schema);
  }

  // --------------------------------------------------------------------------
  HashSet(name) {
    return new HashSet(this.Dir(name));
  }

  // --------------------------------------------------------------------------
  IndexMap(name) {
    return new IndexMap(this.Dir(name));
  }

  IndexSet(name) {
    return new IndexSet(this.Dir(name));
  }

  Stack(name) {
    return new Stack(this.Dir(name));
  }

  TupleMap(name, ...args) {
    return new TupleMap(this.Dir(name), ...args);
  }
}

module.exports = KVStore;
