const LevelDB = require('@geekberry/leveldb');
const KVStoreDir = require('./KVStoreDir');

class KVStore extends KVStoreDir {
  constructor(options, path) {
    if (options.location) {
      super(new LevelDB(options), path);
    } else {
      super(new LevelDB.Client(options), path);
    }
    this.options = options;
  }

  async listen() {
    if (this.server) {
      await this.server.close();
    }
    this.server = new LevelDB.Server({ ...this.options, database: this.database });
  }

  async clear() {
    await this.database.clear();
  }

  async close() {
    await this.database.close();
    if (this.server) {
      await this.server.close();
    }
  }
}

module.exports = KVStore;
