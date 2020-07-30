/* eslint-disable no-use-before-define */

const assert = require('assert');
const lodash = require('lodash');
const ReadStream = require('../stream/ReadStream');
const WriteStream = require('../stream/WriteStream');

const MAX_INT_SIZE = 6;

class StaticCoder {
  static from(schema) {
    for (const CoderType of [
      NullCoder,
      BooleanCoder,
      UIntCoder,
      IntCoder,
      HexCoder,
      NumberCoder,
      BufferCoder,
      TupleCoder,
      SchemaCoder,
    ]) {
      try {
        return CoderType.from(schema);
      } catch (e) {
        // pass
      }
    }

    throw new Error(`can not StaticCoder coder by schema ${schema}`);
  }

  constructor(size = 0) {
    assert(Number.isInteger(size) && size >= 0, 'size must be unsigned integer');

    this.size = size;
  }

  get minBuffer() {
    return Buffer.alloc(this.size);
  }

  get maxBuffer() {
    return Buffer.allocUnsafe(this.size).fill(0xff);
  }

  write() {
    throw new Error(`NotImplementError: ${this.constructor.name}.write not implement`);
  }

  read() {
    throw new Error(`NotImplementError: ${this.constructor.name}.read not implement`);
  }

  encode(value) {
    const stream = new WriteStream(this.size);
    this.write(stream, value);
    return stream.toBuffer();
  }

  decode(buffer) {
    const stream = new ReadStream(buffer);
    return this.read(stream);
  }
}

class NullCoder extends StaticCoder {
  static from(schema) {
    assert(schema === 'null' || schema === null);

    return new this();
  }

  write() {
    // pass
  }

  read() {
    return null;
  }
}

class NumberCoder extends StaticCoder {
  static from(schema) {
    assert(schema === 'number' || schema === Number);

    return new this();
  }

  constructor() {
    super(8);
  }

  write(stream, number) {
    stream.writeNumber(number);
  }

  read(stream) {
    return stream.readNumber();
  }
}

class BooleanCoder extends StaticCoder {
  static from(schema) {
    assert(schema === 'boolean' || schema === Boolean);

    return new this();
  }

  constructor() {
    super(1);
  }

  write(stream, value) {
    stream.writeUInt(value ? 1 : 0, this.size);
  }

  read(stream) {
    return Boolean(stream.readUInt(this.size));
  }
}

class UIntCoder extends StaticCoder {
  static from(schema) {
    const [/* uint */, bits] = schema.match(/^uint([0-9]*)$/) || [];
    const size = bits === '' ? MAX_INT_SIZE : Math.ceil(Number(bits) / 8);
    return new this(size);
  }

  isBigInt() {
    return this.size > MAX_INT_SIZE;
  }

  write(stream, value) {
    if (value === Infinity) {
      return stream.write(this.maxBuffer);
    }
    return this.isBigInt() ? stream.writeBigUInt(value, this.size) : stream.writeUInt(value, this.size);
  }

  read(stream) {
    return this.isBigInt() ? stream.readBigUInt(this.size) : stream.readUInt(this.size);
  }
}

class IntCoder extends UIntCoder {
  static from(schema) {
    const [/* int */, bits] = schema.match(/^int([0-9]*)$/) || [];
    const size = bits === '' ? MAX_INT_SIZE : Math.ceil(Number(bits) / 8);
    return new this(size);
  }

  constructor(size) {
    super(size);
    this.offset = this.isBigInt() ? BigInt(1) << (BigInt(size * 8 - 1)) : 2 ** (size * 8 - 1); // eslint-disable-line no-bitwise
  }

  write(stream, value) {
    if (value === Infinity) {
      return stream.write(this.maxBuffer);
    } else if (value === -Infinity) {
      return stream.write(this.minBuffer);
    } else if (this.isBigInt()) {
      value = BigInt(value);
    }
    return super.write(stream, value + this.offset);
  }

  read(stream) {
    const value = super.read(stream);
    return (this.isBigInt() ? BigInt(value) : value) - this.offset;
  }
}

class HexCoder extends StaticCoder {
  static from(schema) {
    const [/* hex */, chars] = schema.match(/^hex([0-9]+)$/) || [];
    return new this(Number(chars));
  }

  constructor(chars) {
    super(Math.ceil(chars / 2));
  }

  write(stream, value) {
    if (value === Infinity) {
      return stream.write(this.maxBuffer);
    }
    return stream.writeHex(value, this.size);
  }

  read(stream) {
    return stream.readHex(this.size);
  }
}

class BufferCoder extends StaticCoder {
  static from(schema) {
    const [/* buffer */, size] = schema.match(/^buffer([0-9]+)$/) || [];
    return new this(Number(size));
  }

  write(stream, value) {
    if (value === Infinity) {
      return stream.write(this.maxBuffer);
    }

    let buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
    if (buffer.length > this.size) {
      buffer = buffer.slice(0, this.size);
    } else if (buffer.length < this.size) {
      buffer = Buffer.concat([buffer], this.size);
    }
    return stream.write(buffer);
  }

  read(stream) {
    let buffer = stream.read(this.size);
    if (buffer.length < this.size) {
      buffer = Buffer.concat([buffer], this.size);
    }
    return buffer;
  }
}

class TupleCoder extends StaticCoder {
  static from(schema) {
    assert(Array.isArray(schema));

    return new this(schema);
  }

  constructor(array) {
    super();
    this.length = array.length;
    this.typeArray = array.map(value => {
      const type = StaticCoder.from(value);
      this.size += type.size;
      return type;
    });
  }

  write(stream, array) {
    this.typeArray.forEach((type, index) => {
      type.write(stream, array[index]);
    });
  }

  read(stream) {
    return this.typeArray.map(type => type.read(stream));
  }
}

class SchemaCoder extends StaticCoder {
  static from(schema) {
    assert(lodash.isPlainObject(schema));

    return new this(schema);
  }

  constructor(schema) {
    super();
    this.typeObject = lodash.mapValues(schema, value => {
      const type = StaticCoder.from(value);
      this.size += type.size;
      return type;
    });
  }

  write(stream, object) {
    lodash.forEach(this.typeObject, (type, key) => {
      type.write(stream, object[key]);
    });
  }

  read(stream) {
    return lodash.mapValues(this.typeObject, type => type.read(stream));
  }
}

module.exports = StaticCoder;
module.exports.NullCoder = NullCoder;
module.exports.NumberCoder = NumberCoder;
module.exports.UIntCoder = UIntCoder;
module.exports.IntCoder = IntCoder;
module.exports.HexCoder = HexCoder;
module.exports.BufferCoder = BufferCoder;
module.exports.TupleCoder = TupleCoder;
module.exports.SchemaCoder = SchemaCoder;
