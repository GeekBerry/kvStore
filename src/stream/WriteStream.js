const assert = require('assert');

class WriteStream {
  constructor(size = 0) {
    this._buffer = Buffer.allocUnsafe(size);
    this._index = 0;
  }

  write(value) {
    assert(Buffer.isBuffer(value), 'value must be Buffer');

    value.copy(this._buffer, this._index);
    this._index += value.length;
  }

  writeNumber(value = 0) {
    assert(Number.isFinite(value), 'value must be finite Number');

    this._buffer.writeDoubleBE(value, this._index);
    this._index += 8;
  }

  writeUInt(value = 0, size = 6) {
    assert(Number.isInteger(value), 'value must be integer Number');

    this._buffer.writeUIntBE(value, this._index, size);
    this._index += size;
  }

  writeBigUInt(value = 0, size = 8) {
    if (size === 8) {
      this._buffer.writeBigUInt64BE(BigInt(value), this._index);
      this._index += size;
    } else {
      this.writeHex(BigInt(value).toString(16), size);
    }
  }

  writeHex(hex = '', size) {
    assert(typeof hex === 'string', 'hex must be string');

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
