const KVStore = require('../index');

const kvStore = new KVStore({ location: './DATA/LEVEL_DB' });

beforeAll(async () => {
  await kvStore.clear();
});

test('crud', async () => {
  expect(await kvStore.get('key')).toEqual(undefined);

  await kvStore.set('key', 'value');
  expect(await kvStore.get('key')).toEqual('value');

  await kvStore.del('key');
  expect(await kvStore.get('key')).toEqual(undefined);
});

test('batch', async () => {
  const dir = kvStore.Dir('Batch');

  await kvStore.batch(func => {
    func(dir.set('1', 'A'));
    func(dir.set('2', 'B'));
    func(dir.set('3', 'C'));
    func(dir.set('4', 'D'));
  });

  const entries = await dir.entries({ start: '2', stop: '3' });
  expect(entries).toEqual([
    { path: '/Batch:2', key: '2', value: 'B' },
    { path: '/Batch:3', key: '3', value: 'C' },
  ]);
});

test('batch nested', async () => {
  const nested = kvStore.Dir('Nested');

  const batch = kvStore.batch(func => {
    func(nested.set('1', 'A'));
    func(nested.set('2', 'B'));
    func(nested.set('3', 'C'));
    func(nested.set('4', 'D'));
  });

  await kvStore.batch(func => {
    func(batch);
    func(nested.del('2'));
  });

  const entries = await nested.entries();
  expect(entries).toEqual([
    { path: '/Nested:1', key: '1', value: 'A' },
    { path: '/Nested:3', key: '3', value: 'C' },
    { path: '/Nested:4', key: '4', value: 'D' },
  ]);
});

test('Dir', async () => {
  const dir = kvStore.Dir('dir');

  await kvStore.set('A', 'outer');
  await dir.set('A', 'inner');

  expect(await kvStore.get('A')).toEqual('outer');
  expect(await dir.get('A')).toEqual('inner');

  await dir.remove();

  expect(await kvStore.get('A')).toEqual('outer');
  expect(await dir.get('A')).toEqual(undefined);
});

test('Integer', async () => {
  const integer = kvStore.Integer('Integer');

  expect(await integer.get()).toEqual(0);

  await integer.set(100);
  expect(await integer.get()).toEqual(100);

  expect(await integer.inc(99)).toEqual(199);
  expect(await integer.dec(200)).toEqual(-1);

  await integer.del();
  expect(await integer.get()).toEqual(0);
});

test('BigInteger', async () => {
  const bigInteger = kvStore.BigInteger('BigInteger');

  expect(await bigInteger.get()).toEqual(BigInt(0));

  await bigInteger.set(BigInt(100));
  expect(await bigInteger.get()).toEqual(BigInt(100));

  expect(await bigInteger.inc(BigInt(99))).toEqual(BigInt(199));
  expect(await bigInteger.dec(BigInt(200))).toEqual(BigInt(-1));

  await bigInteger.del();
  expect(await bigInteger.get()).toEqual(BigInt(0));
});

test('Json', async () => {
  const json = kvStore.Json('Json');

  expect(await json.get()).toEqual(undefined);
  expect(await json.select([])).toEqual(undefined);

  await json.set({ A: 'a1', B: 'b1' });
  expect(await json.get()).toEqual({ A: 'a1', B: 'b1' });

  await json.update({ A: 'a2', C: 'c2' });
  expect(await json.get()).toEqual({ A: 'a2', B: 'b1', C: 'c2' });

  expect(await json.select([])).toEqual({});
  expect(await json.select(['A', 'C'])).toEqual({ A: 'a2', C: 'c2' });

  await json.remove(['A']);
  expect(await json.get()).toEqual({ B: 'b1', C: 'c2' });

  await json.del();
  expect(await json.get()).toEqual(undefined);
});

test('Schema', async () => {
  const schema = kvStore.Schema('Schema', {
    buf: Buffer.from,
    bn: BigInt,
    num: Number,
    any: v => v,
  });

  expect(await schema.select()).toEqual({});

  await schema.update({
    buf: '123',
    bn: '123',
    any: '123',
    xxx: '123',
    num: false,
  });

  expect(await schema.select()).toEqual({
    buf: Buffer.from('123'),
    bn: BigInt(123),
    any: '123',
    num: 0,
  });
  expect(await schema.select(['bn', 'yyy'])).toEqual({
    bn: BigInt(123),
  });

  await schema.remove(['bn']);
  expect(await schema.select()).toEqual({
    buf: Buffer.from('123'),
    any: '123',
    num: 0,
  });

  await schema.remove();
  expect(await schema.select()).toEqual({});
});

test('HashSet', async () => {
  const hashSet = kvStore.HashSet('HashSet');

  expect(await hashSet.get('A')).toEqual(undefined);
  await hashSet.set('A');
  expect(await hashSet.get('A')).toEqual(true);
  await hashSet.set('A');
  expect(await hashSet.get('A')).toEqual(true);
  await hashSet.del('A');
  expect(await hashSet.get('A')).toEqual(undefined);
  await hashSet.del('A');
  expect(await hashSet.get('A')).toEqual(undefined);

  expect(await hashSet.list()).toEqual([]);
  await hashSet.set('X');
  await hashSet.set('Y');
  await hashSet.set('X');
  await hashSet.set('Z');
  await hashSet.set('M');
  await hashSet.set('N');

  expect(await hashSet.list()).toEqual(['M', 'N', 'X', 'Y', 'Z']);
  expect(await hashSet.list({ start: 'N', stop: 'Y' })).toEqual(['N', 'X', 'Y']);
  expect(await hashSet.list({ reverse: true, limit: 3 })).toEqual(['Z', 'Y', 'X']);

  await hashSet.clear();
  expect(await hashSet.list()).toEqual([]);
});

test('IndexMap', async () => {
  const IndexMap = kvStore.IndexMap('IndexMap');
  await IndexMap.set(1, 'A');
  await IndexMap.set(1, 'A1');
  await IndexMap.set(2, '');
  await IndexMap.set(3, 'C');
  await IndexMap.set(5, 'E');
  await IndexMap.set(6, 'F');
  await IndexMap.set(6, 'F1');
  await IndexMap.set(9, 'I');

  const list = await IndexMap.entries({ start: 2, stop: 6 });
  expect(list).toEqual([
    { path: '/IndexMap:0000000000002', key: '0000000000002', value: '' },
    { path: '/IndexMap:0000000000003', key: '0000000000003', value: 'C' },
    { path: '/IndexMap:0000000000005', key: '0000000000005', value: 'E' },
    { path: '/IndexMap:0000000000006', key: '0000000000006', value: 'F1' },
  ]);
});

test('IndexSet', async () => {
  const indexSet = kvStore.IndexSet('IndexSet');
  await indexSet.set(1, 'A');
  await indexSet.set(1, 'A1');
  await indexSet.set(2, '');
  await indexSet.set(3, 'C');
  await indexSet.set(5, 'E');
  await indexSet.set(6, 'F');
  await indexSet.set(6, 'F1');
  await indexSet.set(9, 'I');

  expect(await indexSet.keys({ start: 2, stop: 3 })).toEqual([2, 3]);

  const list = await indexSet.entries({ start: 2, stop: 6 });
  expect(list).toEqual([
    { path: '/IndexSet:0000000000002,', key: '0000000000002', value: '' },
    { path: '/IndexSet:0000000000003,C', key: '0000000000003', value: 'C' },
    { path: '/IndexSet:0000000000005,E', key: '0000000000005', value: 'E' },
    { path: '/IndexSet:0000000000006,F', key: '0000000000006', value: 'F' },
    { path: '/IndexSet:0000000000006,F1', key: '0000000000006', value: 'F1' },
  ]);
});

test('Stack', async () => {
  const stack = kvStore.Stack('Stack');

  expect(await stack.pop(-1)).toEqual([]);

  expect(await stack.pop(5)).toEqual([]);
  expect(await stack.size()).toEqual(0);

  expect(await stack.push('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')).toEqual(10);

  expect(await stack.keys({ start: 2, stop: 3 })).toEqual([2, 3]);

  expect(await stack.size()).toEqual(10);
  expect(await stack.keys({ skip: 2, limit: 5, reverse: true })).toEqual([7, 6, 5, 4, 3]);
  expect(await stack.values({ skip: 2, limit: 5, reverse: true })).toEqual(['7', '6', '5', '4', '3']);

  expect(await stack.pop(3)).toEqual(['9', '8', '7']);
  expect(await stack.size()).toEqual(7);

  expect(await stack.pop(0)).toEqual([]);
  expect(await stack.size()).toEqual(7);

  expect(await stack.pop(8)).toEqual(['6', '5', '4', '3', '2', '1', '0']);
  expect(await stack.size()).toEqual(0);

  expect(await stack.pop(2)).toEqual([]);
  expect(await stack.size()).toEqual(0);
});

afterAll(async () => {
  await kvStore.database.close();
});
