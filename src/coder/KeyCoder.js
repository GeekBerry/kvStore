/* eslint-disable no-use-before-define */

const assert = require('assert');
const lodash = require('lodash');
const ReadStream = require('../stream/ReadStream');
const WriteStream = require('../stream/WriteStream');
const StaticCoder = require('./StaticCoder');
const DynamicCoder = require('./DynamicCoder');

/**
 * @param buffer {Buffer}
 * @return {Buffer|undefined}
 */
function incBuffer(buffer) {
  buffer = Buffer.from(buffer); // copy

  let carry = 1;
  for (let index = buffer.length - 1; index >= 0; index -= 1) {
    const byte = buffer[index] + carry;
    buffer[index] = byte;
    carry = byte > 0xff ? 1 : 0;
  }
  return carry ? undefined : buffer;
}

// ============================================================================
class KeyCoder {
  static from(prefixBuffer, schema) {
    assert(Buffer.isBuffer(prefixBuffer), 'prefixBuffer must be Buffer');

    for (const CoderType of [
      StaticKeyCoder,
      StaticDynamicTupleKeyCoder,
      StaticDynamicObjectKeyCoder,
      DynamicKeyCoder,
    ]) {
      try {
        return CoderType.from(prefixBuffer, schema);
      } catch (e) {
        // pass
      }
    }

    throw new Error(`can not create KeyCoder by schema ${schema}`);
  }

  constructor(prefixBuffer) {
    this.prefixBuffer = prefixBuffer;
  }

  filter() {
    throw new Error(`NotImplementError: ${this.constructor.name}.filter not implement`);
  }

  read() {
    throw new Error(`NotImplementError: ${this.constructor.name}.read not implement`);
  }

  encode() {
    throw new Error(`NotImplementError: ${this.constructor.name}.encode not implement`);
  }

  decode(buffer) {
    const stream = new ReadStream(buffer);
    const prefixBuffer = stream.read(this.prefixBuffer.length);
    assert(prefixBuffer.equals(this.prefixBuffer), `read prefixBuffer "${prefixBuffer.toString('hex')}" !== "${this.prefixBuffer.toString('hex')}"`);
    return this.read(stream);
  }
}

class StaticKeyCoder extends KeyCoder {
  static from(prefixBuffer, schema) {
    const staticCoder = StaticCoder.from(schema);

    return new this(prefixBuffer, staticCoder);
  }

  constructor(prefixBuffer, coder) {
    super(prefixBuffer);
    this.coder = coder;
    this.MIN_KEY = Buffer.concat([this.prefixBuffer, Buffer.alloc(this.coder.size)]);
    this.MAX_KEY = Buffer.concat([this.prefixBuffer, Buffer.allocUnsafe(this.coder.size).fill(0xff)]);
  }

  filter({ min, max, limit = Infinity, reverse = false, keys = true, values = true } = {}) {
    const filter = { reverse, keys, values };
    filter.limit = limit === Infinity ? -1 : limit;
    filter.gte = min === undefined ? this.MIN_KEY : this.encode(min);
    filter.lte = max === undefined ? this.MAX_KEY : this.encode(max);
    return filter;
  }

  read(stream) {
    return this.coder.read(stream);
  }

  encode(value) {
    const stream = new WriteStream(this.prefixBuffer.length + this.coder.size);
    stream.write(this.prefixBuffer);
    this.coder.write(stream, value);
    return stream.toBuffer();
  }
}

class StaticDynamicObjectKeyCoder extends StaticKeyCoder {
  static from(prefixBuffer, schema) {
    assert(lodash.isPlainObject(schema), 'schema must be object');

    const keys = lodash.keys(schema);
    const staticKeys = lodash.initial(keys);
    const dynamicKey = lodash.last(keys);

    const staticCoder = StaticCoder.from(lodash.pick(schema, staticKeys));
    const dynamicCoder = DynamicCoder.from(schema[dynamicKey]);
    return new this(prefixBuffer, staticCoder, dynamicCoder, dynamicKey);
  }

  constructor(prefixBuffer, staticCoder, dynamicCoder, dynamicKey) {
    super(prefixBuffer, staticCoder);
    this.dynamicCoder = dynamicCoder;
    this.dynamicKey = dynamicKey;
  }

  filter({ min, max = Infinity, limit = Infinity, reverse = false, keys = true, values = true } = {}) {
    const filter = { reverse, keys, values };
    filter.limit = limit === Infinity ? -1 : limit;
    filter.gte = min === undefined ? this.MIN_KEY : this.encode(min);

    if (max === Infinity) {
      filter.lt = incBuffer(this.MAX_KEY);
    } else if (max[this.dynamicKey] === Infinity) { // last max element is Infinity
      filter.lt = incBuffer(super.encode(max));
    } else {
      filter.lte = this.encode(max);
    }

    return lodash.pickBy(filter, v => v !== undefined);
  }

  read(stream) {
    const initial = super.read(stream);
    const last = this.dynamicCoder.decode(stream.toBuffer());
    return { ...initial, [this.dynamicKey]: last };
  }

  encode(value) {
    const staticBuffer = super.encode(value);
    const dynamicBuffer = this.dynamicCoder.encode(value[this.dynamicKey]);

    return Buffer.concat([staticBuffer, dynamicBuffer]);
  }
}

class StaticDynamicTupleKeyCoder extends StaticDynamicObjectKeyCoder {
  static from(prefixBuffer, tuple) {
    assert(Array.isArray(tuple), 'tuple must be Array');
    const schema = lodash.fromPairs(tuple.map((v, i) => ([i, v])));
    return super.from(prefixBuffer, schema);
  }

  read(stream) {
    const object = super.read(stream);
    return lodash.values(object);
  }
}

class DynamicKeyCoder extends KeyCoder {
  static from(prefixBuffer, schema) {
    const dynamicCoder = DynamicCoder.from(schema);

    return new this(prefixBuffer, dynamicCoder);
  }

  constructor(prefixBuffer, dynamicCoder) {
    super(prefixBuffer);
    this.dynamicCoder = dynamicCoder;
  }

  filter({ min, max = Infinity, limit = Infinity, reverse = false, keys = true, values = true } = {}) {
    const filter = { reverse, keys, values };
    filter.limit = limit === Infinity ? -1 : limit;
    filter.gte = min === undefined ? this.prefixBuffer : this.encode(min);

    if (max === Infinity) {
      filter.lt = incBuffer(this.prefixBuffer);
    } else {
      filter.lte = this.encode(max);
    }

    return lodash.pickBy(filter, v => v !== undefined);
  }

  read(stream) {
    return this.dynamicCoder.decode(stream.toBuffer());
  }

  encode(value) {
    return Buffer.concat([this.prefixBuffer, this.dynamicCoder.encode(value)]);
  }
}

module.exports = KeyCoder;
