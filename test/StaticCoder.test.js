const StaticCoder = require('../src/coder/StaticCoder');

test('null', () => {
  const coder = StaticCoder.from(null);
  expect(coder.size).toEqual(0);

  const buffer = coder.encode();
  expect(buffer.toString('hex')).toEqual('');

  expect(coder.decode(buffer)).toEqual(null);
});

test('Number', () => {
  const coder = StaticCoder.from(Number);
  expect(coder.size).toEqual(8);

  const buffer = coder.encode(Math.PI);
  expect(buffer.toString('hex')).toEqual('400921fb54442d18');

  expect(coder.decode(buffer)).toEqual(Math.PI);
});

describe('UInt', () => {
  test('uint', () => {
    const coder = StaticCoder.from('uint');
    expect(coder.size).toEqual(6);

    const buffer = coder.encode(1);
    expect(buffer.toString('hex')).toEqual('000000000001');

    expect(coder.decode(buffer)).toEqual(1);
  });

  test('uint64', () => {
    const coder = StaticCoder.from('uint64');
    expect(coder.size).toEqual(8);

    const buffer = coder.encode(1);
    expect(buffer.toString('hex')).toEqual('0000000000000001');

    expect(coder.decode(buffer)).toEqual(BigInt(1));
  });
});

describe('Hex', () => {
  test('hex0', () => {
    const coder = StaticCoder.from('hex0');
    expect(coder.size).toEqual(0);

    const buffer = coder.encode('');
    expect(buffer.toString('hex')).toEqual('');

    expect(coder.decode(buffer)).toEqual('0x');
  });

  test('hex1', () => {
    const coder = StaticCoder.from('hex1');
    expect(coder.size).toEqual(1);

    const buffer = coder.encode('a');
    expect(buffer.toString('hex')).toEqual('0a');

    expect(coder.decode(buffer)).toEqual('0x0a');
  });

  test('hex4', () => {
    const coder = StaticCoder.from('hex4');
    expect(coder.size).toEqual(2);

    const buffer = coder.encode('0123456789');
    expect(buffer.toString('hex')).toEqual('6789');

    expect(coder.decode(buffer)).toEqual('0x6789');
  });
});

describe('Buffer', () => {
  test('buffer4', () => {
    const coder = StaticCoder.from('buffer4');
    expect(coder.size).toEqual(4);

    const buffer = coder.encode('abcdefghijklmn');
    expect(buffer.toString('hex')).toEqual('61626364');

    expect(coder.decode(buffer).toString()).toEqual('abcd');
  });

  test('buffer8', () => {
    const coder = StaticCoder.from('buffer8');
    expect(coder.size).toEqual(8);

    const buffer = coder.encode('abcd');
    expect(buffer.toString('hex')).toEqual('6162636400000000');

    expect(coder.decode(buffer).toString()).toEqual('abcd\0\0\0\0');
  });
});

test('Tuple', () => {
  const coder = StaticCoder.from(['uint', 'buffer4']);
  expect(coder.size).toEqual(6 + 4);

  const buffer = coder.encode([1, 'abcd']);
  expect(buffer.toString('hex')).toEqual('00000000000161626364');

  expect(coder.decode(buffer)).toEqual([1, Buffer.from('abcd')]);
});

test('Schema', () => {
  const coder = StaticCoder.from({ uint: 'uint', hex: 'hex4' });
  expect(coder.size).toEqual(6 + 2);

  const buffer = coder.encode({ uint: 1, hex: 'a' });
  expect(buffer.toString('hex')).toEqual('000000000001000a');

  expect(coder.decode(buffer)).toEqual({ uint: 1, hex: '0x000a' });
});
