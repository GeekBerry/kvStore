const assert = require('assert');
const lodash = require('lodash');

class Table {
  constructor(kvStore, name, {
    noMetadata,
    schema,
    primary,
    indexMap,
    groupMap,
  }) {
    assert(schema[primary] !== undefined, 'schema primary is undefined');

    this.kvStore = kvStore;
    this.noMetadata = noMetadata;
    this.primary = primary;

    this.binary = kvStore.Binary(name, schema[primary], schema);
    this.counter = kvStore.Binary(`${name}.counter`, 'string', 'uint');

    this.indexMap = lodash.mapValues(indexMap, fields => {
      assert(lodash.every(fields, f => schema[f] !== undefined), `some fields [${fields.join(',')}] not in schema`);
      return kvStore.Binary(`${name}.index(${fields.join(',')})`, lodash.pick(schema, fields), schema[primary]);
    });

    this.groupMap = lodash.mapValues(groupMap, fields => {
      assert(lodash.every(fields, f => schema[f] !== undefined), `some fields [${fields.join(',')}] not in schema`);
      return kvStore.Binary(`${name}.group(${fields.join(',')})`, lodash.pick(schema, fields), 'uint');
    });
  }

  // --------------------------------------------------------------------------
  async insert(array) {
    array = Array.isArray(array) ? array : [array];

    const operateArray = await this._insert(array);

    return this.kvStore.batch(chain => operateArray.forEach(chain));
  }

  async _insert(array) {
    return lodash.concat(
      this.noMetadata ? [] : this._insertMetadata(array),
      this._insertIndex(array),
      await this._insertGroup(array),
    );
  }

  _insertMetadata(array) {
    return array.map(data => this.binary.set(data[this.primary], data));
  }

  _insertIndex(array) {
    const operateArray = [];
    lodash.forEach(this.indexMap, indexBinary => {
      array.forEach(data => operateArray.push(indexBinary.set(data, data[this.primary])));
    });
    return operateArray;
  }

  async _insertGroup(array) {
    const operateArray = [];

    const total = await this.counter.get('') || 0;
    operateArray.push(this.counter.set(undefined, total + array.length));

    await Promise.all(lodash.map(this.groupMap, async (groupBinary, groupName) => {
      let groupCount = await this.counter.get(groupName) || 0;

      const hexToGroup = lodash.groupBy(array, data => groupBinary.keyCoder.encode(data).toString('hex'));
      await Promise.all(lodash.map(hexToGroup, async group => {
        const key = lodash.first(group); // any one of group is same
        let count = await groupBinary.get(key) || 0;
        if (count === 0) {
          groupCount += 1;
        }
        count += group.length;
        operateArray.push(groupBinary.set(key, count));
      }));

      operateArray.push(this.counter.set(groupName, groupCount));
    }));

    return operateArray;
  }

  // --------------------------------------------------------------------------
  async delete(array) {
    array = Array.isArray(array) ? array : [array];
    const operateArray = await this._delete(array);
    return this.kvStore.batch(chain => operateArray.forEach(chain));
  }

  async _delete(array) {
    return lodash.concat(
      this.noMetadata ? [] : this._deleteMetadata(array),
      this._deleteIndex(array),
      await this._deleteGroup(array),
    );
  }

  _deleteMetadata(array) {
    return array.map(data => this.binary.del(data[this.primary]));
  }

  _deleteIndex(array) {
    const operateArray = [];
    lodash.forEach(this.indexMap, indexBinary => {
      array.forEach(data => operateArray.push(indexBinary.del(data)));
    });
    return operateArray;
  }

  async _deleteGroup(array) {
    const operateArray = [];

    // decrease group
    const total = await this.counter.get('') || 0;
    operateArray.push(this.counter.set(undefined, total - array.length));

    await Promise.all(lodash.map(this.groupMap, async (groupBinary, groupName) => {
      let groupCount = await this.counter.get(groupName) || 0;

      const hexToGroup = lodash.groupBy(array, data => groupBinary.keyCoder.encode(data).toString('hex'));
      await Promise.all(lodash.map(hexToGroup, async group => {
        const key = lodash.first(group); // any one of group is same
        let count = await groupBinary.get(key) || 0;
        count -= group.length;
        if (count === 0) {
          groupCount -= 1;
        }
        operateArray.push(count > 0 ? groupBinary.set(key, count) : groupBinary.del(key)); // drop will value === 0
      }));

      operateArray.push(this.counter.set(groupName, groupCount));
    }));

    return operateArray;
  }

  // --------------------------------------------------------------------------
  async get(key) {
    return this.binary.get(key);
  }

  async count(name = undefined, key = undefined) {
    const count = await (key === undefined ? this.counter.get(name) : this.groupMap[name].get(key));
    return count || 0;
  }

  async listKey({ skip = 0, limit = Infinity, ...rest } = {}) {
    const list = await this.binary.list({
      ...rest,
      limit: skip + limit,
      value: false,
    });
    return list.slice(skip).map(each => each.key);
  }

  async list({ skip = 0, limit = Infinity, ...rest } = {}) {
    const list = await this.binary.list({
      ...rest,
      limit: skip + limit,
      keys: false,
    });
    return list.slice(skip).map(each => each.value);
  }

  async listIndex(name, { skip = 0, limit = Infinity, values = true, ...rest } = {}) {
    const list = await this.indexMap[name].list({
      ...rest,
      limit: skip + limit,
      keys: false,
      values,
    });

    return list.slice(skip).map(each => each.value);
  }

  async listGroup(name, { skip = 0, limit = Infinity, ...rest } = {}) {
    const list = await this.groupMap[name].list({
      ...rest,
      limit: skip + limit,
      values: false,
    });
    return list.slice(skip).map(each => each.key);
  }
}

module.exports = Table;
