const assert = require('assert');

function deepFreeze(obj, visited = new Set()) {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (visited.has(obj)) return obj;
  visited.add(obj);
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val, visited);
    }
  }
  return obj;
}

const deepFreezeParams = deepFreeze;

const a = { name: 'A' };
const b = { parent: a };
a.child = b;

deepFreeze(a);
assert.ok(Object.isFrozen(a), 'a should be frozen');
assert.ok(Object.isFrozen(b), 'b should be frozen');

const p = { foo: 'bar' };
p.self = p;

deepFreezeParams(p);
assert.ok(Object.isFrozen(p), 'p should be frozen');

console.log('cycle freeze tests passed');
