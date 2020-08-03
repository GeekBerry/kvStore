const DynamicCoder = require('../../src/coder/DynamicCoder');

test('static', () => {
  const coder = DynamicCoder.from('uint');

  const buffer = coder.encode(1);
  expect(buffer.toString('hex')).toEqual('000000000001');

  expect(coder.decode(buffer)).toEqual(1);
});

test('Buffer', () => {
  const coder = DynamicCoder.from('buffer');

  const buffer = coder.encode(Buffer.from('abcd'));
  expect(buffer.toString('hex')).toEqual('61626364');

  expect(coder.decode(buffer)).toEqual(Buffer.from('abcd'));
});

test('String', () => {
  const coder = DynamicCoder.from('string');

  const buffer = coder.encode('abcd');
  expect(buffer.toString('hex')).toEqual('61626364');

  expect(coder.decode(buffer)).toEqual('abcd');
});

test('JSON', () => {
  const coder = DynamicCoder.from('json');

  const buffer = coder.encode({ uint: 1, hex: 'a' });
  expect(buffer.toString()).toEqual('{"uint":1,"hex":"a"}');

  expect(coder.decode(buffer)).toEqual({ hex: 'a', uint: 1 });
});

describe('Array', () => {
  test('static', () => {
    const coder = DynamicCoder.from(['uint']);

    const buffer = coder.encode([1, 2, 3]);
    expect(buffer.toString('hex')).toEqual('000000000003000000000001000000000002000000000003');

    expect(coder.decode(buffer)).toEqual([1, 2, 3]);
  });

  test('dynamic', () => {
    const coder = DynamicCoder.from(['string']);

    const buffer = coder.encode(['a', 'b']);
    expect(buffer.toString('hex')).toEqual('0000000000020000000000016100000000000162');

    expect(coder.decode(buffer)).toEqual(['a', 'b']);
  });

  test('array', () => {
    const coder = DynamicCoder.from([['uint']]);

    const buffer = coder.encode([[1, 100], [2, 200]]);
    expect(buffer.toString('hex')).toEqual('0000000000020000000000020000000000010000000000640000000000020000000000020000000000c8');

    expect(coder.decode(buffer)).toEqual([[1, 100], [2, 200]]);
  });

  test('object', () => {
    const coder = DynamicCoder.from([{ age: 'uint' }]);

    const buffer = coder.encode([{ age: 1 }, { age: 2 }, { age: 3 }]);
    expect(buffer.toString('hex')).toEqual('000000000003000000000001000000000002000000000003');

    expect(coder.decode(buffer)).toEqual([{ age: 1 }, { age: 2 }, { age: 3 }]);
  });
});

describe('Object', () => {
  test('static dynamic', () => {
    const coder = DynamicCoder.from({ str: 'string', uint: 'uint' });

    const buffer = coder.encode({ str: 'abcd', uint: 1, undefined: null });
    expect(buffer.toString('hex')).toEqual('00000000000461626364000000000001');

    expect(coder.decode(buffer)).toEqual({ str: 'abcd', uint: 1 });
  });

  test('array, object', () => {
    const coder = DynamicCoder.from({ array: ['string'], object: { uint: 'uint' } });

    const buffer = coder.encode({ array: ['a', 'b'], object: { uint: 1, undefined: null } });
    expect(buffer.toString('hex')).toEqual('0000000000020000000000016100000000000162000000000001');

    expect(coder.decode(buffer)).toEqual({ array: ['a', 'b'], object: { uint: 1 } });
  });
});
