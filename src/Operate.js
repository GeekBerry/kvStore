class Operate {
  constructor(database, options) {
    this.database = database;
    this.options = options;
  }

  async then(resolve, reject) {
    try {
      const { type, key, value } = this.options;

      switch (type) {
        case 'put':
          resolve(await this.database.set(key, value));
          break;

        case 'del':
          resolve(await this.database.del(key));
          break;

        default:
          reject(new Error(`unexpected type "${type}"`));
      }
    } catch (e) {
      reject(e);
    }
  }
}

module.exports = Operate;
