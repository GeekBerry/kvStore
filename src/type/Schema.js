const lodash = require('lodash');

class Schema {
  constructor(kvStore, name, schema) {
    if (!lodash.isPlainObject(schema)
      || !(Object.keys(schema).length > 0)
      || !lodash.every(schema, func => lodash.isFunction(func))) {
      throw new Error(`schema must be non empty func object, got ${schema}`);
    }

    this.kvStore = kvStore.Dir(name);
    this.schema = schema;
  }

  // --------------------------------------------------------------------------
  set(key, value) {
    const type = this.schema[key];
    return this.kvStore.set(key, type(value));
  }

  del(key) {
    return this.kvStore.del(key);
  }

  update(object) {
    return this.kvStore.batch(func => {
      lodash.map(this.schema, (type, key) => {
        const value = object[key];
        if (value !== undefined) {
          func(this.set(key, value));
        }
      });
    });
  }

  remove(fields) {
    let keys = Object.keys(this.schema);
    if (fields !== undefined) {
      keys = lodash.intersection(keys, fields);
    }

    return this.kvStore.batch(func => {
      keys.forEach(key => {
        func(this.del(key));
      });
    });
  }

  // --------------------------------------------------------------------------
  async get(key) {
    const value = await this.kvStore.get(key);
    const type = this.schema[key];
    return value === undefined ? undefined : type(value);
  }

  async select(fields) {
    let keys = Object.keys(this.schema);
    if (fields !== undefined) {
      keys = lodash.intersection(keys, fields);
    }

    const result = {};
    await Promise.all(keys.map(async key => {
      const value = await this.get(key);
      if (value !== undefined) {
        result[key] = value;
      }
    }));
    return result;
  }
}

module.exports = Schema;
