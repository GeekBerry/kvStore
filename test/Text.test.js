const KVStore = require('../src/KVStore');

const kvStore = new KVStore({ location: './DATA/LEVEL_DB' });

beforeEach(async () => {
  await kvStore.clear();
});

test('Text', async () => {
  const dir = await kvStore.Text('');

  await kvStore.batch(chain => {
    chain(dir.set('', 'null'));
    chain(dir.set('A', 'a'));
    chain(dir.set('B', 'b'));
    chain(dir.set('C', 'c'));
  });

  expect(await dir.get('')).toEqual('null');

  expect(await dir.list()).toEqual([
    { key: '', value: 'null' },
    { key: 'A', value: 'a' },
    { key: 'B', value: 'b' },
    { key: 'C', value: 'c' },
  ]);

  expect(await dir.list({ reverse: true, min: 'A', max: 'B' })).toEqual([
    { key: 'B', value: 'b' },
    { key: 'A', value: 'a' },
  ]);
});

test('Text.Dir', async () => {
  const dirA = await kvStore.Text('');
  const dirAa = await dirA.Dir('a');

  await dirA.set('A', '一');
  await dirA.set('Aa', '二');
  await dirAa.set('', '三');

  expect(await dirA.list()).toEqual([
    { key: 'A', value: '一' },
    { key: 'Aa', value: '二' },
  ]);

  expect(await dirAa.list()).toEqual([
    { key: '', value: '三' },
  ]);
});

afterAll(async () => {
  await kvStore.close();
});
