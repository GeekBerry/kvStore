const KVStore = require('../src/KVStore');

const kvStore = new KVStore({ location: './DATA/LEVEL_DB' });
kvStore.Table('user', {
  primary: 'name',
  schema: {
    name: 'string',
    age: 'uint',
  },
  indexMap: {
    age_name: ['age', 'name'],
  },
  groupMap: {
    age: ['age'],
  },
});

beforeAll(async () => {
  await kvStore.clear();

  const table = kvStore.Table('user');
  await table.insert([
    { name: 'A', age: 16 },
    { name: 'B', age: 16 },
    { name: 'C', age: 18 },
    { name: 'D', age: 18 },
    { name: 'E', age: 20 },
  ]);
});

test('count', async () => {
  const table = kvStore.Table('user');
  let count;

  count = await table.count();
  expect(count).toEqual(5);

  count = await table.count('age');
  expect(count).toEqual(3);

  count = await table.count('age', { age: 18 });
  expect(count).toEqual(2);
});

test('list', async () => {
  const table = kvStore.Table('user');
  let list;

  list = await table.list({ reverse: true });
  expect(list).toEqual([
    { name: 'E', age: 20 },
    { name: 'D', age: 18 },
    { name: 'C', age: 18 },
    { name: 'B', age: 16 },
    { name: 'A', age: 16 },
  ]);

  list = await table.listIndex('age_name', {
    min: { age: 18, name: '' },
    max: { age: 18, name: Infinity },
  });
  expect(list).toEqual(['C', 'D']);

  list = await table.listGroup('age');
  expect(list).toEqual([{ age: 16 }, { age: 18 }, { age: 20 }]);

  list = await table.listKey();
  expect(list).toEqual(['A', 'B', 'C', 'D', 'E']);
});

afterAll(async () => {
  await kvStore.close();
});
