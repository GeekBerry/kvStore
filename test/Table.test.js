const lodash = require('lodash');
const KVStore = require('../src/KVStore');

const kvStore = new KVStore({ location: './DATA/LEVEL_DB' });

beforeAll(async () => {
  await kvStore.clear();
});

test('uintToString', async () => {
  const table = await kvStore.Table('uintToString', 'uint', String);

  await table.set(1, 'A');
  await table.set(2, 'B');
  await table.set(3, 'C');
  await table.del(2);

  expect(await table.get(2)).toEqual(undefined);
  expect(await table.get(3)).toEqual('C');

  let list = await kvStore.list();
  list = list.map(each => lodash.mapValues(each, b => b.toString('hex')));
  expect(list).toEqual([
    { key: '31c8000000000001', value: '41' },
    { key: '31c8000000000003', value: '43' },
  ]);
});

test('tupleToJson', async () => {
  const table = await kvStore.Table('tupleToJson', ['uint', 'uint'], JSON);

  await kvStore.batch(chain => {
    lodash.range(4).forEach(i => {
      lodash.range(4).forEach(j => {
        chain(table.set([i, j], { i, j }));
      });
    });
  });

  let list;
  list = await table.list({ min: [1, 1], max: [2, 2] });
  list = list.map(({ key, value }) => ({ key, value }));
  expect(list).toEqual([
    { key: [1, 1], value: { i: 1, j: 1 } },
    { key: [1, 2], value: { i: 1, j: 2 } },
    { key: [1, 3], value: { i: 1, j: 3 } },
    { key: [2, 0], value: { i: 2, j: 0 } },
    { key: [2, 1], value: { i: 2, j: 1 } },
    { key: [2, 2], value: { i: 2, j: 2 } },
  ]);

  list = await table.listInner({ min: [1, 1], max: [2, 2] });
  list = list.map(({ key, value }) => ({ key, value }));
  expect(list).toEqual([
    { key: [1, 1], value: { i: 1, j: 1 } },
    { key: [1, 2], value: { i: 1, j: 2 } },
    { key: [2, 1], value: { i: 2, j: 1 } },
    { key: [2, 2], value: { i: 2, j: 2 } },
  ]);

  await table.removeInner({ min: [1, 1], max: [2, 2] });
  list = await table.list({ min: [1, 1], max: [2, 2] });
  list = list.map(({ key, value }) => ({ key, value }));
  expect(list).toEqual([
    { key: [1, 3], value: { i: 1, j: 3 } },
    { key: [2, 0], value: { i: 2, j: 0 } },
  ]);

  await table.remove({ min: [1, 1], max: [2, 2] });
  list = await table.list();
  list = list.map(({ key, value }) => ({ key, value }));
  expect(list).toEqual([
    { key: [0, 0], value: { i: 0, j: 0 } },
    { key: [0, 1], value: { i: 0, j: 1 } },
    { key: [0, 2], value: { i: 0, j: 2 } },
    { key: [0, 3], value: { i: 0, j: 3 } },
    { key: [1, 0], value: { i: 1, j: 0 } },
    { key: [2, 3], value: { i: 2, j: 3 } },
    { key: [3, 0], value: { i: 3, j: 0 } },
    { key: [3, 1], value: { i: 3, j: 1 } },
    { key: [3, 2], value: { i: 3, j: 2 } },
    { key: [3, 3], value: { i: 3, j: 3 } },
  ]);
});

afterAll(async () => {
  await kvStore.close();
});
