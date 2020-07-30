const assert = require('assert');
const crypto = require('crypto');
const LevelDB = require('@geekberry/leveldb');
const Operate = require('./Operate');
const Binary = require('./Binary');
const Text = require('./Text');
const Table = require('./Table');

class KVStore {
  constructor(options = {}) {
    this._hexToName = {};
    this._nameToInstance = {};

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
   * @return {Binary}
   */
  Binary(name, keySchema, valueSchema) {
    if (!Reflect.has(this._nameToInstance, name)) {
      this._nameToInstance[name] = new Binary(this, this._allocHash(name), keySchema, valueSchema);
    }

    const instance = this._nameToInstance[name];
    assert(instance instanceof Binary);
    return instance;
  }

  /**
   * @param name {string}
   * @return {Text}
   */
  Text(name) {
    if (!Reflect.has(this._nameToInstance, name)) {
      this._nameToInstance[name] = new Text(this, this._allocHash(name));
    }

    const instance = this._nameToInstance[name];
    assert(instance instanceof Text);
    return instance;
  }

  /**
   * @param name {string}
   * @param options {object}
   * @return {Table}
   */
  Table(name, options) {
    if (!Reflect.has(this._nameToInstance, name)) {
      this._nameToInstance[name] = new Table(this, name, options);
    }

    const instance = this._nameToInstance[name];
    assert(instance instanceof Table);
    return instance;
  }
}

module.exports = KVStore;
