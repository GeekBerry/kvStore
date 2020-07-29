/* eslint-disable no-use-before-define */

const assert = require('assert');
const lodash = require('lodash');
const ReadStream = require('../stream/ReadStream');
const StaticCoder = require('./StaticCoder');

const UINT_CODER = StaticCoder.from('uint');

class DynamicCoder {
  static from(schema) {
    for (const CoderType of [
      StaticCoder.NullCoder,
      StaticCoder.UIntCoder,
      StaticCoder.IntCoder,
      StaticCoder.HexCoder,
      StaticCoder.NumberCoder,
      StaticCoder.BufferCoder,
      BufferCoder,
      StringCoder,
      JsonCoder,
      ArrayCoder,
      ObjectCoder,
    ]) {
      try {
        return CoderType.from(schema);
      } catch (e) {
        // pass
      }
    }

    throw new Error(`can not DynamicCoder coder by schema ${schema}`);
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
    assert(schema === 'buffer' || schema === Buffer);

    return new this();
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
    assert(schema === 'string' || schema === String);

    return new this();
  }

  decode(buffer) {
    return buffer.toString();
  }
}

class JsonCoder extends BufferCoder {
  static from(schema) {
    assert(schema === 'json' || schema === JSON);

    return new this();
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
    assert(Array.isArray(schema) && schema.length === 1);

    return new this(schema);
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
    const bufferArray = [UINT_CODER.encode(array.length)];

    array.forEach(value => {
      const buffer = this.coder.encode(value);
      if (this.coder instanceof BufferCoder) {
        bufferArray.push(UINT_CODER.encode(buffer.length));
      }
      bufferArray.push(buffer);
    });

    return Buffer.concat(bufferArray);
  }
}

class ObjectCoder extends DynamicCoder {
  static from(schema) {
    assert(lodash.isPlainObject(schema));

    return new this(schema);
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
    const bufferArray = [];

    lodash.forEach(this.coderTable, (coder, key) => {
      const buffer = coder.encode(object[key]);
      if (coder instanceof BufferCoder) {
        bufferArray.push(UINT_CODER.encode(buffer.length));
      }
      bufferArray.push(buffer);
    });

    return Buffer.concat(bufferArray);
  }
}

module.exports = DynamicCoder;
module.exports.BufferCoder = BufferCoder;
module.exports.StringCoder = StringCoder;
module.exports.JsonCoder = JsonCoder;
module.exports.ArrayCoder = ArrayCoder;
module.exports.ObjectCoder = ObjectCoder;
