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
    return new Integer(this, name);
  }

  BigInteger(name) {
    return new BigInteger(this, name);
  }

  Json(name) {
    return new Json(this, name);
  }

  Schema(name, schema) {
    return new Schema(this, name, schema);
  }

  // --------------------------------------------------------------------------
  HashSet(name) {
    return new HashSet(this, name);
  }

  // --------------------------------------------------------------------------
  IndexMap(name) {
    return new IndexMap(this, name);
  }

  IndexSet(name) {
    return new IndexSet(this, name);
  }

  Stack(name) {
    return new Stack(this, name);
  }
}

module.exports = KVStore;
