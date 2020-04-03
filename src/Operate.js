/* eslint-disable max-classes-per-file */

class Operate {
  constructor(database) {
    this.database = database;
  }
}

class SetOperate extends Operate {
  constructor(database, key, value) {
    super(database);
    this.object = { type: 'put', key, value };
  }

  async then(resolve, reject) {
    try {
      const { key, value } = this.object;
      resolve(await this.database.set(key, value));
    } catch (e) {
      reject(e);
    }
  }
}

class DelOperate extends Operate {
  constructor(database, key) {
    super(database);
    this.object = { type: 'del', key };
  }

  async then(resolve, reject) {
    try {
      const { key } = this.object;
      resolve(await this.database.del(key));
    } catch (e) {
      reject(e);
    }
  }
}

class BatchOperate extends Operate {
  constructor(database) {
    super(database);
    this.array = [];
  }

  push(operate) {
    if (operate instanceof SetOperate) {
      this.array.push(operate.object);
    } else if (operate instanceof DelOperate) {
      this.array.push(operate.object);
    } else if (operate instanceof BatchOperate) {
      this.array.push(...operate.array);
    } else {
      throw new Error(`${operate} not a instance of Operate`);
    }
  }

  async then(resolve, reject) {
    try {
      resolve(await this.database.batch(this.array));
    } catch (e) {
      reject(e);
    }
  }
}

module.exports = Operate;
module.exports.Set = SetOperate;
module.exports.Del = DelOperate;
module.exports.Batch = BatchOperate;
