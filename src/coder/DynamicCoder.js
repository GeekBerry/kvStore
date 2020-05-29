/* eslint-disable no-use-before-define */

const lodash = require('lodash');
const ReadStream = require('../stream/ReadStream');
const StaticCoder = require('./StaticCoder');

class DynamicCoder {
  static from(schema) {
    return BufferCoder.from(schema)
      || StringCoder.from(schema)
      || JsonCoder.from(schema)
      || ArrayCoder.from(schema)
      || ObjectCoder.from(schema)
      || StaticCoder.from(schema);
  }

  read() {
    throw new Error(`NotImplementError: ${this.constructor.name}.read not implement`);
  }

  encode() {
    throw new Error(`NotImplementError: ${this.constructor.name}.encode not implement`);
  }

  decode(buffer) {
    const stream = new ReadStream(buffer);
    return this.read(stream);
  }
}

class BufferCoder extends DynamicCoder {
  static from(schema) {
    if (schema === Buffer) {
      return new this();
    }
    return undefined;
  }

  encode(value) {
    value = value === undefined ? Buffer.alloc(0) : value;
    return Buffer.isBuffer(value) ? value : Buffer.from(value);
  }

  decode(buffer) {
    return buffer;
  }
}

class StringCoder extends BufferCoder {
  static from(schema) {
    if (schema === String) {
      return new this();
    }
    return undefined;
  }

  decode(buffer) {
    return buffer.toString();
  }
}

class JsonCoder extends BufferCoder {
  static from(schema) {
    if (schema === JSON) {
      return new this();
    }
    return undefined;
  }

  encode(value) {
    return super.encode(JSON.stringify(value));
  }

  decode(buffer) {
    return buffer.length ? JSON.parse(buffer) : undefined;
  }
}

class ArrayCoder extends DynamicCoder {
  static from(schema) {
    if (Array.isArray(schema)) {
      if (schema.length !== 1) {
        throw new Error(`${this.constructor.name} schema.length must be 1`);
      }
      return new this(schema);
    }
    return undefined;
  }

  constructor(schema) {
    super();
    this.coder = DynamicCoder.from(schema[0]);
  }

  read(stream) {
    const length = stream.readUInt();

    return lodash.range(length).map(() => {
      if (this.coder instanceof BufferCoder) {
        const size = stream.readUInt();
        return this.coder.decode(stream.read(size));
      } else {
        return this.coder.read(stream);
      }
    });
  }

  encode(array) {
    const uintCoder = StaticCoder.from('uint');
    const bufferArray = [uintCoder.encode(array.length)];

    array.forEach(value => {
      const buffer = this.coder.encode(value);
      if (this.coder instanceof BufferCoder) {
        bufferArray.push(uintCoder.encode(buffer.length));
      }
      bufferArray.push(buffer);
    });

    return Buffer.concat(bufferArray);
  }
}

class ObjectCoder extends DynamicCoder {
  static from(schema) {
    if (lodash.isPlainObject(schema)) {
      return new this(schema);
    }
    return undefined;
  }

  constructor(schema) {
    super();
    this.coderTable = lodash.mapValues(schema, DynamicCoder.from);
  }

  read(stream) {
    return lodash.mapValues(this.coderTable, coder => {
      if (coder instanceof BufferCoder) {
        const size = stream.readUInt();
        return coder.decode(stream.read(size));
      } else {
        return coder.read(stream);
      }
    });
  }

  encode(object) {
    const uintCoder = StaticCoder.from('uint');
    const bufferArray = [];

    lodash.forEach(this.coderTable, (coder, key) => {
      const buffer = coder.encode(object[key]);
      if (coder instanceof BufferCoder) {
        bufferArray.push(uintCoder.encode(buffer.length));
      }
      bufferArray.push(buffer);
    });

    return Buffer.concat(bufferArray);
  }
}

module.exports = DynamicCoder;
