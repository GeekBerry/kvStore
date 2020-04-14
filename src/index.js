const Operate = require('./Operate');
const Integer = require('./type/Integer');
const BigInteger = require('./type/BigInteger');
const Json = require('./type/Json');
const Schema = require('./type/Schema');
const IndexMap = require('./type/IndexMap');
const IndexSet = require('./type/IndexSet');
const Stack = require('./type/Stack');
const HashSet = require('./type/HashSet');

/**
 * {string:string}
 */
class KVStore {
  /**
   * @param database {object|KVStore}
   * @param [path=''] {string}
   */
  constructor(database, path = '') {
    if (database instanceof KVStore) {
      this.database = database.database; // use parent database
    } else {
      this.database = database;
    }

    this.path = path;
  }

  _parseName(fullPath) {
    const index = fullPath.lastIndexOf(':') + 1;
    return index ? fullPath.slice(index) : '';
  }

  _formatName(name) {
    name = name.toString();
    if (name.includes(':')) {
      throw new Error(`Invalid name "${name}"`);
    }
    return `${this.path}:${name}`;
  }

  _filter({ start, stop, reverse = false, limit = Infinity }) {
    const options = { reverse };

    if (limit === Infinity) {
      options.limit = -1;
    } else if (Number.isInteger(limit) && limit >= 0) {
      options.limit = limit;
    } else {
      throw new Error(`Invalid limit ${limit}`);
    }

    if (start === undefined) {
      options.gt = this._formatName('');
    } else {
      options.gte = this._formatName(start);
    }

    if (stop === undefined) {
      options.lt = `${this.path};`; // ';' is the next char of ':' in ascii code
    } else {
      options.lte = this._formatName(stop);
    }

    return options;
  }

  // --------------------------------------------------------------------------
  set(name, value) {
    return new Operate.Set(this.database, this._formatName(name), value);
  }

  del(name) {
    return new Operate.Del(this.database, this._formatName(name));
  }

  batch(func) {
    const batchOperate = new Operate.Batch(this.database);
    func(operate => batchOperate.push(operate));
    return batchOperate;
  }

  async remove(options = {}) {
    return this.database.clear(this._filter(options));
  }

  // --------------------------------------------------------------------------
  /**
   * @param name {string}
   * @return {Promise<undefined|string>}
   */
  async get(name) {
    return this.database.get(this._formatName(name));
  }

  async entries(options = {}) {
    const array = await this.database.list(this._filter(options));

    array.forEach(data => {
      data.name = this._parseName(data.key);
    });

    return array;
  }

  // --------------------------------------------------------------------------
  Dir(path) {
    return new KVStore(this, `${this.path}/${path}`);
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

module.exports = KVStore;
