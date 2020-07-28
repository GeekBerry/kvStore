const KeyCoder = require('../src/coder/KeyCoder');

const PREFIX = Buffer.from([0xfc]);

let coder;
let buffer;

test('Static', () => {
  coder = KeyCoder.from(PREFIX, 'uint');

  buffer = coder.encode(1);
  expect(buffer.toString('hex')).toEqual('fc000000000001');
  expect(coder.decode(buffer)).toEqual(1);

  expect(coder.filter()).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc000000000000', 'hex'),
    lte: Buffer.from('fcffffffffffff', 'hex'),
  });

  expect(coder.filter({ min: 0, max: Infinity })).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc000000000000', 'hex'),
    lte: Buffer.from('fcffffffffffff', 'hex'),
  });
});

test('StaticDynamicObject', () => {
  coder = KeyCoder.from(PREFIX, { age: 'uint', name: 'string' });

  buffer = coder.encode({ age: 1 });
  expect(buffer.toString('hex')).toEqual('fc000000000001');
  expect(coder.decode(buffer)).toEqual({ age: 1, name: '' });

  buffer = coder.encode({ age: 10, name: 'xyz', unexpected: 'haha' });
  expect(buffer.toString('hex')).toEqual('fc00000000000a78797a');
  expect(coder.decode(buffer)).toEqual({ age: 10, name: 'xyz' });

  expect(coder.filter()).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter({ min: { name: '', age: 0 }, max: { name: Infinity, age: Infinity } })).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter({ min: { name: 'a', age: 1 }, max: { age: 1, name: 'b' } })).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc00000000000161', 'hex'),
    lte: Buffer.from('fc00000000000162', 'hex'),
  });
});

test('StaticDynamicTuple', () => {
  coder = KeyCoder.from(PREFIX, ['uint', String]);

  buffer = coder.encode([1]);
  expect(buffer.toString('hex')).toEqual('fc000000000001');
  expect(coder.decode(buffer)).toEqual([1, '']);

  buffer = coder.encode([10, 'xyz']);
  expect(buffer.toString('hex')).toEqual('fc00000000000a78797a');
  expect(coder.decode(buffer)).toEqual([10, 'xyz']);

  expect(coder.filter()).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter({ min: [0, ''], max: [Infinity, Infinity] })).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter({ min: [1, 'a'], max: [1, 'b'] })).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc00000000000161', 'hex'),
    lte: Buffer.from('fc00000000000162', 'hex'),
  });
});

test('Dynamic', () => {
  coder = KeyCoder.from(PREFIX, String);

  buffer = coder.encode('xyz');
  expect(buffer.toString('hex')).toEqual('fc78797a');
  expect(coder.decode(buffer)).toEqual('xyz');

  expect(coder.filter()).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc', 'hex'),
    lt: Buffer.from('fd', 'hex'),
  });

  expect(coder.filter({ min: '', max: Infinity })).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc', 'hex'),
    lt: Buffer.from('fd', 'hex'),
  });

  expect(coder.filter({ min: 'a', max: 'a' })).toEqual({
    reverse: false,
    keys: true,
    values: true,
    limit: -1,
    gte: Buffer.from('fc61', 'hex'),
    lte: Buffer.from('fc61', 'hex'),
  });
});
