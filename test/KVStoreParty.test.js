const LevelParty = require('level-party');
const KVStore = require('../index');

const database1 = new KVStore({
  LevelUp: LevelParty,
  location: './DATA/LEVEL_PARTY',
});

const database2 = new KVStore({
  LevelUp: LevelParty,
  location: './DATA/LEVEL_PARTY',
});

// ----------------------------------------------------------------------------
beforeAll(async () => {
  await database1.clear();
});

test('crud', async () => {
  expect(await database2.get('key')).toEqual(undefined);

  await database1.set('key', 'value');
  expect(await database1.get('key')).toEqual('value');
  expect(await database2.get('key')).toEqual('value');

  await database1.del('key');
  expect(await database2.get('key')).toEqual(undefined);
});

afterAll(async () => {
  await database1.close();
  await database2.close();
});
