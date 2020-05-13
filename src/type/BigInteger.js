/* eslint-disable no-extend-native */

// @see https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/BigInt
BigInt.prototype.toJSON = function () {
  return this.toString();
};

class BigInteger {
  constructor(kvStore) {
    this.kvStore = kvStore;
  }

  set(value, delIfZero = true) {
    value = BigInt(value);

    if (delIfZero && value === BigInt(0)) {
      return this.kvStore.del('');
    } else {
      return this.kvStore.set('', value.toString());
    }
  }

  del() {
    return this.kvStore.del('');
  }

  async get() {
    const value = await this.kvStore.get('');
    return value === undefined ? BigInt(0) : BigInt(value);
  }

  async inc(value = 1) {
    let bn = await this.get() || BigInt(0);
    bn += BigInt(value);
    await this.set(bn);
    return bn;
  }

  async dec(value = 1) {
    let bn = await this.get() || BigInt(0);
    bn -= BigInt(value);
    await this.set(bn);
    return bn;
  }
}

module.exports = BigInteger;
