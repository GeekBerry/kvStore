const assert = require('assert');
const StaticCoder = require('./StaticCoder');

class KeyCoder extends StaticCoder {
  static from(buffer, schema) {
    assert(Buffer.isBuffer(buffer), 'buffer must be Buffer');
    const staticCoder = StaticCoder.from(schema);

    return new this(buffer, staticCoder);
  }

  constructor(buffer, staticCoder) {
    super(buffer.length + staticCoder.size);
    this.buffer = buffer;
    this.coder = staticCoder;
    this.MIN_KEY = Buffer.concat([this.buffer, Buffer.alloc(this.coder.size)]);
    this.MAX_KEY = Buffer.concat([this.buffer, Buffer.allocUnsafe(this.coder.size).fill(0xff)]);
  }

  write(stream, value) {
    stream.write(this.buffer);
    this.coder.write(stream, value);
  }

  read(stream) {
    const buffer = stream.read(this.buffer.length);
    assert(buffer.equals(this.buffer), `read buffer "${buffer.toString('hex')}" !== "${this.buffer.toString('hex')}"`);
    return this.coder.read(stream);
  }
}

module.exports = KeyCoder;
