module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    BigInt: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'class-methods-use-this': 0,
    'max-len': 0, // for doc
    'no-await-in-loop': 0, // async for loop
    'no-else-return': 0, // for switch insert or update
    'no-ex-assign': 0,// for wrap error
    'no-restricted-syntax': 0, // async for loop
    'func-names': 0, // for router
    'function-paren-newline': 0, // for router
    'no-param-reassign': 0,
    'linebreak-style': 0,
    'no-underscore-dangle': 0,
    'object-curly-newline': 0,
    'prefer-destructuring': 0, // for blocks = tx.blocks
    'quote-props': 0, // for const.DURATION_TO_SPAN
  },
};
