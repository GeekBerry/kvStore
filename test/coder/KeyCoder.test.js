const KeyCoder = require('../../src/coder/KeyCoder');

const PREFIX = Buffer.from([0xfc]);

let coder;
let buffer;

test('Static', () => {
  coder = KeyCoder.from(PREFIX, 'uint');

  buffer = coder.encode(1);
  expect(buffer.toString('hex')).toEqual('fc000000000001');
  expect(coder.decode(buffer)).toEqual(1);

  expect(coder.filter()).toEqual({
    gte: Buffer.from('fc000000000000', 'hex'),
    lte: Buffer.from('fcffffffffffff', 'hex'),
  });

  expect(coder.filter(0, Infinity)).toEqual({
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
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter({ name: '', age: 0 }, { name: Infinity, age: Infinity })).toEqual({
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter({ name: 'a', age: 1 }, { age: 1, name: 'b' })).toEqual({
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
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter([0, ''], [Infinity, Infinity])).toEqual({
    gte: Buffer.from('fc000000000000', 'hex'),
    lt: Buffer.from('fd000000000000', 'hex'),
  });

  expect(coder.filter([1, 'a'], [1, 'b'])).toEqual({
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
    gte: Buffer.from('fc', 'hex'),
    lt: Buffer.from('fd', 'hex'),
  });

  expect(coder.filter('', Infinity)).toEqual({
    gte: Buffer.from('fc', 'hex'),
    lt: Buffer.from('fd', 'hex'),
  });

  expect(coder.filter('a', 'a')).toEqual({
    gte: Buffer.from('fc61', 'hex'),
    lte: Buffer.from('fc61', 'hex'),
  });
});
