const RocksDBLevelDown = require('rocksdb');
const KVStore = require('../index');

const server = new KVStore({
  LevelDown: RocksDBLevelDown,
  location: './DATA/ROCKS_DB',
});

const writer = new KVStore({
  host: '127.0.0.1',
  port: '8888',
});

const reader = new KVStore({
  host: '127.0.0.1',
  port: '8888',
  readOnly: true,
});

// ----------------------------------------------------------------------------
beforeAll(async () => {
  await server.clear();
  await server.listen({ host: '0.0.0.0', port: '8888' });
});

test('crud', async () => {
  expect(await reader.get('key')).toEqual(undefined);

  await writer.set('key', 'value');
  expect(await writer.get('key')).toEqual(Buffer.from('value'));
  expect(await reader.get('key')).toEqual(Buffer.from('value'));

  await writer.del('key');
  expect(await reader.get('key')).toEqual(undefined);
  await expect(reader.set('key', 'error')).rejects.toThrow('client is readOnly');
});

afterAll(async () => {
  await server.close();
  await writer.close();
  await reader.close();
});
