/* eslint-disable no-use-before-define */

const lodash = require('lodash');
const ReadStream = require('../stream/ReadStream');
const WriteStream = require('../stream/WriteStream');

class StaticCoder {
  static from(schema) {
    const coder = NumberCoder.from(schema)
      || UIntCoder.from(schema)
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
        return new this(bits ? Number(bits) : undefined);
      }
    }
    return undefined;
  }

  constructor(bits = 48) {
    super(Math.ceil(bits / 8));
  }

  write(stream, value) {
    return this.size <= 6
      ? stream.writeUInt(value, this.size)
      : stream.writeBigUInt(value, this.size);
  }

  read(stream) {
    return this.size <= 6
      ? stream.readUInt(this.size)
      : stream.readBigUInt(this.size);
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
