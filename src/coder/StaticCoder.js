/* eslint-disable no-use-before-define */

const lodash = require('lodash');
const ReadStream = require('../stream/ReadStream');
const WriteStream = require('../stream/WriteStream');

const MAX_INT_SIZE = 6;

class StaticCoder {
  static from(schema) {
    const coder = NumberCoder.from(schema)
      || UIntCoder.from(schema)
      || IntCoder.from(schema)
      || HexCoder.from(schema)
      || BufferCoder.from(schema)
      || TupleCoder.from(schema)
      || SchemaCoder.from(schema)
      || NullCoder.from(schema);

    if (!coder) {
      throw new Error(`can not create coder by schema ${schema}`);
    }
    return coder;
  }

  constructor(size = 0) {
    this.size = size;
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
    if (schema === null) {
      return new this();
    }
    return undefined;
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
    if (schema === Number) {
      return new this();
    }
    return undefined;
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

class UIntCoder extends StaticCoder {
  static from(schema) {
    if (lodash.isString(schema)) {
      const [/* uint */, bits] = schema.match(/^uint([0-9]*)$/) || [];
      if (bits !== undefined) {
        const size = bits === '' ? MAX_INT_SIZE : Math.ceil(Number(bits) / 8);
        return new this(size);
      }
    }
    return undefined;
  }

  constructor(size) {
    super(size);
    this.min = this.isBigInt() ? BigInt(0) : 0;
    this.max = this.isBigInt() ? (BigInt(1) << BigInt(8 * size)) - BigInt(1) : 2 ** (8 * size) - 1; // eslint-disable-line no-bitwise
  }

  isBigInt() {
    return this.size > MAX_INT_SIZE;
  }

  write(stream, value) {
    if (value === Infinity) {
      value = this.max;
    }
    return this.isBigInt() ? stream.writeBigUInt(value, this.size) : stream.writeUInt(value, this.size);
  }

  read(stream) {
    return this.isBigInt() ? stream.readBigUInt(this.size) : stream.readUInt(this.size);
  }
}

class IntCoder extends UIntCoder {
  static from(schema) {
    if (lodash.isString(schema)) {
      const [/* int */, bits] = schema.match(/^int([0-9]*)$/) || [];
      if (bits !== undefined) {
        const size = bits === '' ? MAX_INT_SIZE : Math.ceil(Number(bits) / 8);
        return new this(size);
      }
    }
    return undefined;
  }

  constructor(size) {
    super(size);
    this.offset = this.isBigInt() ? BigInt(1) << (BigInt(size * 8 - 1)) : 2 ** (size * 8 - 1); // eslint-disable-line no-bitwise
    this.min -= this.offset;
    this.max -= this.offset;
  }

  write(stream, value) {
    if (value === Infinity) {
      value = this.max;
    } else if (value === -Infinity) {
      value = this.min;
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
    if (lodash.isString(schema)) {
      const [/* hex */, chars] = schema.match(/^hex([0-9]+)$/) || [];
      if (chars !== undefined) {
        return new this(Number(chars));
      }
    }
    return undefined;
  }

  constructor(chars) {
    super(Math.ceil(chars / 2));
  }

  write(stream, value) {
    return stream.writeHex(value, this.size);
  }

  read(stream) {
    return stream.readHex(this.size);
  }
}

class BufferCoder extends StaticCoder {
  static from(schema) {
    if (lodash.isString(schema)) {
      const [/* buffer */, size] = schema.match(/^buffer([0-9]+)$/) || [];
      if (size !== undefined) {
        return new this(Number(size));
      }
    }
    return undefined;
  }

  write(stream, bytes) {
    let buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
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
    if (Array.isArray(schema)) {
      return new this(schema);
    }
    return undefined;
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
    if (lodash.isPlainObject(schema)) {
      return new this(schema);
    }
    return undefined;
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
