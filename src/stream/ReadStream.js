const assert = require('assert');

class ReadStream {
  constructor(buffer, start = 0) {
    this._buffer = buffer;
    this._index = start;
  }

  read(size) {
    assert(Number.isInteger(size), `size must be integer got "${size}"`);

    const buffer = this._buffer.slice(this._index, this._index + size);
    this._index += size;
    return buffer;
  }

  readNumber() {
    const number = this._buffer.readDoubleBE(this._index);
    this._index += 8;
    return number;
  }

  readUInt(size = 6) {
    const value = this._buffer.readUIntBE(this._index, size);
    this._index += size;
    return value;
  }

  readBigUInt(size = 8) {
    if (size === 8) {
      this._index += size;
      return this._buffer.readBigUInt64BE(this._index - size);
    } else {
      return BigInt(this.readHex(size));
    }
  }

  readHex(size) {
    return `0x${this.read(size).toString('hex')}`;
  }
}

module.exports = ReadStream;
