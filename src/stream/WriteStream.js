const assert = require('assert');

class WriteStream {
  constructor(size = 0) {
    this._buffer = Buffer.allocUnsafe(size);
    this._index = 0;
  }

  write(buffer) {
    assert(Buffer.isBuffer(buffer), 'buffer must be Buffer');

    buffer.copy(this._buffer, this._index);
    this._index += buffer.length;
  }

  writeNumber(number = 0) {
    this._buffer.writeDoubleBE(number, this._index);
    this._index += 8;
  }

  writeUInt(value = 0, size = 6) {
    if (value === Infinity) {
      value = 2 ** (size * 8) - 1;
    }

    this._buffer.writeUIntBE(value, this._index, size);
    this._index += size;
  }

  writeBigUInt(value = 0, size = 8) {
    if (value === Infinity) {
      value = (BigInt(1) << BigInt(8 * size)) - BigInt(1); // eslint-disable-line no-bitwise
    }

    if (size === 8) {
      this._buffer.writeBigUInt64BE(BigInt(value), this._index);
      this._index += size;
    } else {
      this.writeHex(BigInt(value).toString(16), size);
    }
  }

  writeHex(hex = '', size) {
    const length = size * 2;

    hex = hex === Infinity ? ''.padEnd(length, 'f') : hex;
    hex = hex.startsWith('0x') ? hex.slice(2) : hex;

    if (hex.length > length) {
      hex = hex.slice(-length);
    } else if (hex.length < length) {
      hex = hex.padStart(length, '0');
    }

    this._buffer.write(hex, this._index, size, 'hex');
    this._index += size;
  }

  toBuffer() {
    return this._buffer;
  }
}

module.exports = WriteStream;
