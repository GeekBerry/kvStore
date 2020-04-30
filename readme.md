# Key value store

## Usage

```javascript
const KVStore = require('@geekberry/kvstore');


async function main() {
  const kvStore = new KVStore({ location: './DATA/LEVEL_DB' });

  await kvStore.set('key', 'value');
  
  await kvStore.get('key'); // value

  await kvStore.del('key');
}
```

[more example](https://github.com/GeekBerry/kvStore/blob/master/test/KVStore.test.js)
