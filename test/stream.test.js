const ReadStream = require('../src/stream/ReadStream');
const WriteStream = require('../src/stream/WriteStream');

test('buffer', () => {
  const wStream = new WriteStream(4);
  wStream.write(Buffer.from([0, 1]));
  wStream.write(Buffer.from([0xfe, 0xff]));

  const buffer = wStream.toBuffer();
  expect(buffer.toString('hex')).toEqual('0001feff');

  const rStream = new ReadStream(buffer);
  expect(rStream.read(1).toString('hex')).toEqual('00');
  expect(rStream.read(2).toString('hex')).toEqual('01fe');
  expect(rStream.read(100).toString('hex')).toEqual('ff');
});

test('Number', () => {
  const wStream = new WriteStream(8);
  wStream.writeNumber(Math.PI);

  const buffer = wStream.toBuffer();
  expect(buffer.toString('hex')).toEqual('400921fb54442d18');

  const rStream = new ReadStream(buffer);
  expect(rStream.readNumber()).toEqual(Math.PI);
});

test('UInt', () => {
  const wStream = new WriteStream(21);
  wStream.writeUInt(1, 1);
  wStream.writeUInt(2, 2);
  wStream.writeUInt(3, 3);
  wStream.writeUInt(4, 4);
  wStream.writeUInt(5, 5);
  wStream.writeUInt(6, 6);
  expect(() => wStream.writeUInt(-1, 6)).toThrow('out of range');
  expect(() => wStream.writeUInt(1, 7)).toThrow('out of range');

  const buffer = wStream.toBuffer();
  expect(buffer.toString('hex')).toEqual('010002000003000000040000000005000000000006');

  const rStream = new ReadStream(buffer);
  expect(rStream.readUInt(1)).toEqual(1);
  expect(rStream.readUInt(2)).toEqual(2);
  expect(rStream.readUInt(3)).toEqual(3);
  expect(rStream.readUInt(4)).toEqual(4);
  expect(rStream.readUInt(5)).toEqual(5);
  expect(rStream.readUInt(6)).toEqual(6);
  expect(() => rStream.readUInt(6)).toThrow('out of range');
});

test('BigUInt', () => {
  const wStream = new WriteStream(20);
  wStream.writeBigUInt(4, 4);
  wStream.writeBigUInt(16, 16);

  const buffer = wStream.toBuffer();
  expect(buffer.toString('hex')).toEqual('0000000400000000000000000000000000000010');

  const rStream = new ReadStream(buffer);
  expect(rStream.readBigUInt(4)).toEqual(BigInt(4));
  expect(rStream.readBigUInt(16)).toEqual(BigInt(16));
  expect(() => rStream.readBigUInt()).toThrow('out of range');
  expect(() => rStream.readBigUInt(16)).toThrow('Cannot convert 0x to a BigInt');
});

test('Hex', () => {
  const wStream = new WriteStream(20);
  wStream.writeHex('0x0123456789abcdef', 4);
  wStream.writeHex('0x0123456789abcdef', 16);

  const buffer = wStream.toBuffer();
  expect(buffer.toString('hex')).toEqual('89abcdef00000000000000000123456789abcdef');

  const rStream = new ReadStream(buffer);
  expect(rStream.readHex(4)).toEqual('0x89abcdef');
  expect(rStream.readHex(16)).toEqual('0x00000000000000000123456789abcdef');
  expect(() => rStream.readHex()).toThrow('size must be integer');
});
