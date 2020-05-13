const LevelInterface = require('@geekberry/leveldb/src/LevelInterface');
const Operate = require('./Operate');

/**
 * {string:string}
 */
class KVStoreBase {
  /**
   * @param database {LevelInterface}
   * @param [path=''] {string} - prefix
   */
  constructor(database, path = '') {
    if (!(database instanceof LevelInterface)) {
      throw new Error('database must be instance of LevelInterface');
    }

    this.database = database;
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
    } else if (Number.isInteger(limit)) {
      options.limit = limit >= 0 ? limit : 0;
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
  set(key, value) {
    return new Operate.Set(this.database, this._formatName(key), value);
  }

  del(key) {
    return new Operate.Del(this.database, this._formatName(key));
  }

  batch(func) {
    const batchOperate = new Operate.Batch(this.database);
    func(operate => batchOperate.push(operate));
    return batchOperate;
  }

  remove(options = {}) {
    return this.database.clear(this._filter(options));
  }

  // --------------------------------------------------------------------------
  /**
   * @param key {string}
   * @return {Promise<undefined|string>}
   */
  async get(key) {
    return this.database.get(this._formatName(key));
  }

  async entries(options = {}) {
    const array = await this.database.list(this._filter(options));

    array.forEach(data => {
      data.path = data.key;
      data.key = this._parseName(data.key);
    });

    return array;
  }

  // --------------------------------------------------------------------------
  Dir(name) {
    return new this.constructor(this.database, `${this.path}/${name}`);
  }
}

module.exports = KVStoreBase;
