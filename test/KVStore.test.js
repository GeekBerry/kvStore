const RocksDBLevelDown = require('rocksdb');
const KVStore = require('../index');

const server = new KVStore({
  LevelDown: RocksDBLevelDown,
  location: './DATA/ROCKS_DB',
  asBuffer: false,
  host: '0.0.0.0',
  port: '8888',
});

const writer = new KVStore({
  asBuffer: false,
  host: '127.0.0.1',
  port: '8888',
});

const reader = new KVStore({
  asBuffer: false,
  host: '127.0.0.1',
  port: '8888',
  readOnly: true,
});

// ----------------------------------------------------------------------------
beforeAll(async () => {
  await server.remove();
  server.listen();
});

test('crud', async () => {
  expect(await reader.get('key')).toEqual(undefined);

  await writer.set('key', 'value');
  expect(await writer.get('key')).toEqual('value');
  expect(await reader.get('key')).toEqual('value');

  await writer.del('key');
  expect(await reader.get('key')).toEqual(undefined);
});

afterAll(async () => {
  await server.close();
  // await writer.close();
  // await reader.close();
});
