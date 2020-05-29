const assert = require('assert');
const crypto = require('crypto');
const LevelDB = require('@geekberry/leveldb');
const Operate = require('./Operate');
const Table = require('./Table');

class KVStore {
  constructor(options = {}) {
    this._hexToName = {};
    this._nameToTable = {};

    options.asBuffer = true;
    if (options.location) {
      this.database = new LevelDB(options);
    } else {
      this.database = new LevelDB.Client(options);
    }

    this.get = (...args) => this.database.get(...args);
    this.list = (...args) => this.database.list(...args);
    this.clear = (...args) => this.database.clear(...args);
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

  async close() {
    await this.database.close();
    if (this.server) {
      await this.server.close();
    }
  }

  // --------------------------------------------------------------------------
  set(key, value) {
    return new Operate.Set(this.database, key, value);
  }

  del(key) {
    return new Operate.Del(this.database, key);
  }

  batch(func) {
    const batchOperate = new Operate.Batch(this.database);
    func(operate => batchOperate.push(operate));
    return batchOperate;
  }

  // --------------------------------------------------------------------------
  /**
   * @param name {string}
   * @return {Buffer}
   */
  _allocHash(name) {
    const hex = crypto.createHash('md5').update(name).digest('hex').slice(0, 4);

    const value = this._hexToName[hex];
    if (value !== undefined && value !== name) {
      throw new Error(`create name "${name}" failed, already have name "${value}" which hash is "${hex}"`);
    }
    this._hexToName[hex] = name;

    return Buffer.from(hex, 'hex');
  }

  /**
   * @param name {string}
   * @param keySchema {*}
   * @param valueSchema {*}
   * @return {Table}
   */
  Table(name, keySchema, valueSchema) {
    if (!Reflect.has(this._nameToTable, name)) {
      this._nameToTable[name] = new Table(this, this._allocHash(name), keySchema, valueSchema);
    }

    const table = this._nameToTable[name];
    assert(table instanceof Table);

    return table;
  }
}

module.exports = KVStore;
