function intToHex(int) {
  if (Number.isSafeInteger(int)) {
    return int >= 0
      ? `0x${Number(int).toString(16).padStart(14, '0')}`
      : `-x${Number(-int).toString(16).padStart(14, '0')}`;
  }

  if (int === Infinity) {
    return '0x'.padEnd(2 + 14, 'f');
  }

  if (int === -Infinity) {
    return '-x'.padEnd(2 + 14, 'f');
  }

  throw new Error(`int must be safe integer, got "${int}"`);
}

function hexToInt(string) {
  if (string === undefined) {
    return 0;
  }
  return Number(string);
}

// ============================================================================
function compileFormat(type) {
  if (Array.isArray(type)) {
    const funcArray = type.map(compileFormat);
    return array => array.map((v, i) => funcArray[i](v)).join(',');
  }

  switch (type) {
    case null:
      return () => '';

    case String:
      return v => v;

    case Number:
      return intToHex;

    case Object:
      return v => JSON.stringify(v);

    default:
      throw new Error(`unexpect type "${type}"`);
  }
}

function compileParser(type) {
  if (Array.isArray(type)) {
    const funcArray = type.map(compileParser);

    return hex => {
      const array = hex !== undefined ? hex.split(',') : funcArray.map(() => undefined);
      return array.map((v, i) => funcArray[i](v));
    };
  }

  switch (type) {
    case null:
      return () => null;

    case Number:
      return hexToInt;

    case String:
      return v => v;

    case Object:
      return v => (v === undefined ? {} : JSON.parse(v));

    default:
      throw new Error(`unexpect type "${type}"`);
  }
}

module.exports = {
  intToHex,
  hexToInt,
  compileFormat,
  compileParser,
};
