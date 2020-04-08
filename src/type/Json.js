const lodash = require('lodash');

/**
 * {string:object}
 */
class Json {
  constructor(kvStore, name) {
    this.kvStore = kvStore.Dir(name);
  }

  set(object) {
    return this.kvStore.set('', JSON.stringify(object));
  }

  del() {
    return this.kvStore.del('');
  }

  async get() {
    const json = await this.kvStore.get('');
    if (json === undefined) {
      return undefined;
    }
    return JSON.parse(json);
  }

  async update(options) {
    const data = await this.get();
    if (data === undefined) {
      throw new Error(`can not fount "${this.kvStore.path}"`);
    }

    const object = { ...data, ...options };
    await this.set(object);
    return object;
  }

  async select(fields) {
    let object = await this.get();
    if (object !== undefined && fields !== undefined) {
      object = lodash.pick(object, fields);
    }
    return object;
  }

  async remove(fields) {
    if (fields === undefined) {
      return this.del();
    }

    let object = await this.get();
    object = lodash.omit(object, fields);
    await this.set(object);
    return object;
  }
}

module.exports = Json;
