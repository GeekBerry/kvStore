const KVStoreBase = require('./KVStoreBase');
const Integer = require('./type/Integer');
const BigInteger = require('./type/BigInteger');
const Json = require('./type/Json');
const Schema = require('./type/Schema');
const IndexMap = require('./type/IndexMap');
const IndexSet = require('./type/IndexSet');
const Stack = require('./type/Stack');
const HashSet = require('./type/HashSet');

class KVStoreDir extends KVStoreBase {
  Dir(path) {
    return new KVStoreDir(this.database, `${this.path}/${path}`);
  }

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

module.exports = KVStoreDir;
